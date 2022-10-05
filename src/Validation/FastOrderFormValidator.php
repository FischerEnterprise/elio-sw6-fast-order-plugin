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

    public function validate(SalesChannelContext $salesChannelContext, RequestDataBag $data): DataValidationDefinition
    {
        $definition = new DataValidationDefinition(self::VALIDATION_NAME);

        for ($i = 0; $i < 11; $i++) {
            $definition->add('fast-order-article-' . $i, new ValidProductNumber([
                'salesChannelContext' => $salesChannelContext,
                'productRepository' => $this->productRepository,
            ]));
            $definition->add('fast-order-qtty-' . $i, new ValidProductQuantity([
                'salesChannelContext' => $salesChannelContext,
                'productRepository' => $this->productRepository,
                'productNumber' => $data->get('fast-order-article-' . $i),
            ]));
        }

        // dispatch validation event
        $validationEvent = new BuildValidationEvent($definition, new DataBag(), $salesChannelContext->getContext());
        $this->eventDispatcher->dispatch($validationEvent, $validationEvent->getName());

        return $definition;
    }
}
