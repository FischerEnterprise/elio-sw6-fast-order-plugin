<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Validation\Constraints;

use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\Validator\Constraint;

class ValidProductNumber extends Constraint
{

    public const UNKNOWN_PRODUCT_NUMBER_ERROR = 'FEBF_UNKNOWN_PRODUCT_NUMBER_ERROR'; // product was not found in the repository
    public const PRODUCT_UNAVAILABLE_ERROR = 'FEBF_PRODUCT_UNAVAILABLE_ERROR'; // product was found but is not available

    protected static $errorNames = [
        self::UNKNOWN_PRODUCT_NUMBER_ERROR => self::UNKNOWN_PRODUCT_NUMBER_ERROR,
        self::PRODUCT_UNAVAILABLE_ERROR => self::PRODUCT_UNAVAILABLE_ERROR,
    ];

    public string $message = 'The product {{ productNumber }} does not exist or is unavailable';

    // The current sales channel context
    public SalesChannelContext $salesChannelContext;

    // The entity repository for products
    public EntityRepository $productRepository;

    /**
     * @inheritdoc
     */
    public function getRequiredOptions(): array
    {
        return ['salesChannelContext', 'productRepository'];
    }

    /**
     * Get the product entity for the provided product number
     *
     * @param  string $productNumber
     * @return \Shopware\Core\Content\Product\ProductEntity|null
     */
    public function getProduct(string $productNumber)
    {
        $productNumberCriteria = new Criteria();
        $productNumberCriteria->addFilter(new EqualsFilter('productNumber', $productNumber));
        return $this->productRepository->search($productNumberCriteria, $this->salesChannelContext->getContext())->first();
    }
}
