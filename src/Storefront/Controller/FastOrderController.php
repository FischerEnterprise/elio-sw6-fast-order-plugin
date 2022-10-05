<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Storefront\Controller;

use Febf\FastOrderPlugin\Validation\FastOrderFormValidator;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\Framework\Validation\DataValidator;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Page\GenericPageLoaderInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @Route(defaults={"_routeScope"={"storefront"}})
 */
class FastOrderController extends StorefrontController
{

    public GenericPageLoaderInterface $genericPageLoader;
    public DataValidator $dataValidator;
    public FastOrderFormValidator $formValidator;

    public function __construct(GenericPageLoaderInterface $genericPageLoader, DataValidator $dataValidator, FastOrderFormValidator $formValidator)
    {
        $this->genericPageLoader = $genericPageLoader;
        $this->dataValidator = $dataValidator;
        $this->formValidator = $formValidator;
    }

    /**
     * @Route("/fast-order", name="frontend.fast_order.page", methods={"GET"})
     */
    public function show(Request $request, SalesChannelContext $salesChannelContext): Response
    {
        $page = $this->genericPageLoader->load($request, $salesChannelContext);

        return $this->renderStorefront('@FastOrderPlugin/storefront/page/fast-order/_page.html.twig', [
            "page" => $page,
        ]);
    }

    /**
     * @Route("/fast-order", name="frontend.fast_order.store", methods={"POST"})
     */
    public function store(RequestDataBag $data, SalesChannelContext $salesChannelContext): Response
    {
        // validate input data
        $definition = $this->formValidator->validate($salesChannelContext, $data);
        $violations = $this->dataValidator->getViolations($data->all(), $definition);

        dd($violations);
    }
}
