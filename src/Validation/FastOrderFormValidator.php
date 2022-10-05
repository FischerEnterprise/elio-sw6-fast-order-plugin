<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Validation;

use Febf\FastOrderPlugin\Validation\Constraints\ValidProductNumber;
use Febf\FastOrderPlugin\Validation\Constraints\ValidProductQuantity;
use Psr\EventDispatcher\EventDispatcherInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\Validation\BuildValidationEvent;
use Shopware\Core\Framework\Validation\DataBag\DataBag;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\Framework\Validation\DataValidationDefinition;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

class FastOrderFormValidator
{

    private EventDispatcherInterface $eventDispatcher;
    private EntityRepository $productRepository;

    public function __construct(EventDispatcherInterface $eventDispatcher, EntityRepository $productRepository)
    {
        $this->eventDispatcher = $eventDispatcher;
        $this->productRepository = $productRepository;
    }

    private const VALIDATION_NAME = 'fast_checkout_form.validate';

    // Parts of form field names
    public const FORM_FIELD_PREFIX = "fast-order-";
    public const FORM_FIELD_ARTICLE_NAME = "article-";
    public const FORM_FIELD_QTTY_NAME = "qtty-";

    /**
     * Create a validation definition for fast order form submissions
     *
     * @param  \Shopware\Core\System\SalesChannel\SalesChannelContext $salesChannelContext
     * @param  \Shopware\Core\Framework\Validation\DataBag\RequestDataBag $data
     * @return \Shopware\Core\Framework\Validation\DataValidationDefinition
     */
    public function validate(SalesChannelContext $salesChannelContext, RequestDataBag $data): DataValidationDefinition
    {
        $definition = new DataValidationDefinition(self::VALIDATION_NAME);

        // get field set count
        $fieldSetCount = $this->getFieldSetCount($data);

        // add constraints to all fields
        for ($i = 0; $i < $fieldSetCount; $i++) {

            // build names of current fields
            $articleFieldName = $this->buildFieldName(true, $i);
            $quantityFieldName = $this->buildFieldName(false, $i);

            // add constraint to article number field
            $definition->add($articleFieldName, new ValidProductNumber([
                'salesChannelContext' => $salesChannelContext,
                'productRepository' => $this->productRepository,
            ]));

            // add constraint to quantity field
            $definition->add($quantityFieldName, new ValidProductQuantity([
                'salesChannelContext' => $salesChannelContext,
                'productRepository' => $this->productRepository,
                'productNumber' => $data->get($articleFieldName),
            ]));
        }

        // dispatch validation event
        $validationEvent = new BuildValidationEvent($definition, new DataBag(), $salesChannelContext->getContext());
        $this->eventDispatcher->dispatch($validationEvent, $validationEvent->getName());

        return $definition;
    }

    /**
     * Get the amount of fast order data field sets
     *
     * @param  \Shopware\Core\Framework\Validation\DataBag\RequestDataBag $data
     * @return int
     */
    private function getFieldSetCount(RequestDataBag $data): int
    {
        return count(array_filter($data->all(), function ($fieldName) {
            // count only product number fields
            return str_starts_with($fieldName, self::FORM_FIELD_PREFIX . self::FORM_FIELD_ARTICLE_NAME);
        }, ARRAY_FILTER_USE_KEY));
    }

    /**
     * Build the field name for an article or qtty field
     *
     * @param  bool $isArticleField
     * @param  int $fieldIndex
     * @return string
     */
    private function buildFieldName(bool $isArticleField, int $fieldIndex): string
    {
        return self::FORM_FIELD_PREFIX . ($isArticleField ? self::FORM_FIELD_ARTICLE_NAME : self::FORM_FIELD_QTTY_NAME) . strval($fieldIndex);
    }
}
