<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Storefront\Controller;

use Febf\FastOrderPlugin\Services\FastOrderDataService;
use Febf\FastOrderPlugin\Validation\FastOrderFormValidator;
use Shopware\Core\Checkout\Cart\Cart;
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

        // translate custom quantity violations
        $quantityViolations = [];
        foreach ($request->get('quantityViolations', []) as $quantityViolation) {
            $quantityViolations[] = $this->trans($quantityViolation['message'], $quantityViolation['args']);
        }

        return $this->renderStorefront('@FastOrderPlugin/storefront/page/fast-order/_page.html.twig', [
            'page' => $page,
            'quantityViolations' => $quantityViolations,
            'emptyDataViolation' => $request->get('emptyDataViolation', false)
        ]);
    }

    /**
     * @Route("/fast-order", name="frontend.fast_order.store", methods={"POST"})
     */
    public function store(RequestDataBag $data, SalesChannelContext $salesChannelContext, Cart $cart): Response
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

        // check for empty data
        if (count($mergedData) === 0) {
            return $this->returnCustomViolations('emptyDataViolation', true, $data->all());
        }

        // merge provided data with cart
        $cartQuantityViolations = $this->dataService->mergeWithCart($mergedData, $salesChannelContext, $cart);

        // return violations if mergeWithCart failed
        if (count($cartQuantityViolations) > 0) {
            return $this->returnCustomViolations('quantityViolations', $cartQuantityViolations, $data->all());
        }

        dd("Data validated", $mergedData);
    }

    /**
     * Create forward response to return custom violations with data
     *
     * @param  string $violationKey
     * @param  mixed $violationData
     * @param  array $formData
     * @return Response
     */
    private function returnCustomViolations(string $violationKey, $violationData, array $formData): Response
    {
        $violationException = new ConstraintViolationException(new ConstraintViolationList([]), $formData);

        return $this->forwardToRoute('frontend.fast_order.page', [
            'formViolations' => $violationException,
            $violationKey => $violationData
        ]);
    }
}
