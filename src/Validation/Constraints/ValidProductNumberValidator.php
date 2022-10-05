<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Validation\Constraints;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use UnexpectedValueException;

class ValidProductNumberValidator extends ConstraintValidator
{
    /**
     * @inheritdoc
     */
    public function validate($value, Constraint $constraint): void
    {
        // check provided constraint to be the right type
        if (!$constraint instanceof ValidProductNumber) {
            throw new UnexpectedTypeException($constraint, ValidProductNumber::class);
        }

        // ignore null and empty values
        if ($value === null || $value === '') {
            return;
        }

        // passed value must be string
        if (!is_string($value)) {
            throw new UnexpectedValueException($value, 'string');
        }

        // get the product entity
        $productEntity = $constraint->getProduct($value);

        // check for invalid product number
        if ($productEntity === null) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ productNumber }}', $this->formatValue($value))
                ->setCode(ValidProductNumber::UNKNOWN_PRODUCT_NUMBER_ERROR)
                ->addViolation();

            return; // cant do other checks without a valid product entity
        }

        // check if product is available
        if (!$productEntity->getAvailable()) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ productNumber }}', $this->formatValue($value))
                ->setCode(ValidProductNumber::PRODUCT_UNAVAILABLE_ERROR)
                ->addViolation();
        }
    }
}
