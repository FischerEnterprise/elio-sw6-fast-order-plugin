<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Validation\Constraints;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class ValidProductQuantityValidator extends ConstraintValidator
{

    public function validate($value, Constraint $constraint)
    {
        // check provided constraint for right type
        if (!$constraint instanceof ValidProductQuantity) {
            throw new UnexpectedTypeException($constraint, ValidProductQuantity::class);
        }

        // ignore checks if no product number was set
        if ($constraint->productNumber === null || strlen($constraint->productNumber) === 0) {
            return;
        }

        // check for missing value
        if ($value === null || $value === '') {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ quantity }}', $this->formatValue($value))
                ->setCode(ValidProductQuantity::MISSING_QUANTITY_ERROR)
                ->addViolation();

            return; // no other checks should be run without a value
        }

        // passed value must be an integer and greater than zero
        if (!intval($value) || $value <= 0) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ quantity }}', $this->formatValue($value))
                ->setCode(ValidProductQuantity::INVALID_QUANTITY_ERROR)
                ->addViolation();

            return; // no other checks should be run without a valid value
        }

        // get product entity
        $productEntity = $constraint->getProduct();

        // check for invalid product number
        if ($productEntity === null) {
            return; // invalid product numbers are handled by ValidProductNumber validation
        }

        // check for stock availability
        if ($productEntity->getAvailableStock() < intval($value)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ quantity }}', $this->formatValue($value))
                ->setParameter('{{ available }}', $this->formatValue($productEntity->getAvailableStock()))
                ->setCode(ValidProductQuantity::EXCEEDING_STOCK_ERROR)
                ->addViolation();
        }
    }
}
