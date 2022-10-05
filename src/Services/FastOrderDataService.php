<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin\Services;

use Febf\FastOrderPlugin\Validation\FastOrderFormValidator;
use UnexpectedValueException;

class FastOrderDataService
{

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
