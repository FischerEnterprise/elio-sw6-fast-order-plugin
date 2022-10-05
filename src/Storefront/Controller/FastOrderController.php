<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Storefront\Controller;

use Febf\FastOrderPlugin\Services\FastOrderDataService;
use Febf\FastOrderPlugin\Validation\FastOrderFormValidator;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\Framework\Validation\DataValidator;
use Shopware\Core\Framework\Validation\Exception\ConstraintViolationException;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Page\GenericPageLoaderInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * @Route(defaults={"_routeScope"={"storefront"}})
 */
class FastOrderController extends StorefrontController
{

    public GenericPageLoaderInterface $genericPageLoader;
    public DataValidator $dataValidator;
    public FastOrderFormValidator $formValidator;
    public FastOrderDataService $dataService;

    public function __construct(
        GenericPageLoaderInterface $genericPageLoader,
        DataValidator $dataValidator,
        FastOrderFormValidator $formValidator,
        FastOrderDataService $dataService
    ) {
        $this->genericPageLoader = $genericPageLoader;
        $this->dataValidator = $dataValidator;
        $this->formValidator = $formValidator;
        $this->dataService = $dataService;
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

        // return violations if validation failed
        if ($violations->count() > 0) {

            // prepare violations for redirect
            $violationList = new ConstraintViolationList($violations);
            $violationException = new ConstraintViolationException($violationList, $data->all());

            // return to order page via forward
            return $this->forwardToRoute('frontend.fast_order.page', [
                'formViolations' => $violationException
            ]);
        }

        // merge order data
        $mergedData = $this->dataService->mergeOrderData($data->all());

        dd("Data validated", $mergedData);
    }
}
