<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Services;

use Febf\FastOrderPlugin\Validation\FastOrderFormValidator;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\LineItem\LineItem;
use Shopware\Core\Checkout\Cart\LineItemFactoryRegistry;
use Shopware\Core\Checkout\Cart\SalesChannel\CartService;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use UnexpectedValueException;

class FastOrderDataService
{

    private EntityRepository $productRepository;
    private LineItemFactoryRegistry $lineItemFactory;
    private CartService $cartService;

    public function __construct(EntityRepository $productRepository, LineItemFactoryRegistry $lineItemFactory, CartService $cartService)
    {
        $this->productRepository = $productRepository;
        $this->lineItemFactory = $lineItemFactory;
        $this->cartService = $cartService;
    }

    /**
     * Merge and clean fast order data (no unrequired keys / no duplicates)
     *
     * @param  array<string, mixed> $data
     * @return array<string, integer>
     */
    public function mergeOrderData(array $data): array
    {
        $merged = [];

        // process all data fields
        foreach ($data as $fieldName => $productNumber) {
            // only process article number fields
            if (!$this->isArticleNumberField($fieldName)) continue;

            // only process non-empty fields
            if ($productNumber === null || strlen($productNumber) === 0) continue;

            // get field index
            $fieldSetIndex = $this->getArticleNumberFieldIndex($fieldName);

            // get related quantity field
            $quantityValue = $data[$this->getQuantityFieldName($fieldSetIndex)];

            // double check if quantity value is missing (should not be possible after validation)
            if ($quantityValue === null || strlen($quantityValue) === 0 || !intval($quantityValue)) {
                throw new UnexpectedValueException("Quantity value for set with index $fieldSetIndex was expected to be set and integer. \"$quantityValue\" provided.");
            }

            // create index in $merged if required
            if (!array_key_exists($productNumber, $merged)) {
                $merged[$productNumber] = 0;
            }

            // add quantity
            $merged[$productNumber] += intval($quantityValue);
        }

        return $merged;
    }

    /**
     * Merge prepared fast order data with the cart
     *
     * @param  array<string, int> $mergedData
     * @param  \Shopware\Core\System\SalesChannel\SalesChannelContext $salesChannelContext
     * @param  \Shopware\Core\Checkout\Cart\Cart $cart
     * @return array quantity violations or empty array
     */
    public function mergeWithCart(array $mergedData, SalesChannelContext $salesChannelContext, Cart $cart): array
    {
        $quantityViolations = []; // list of detected cart quantity violations
        $newLineItems = []; // cart line items to be newly created
        $quantitiesToAdjust = []; // cart quantities to be adjusted [key=identifier]: value=quantity

        $currentLineItems = $cart->getLineItems(); // current cart's line items
        $lineItemKeyList = array_flip($currentLineItems->getReferenceIds()); // line item keys, indexed by reference id

        // check and prepare order data to be added to the cart
        foreach ($mergedData as $productNumber => $quantity) {

            // get the product
            $productNumberCriteria = new Criteria();
            $productNumberCriteria->addFilter(new EqualsFilter('productNumber', $productNumber));
            $product = $this->productRepository->search($productNumberCriteria, $salesChannelContext->getContext())->first();

            // check if merged quantity exceeds available stock
            if ($quantity > $product->getAvailableStock()) {
                $quantityViolations[] = [
                    'message' => 'error.fast_order.exceeding_stock_detail_line',
                    'args' => [
                        '{{ name }}' => $product->name,
                        '{{ productNumber }}' => $productNumber,
                        '{{ requested }}' => $quantity,
                        '{{ available }}' => $product->getAvailableStock(),
                    ]
                ];

                continue;
            }

            // check if product exists in cart
            if (array_key_exists($product->id, $lineItemKeyList)) {
                // get identifier and quantities
                $lineItemIdentifier = $lineItemKeyList[$product->id];
                $cartQuantity = $currentLineItems->get($lineItemIdentifier)->getQuantity();
                $newQuantity = $cartQuantity + $quantity;

                // if no violation, add info to quantity adjust list
                if ($newQuantity <= $product->getAvailableStock()) {
                    $quantitiesToAdjust[$lineItemIdentifier] = $newQuantity;
                    continue;
                }

                // [ELSE] add violation since quantity would exceed the available stock
                $quantityViolations[] = [
                    'message' => 'error.fast_order.combined_exceeding_stock_detail_line',
                    'args' => [
                        '{{ name }}' => $product->name,
                        '{{ productNumber }}' => $productNumber,
                        '{{ cartQuantity }}' => $cartQuantity,
                        '{{ requested }}' => $quantity,
                        '{{ available }}' => $product->getAvailableStock(),
                    ]
                ];

                continue;
            }

            // [ELSE] product does not exist: create line item for it
            $newLineItems[] = $this->lineItemFactory->create([
                'type' => LineItem::PRODUCT_LINE_ITEM_TYPE,
                'referencedId' => $product->id,
                'quantity' => $quantity,
            ], $salesChannelContext);
        }

        // return violations if we have any
        if (count($quantityViolations) > 0) {
            return $quantityViolations;
        }

        // [IF] no violations: process prepared changes to the cart

        // adjust quantities for existing line items
        foreach ($quantitiesToAdjust as $lineItemIdentifier => $newQuantity) {
            $this->cartService->changeQuantity($cart, $lineItemIdentifier, $newQuantity, $salesChannelContext);
        }

        // add line items for new items
        $this->cartService->add($cart, $newLineItems, $salesChannelContext);

        // return no violations
        return [];
    }

    /**
     * Check if the $fieldName is the name of an article number field
     *
     * @param  string $fieldName
     * @return bool
     */
    private function isArticleNumberField(string $fieldName): bool
    {
        return str_starts_with($fieldName, FastOrderFormValidator::FORM_FIELD_PREFIX . FastOrderFormValidator::FORM_FIELD_ARTICLE_NAME);
    }

    /**
     * Get the index of the provided article field name
     *
     * @param  mixed $fieldName
     * @return int
     */
    private function getArticleNumberFieldIndex(string $fieldName): int
    {
        $index = str_replace(
            FastOrderFormValidator::FORM_FIELD_PREFIX . FastOrderFormValidator::FORM_FIELD_ARTICLE_NAME,
            "",
            $fieldName
        );
        return intval($index);
    }

    /**
     * Generate a quantity field name with the provided index
     *
     * @param  int $index
     * @return string
     */
    private function getQuantityFieldName(int $index): string
    {
        return FastOrderFormValidator::FORM_FIELD_PREFIX . FastOrderFormValidator::FORM_FIELD_QTTY_NAME . strval($index);
    }
}
