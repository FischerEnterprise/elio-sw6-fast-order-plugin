<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Validation\Constraints;

use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\Validator\Constraint;

class ValidProductQuantity extends Constraint
{

    public const MISSING_QUANTITY_ERROR = 'FEBF_MISSING_QUANTITY_ERROR'; // no quantity provided
    public const INVALID_QUANTITY_ERROR = 'FEBF_INVALID_QUANTITY_ERROR'; // provided quantity is not an integer or <= 0
    public const EXCEEDING_STOCK_ERROR = 'FEBF_EXCEEDING_STOCK_ERROR'; // provided quantity exceeds available stock for the product

    protected static $errorNames = [
        self::MISSING_QUANTITY_ERROR => self::MISSING_QUANTITY_ERROR,
        self::INVALID_QUANTITY_ERROR => self::INVALID_QUANTITY_ERROR,
        self::EXCEEDING_STOCK_ERROR => self::EXCEEDING_STOCK_ERROR,
    ];

    public string $message = 'The quantity {{ quantity }} is invalid for this product';

    // The current sales channel context
    public SalesChannelContext $salesChannelContext;

    // The entity repository for products
    public EntityRepository $productRepository;

    // The product number of the product related to this quantity field
    public string $productNumber;

    /**
     * @inheritdoc
     */
    public function getRequiredOptions(): array
    {
        return ['salesChannelContext', 'productRepository', 'productNumber'];
    }

    /**
     * Get the product entity related to this quantity field
     *
     * @return \Shopware\Core\Content\Product\ProductEntity|null
     */
    public function getProduct()
    {
        $productNumberCriteria = new Criteria();
        $productNumberCriteria->addFilter(new EqualsFilter('productNumber', $this->productNumber));
        return $this->productRepository->search($productNumberCriteria, $this->salesChannelContext->getContext())->first();
    }
}
