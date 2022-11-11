/**
 * Provides functionality to handle creating new rows for the fast order form
 * @author Ben Fischer
 */
export default class FormRowHandler {

    static ROW_CONTAINER_CLASS = 'order-list-row-container'; // the class to be applied to the row container element

    /**
     * Default constructor
     * @param productNumberFieldPlaceholder - Placeholder for product number fields
     * @param quantityFieldPlaceholder - Placeholder for quantity number fields
     * @param productNumberFieldNameSchema - ID Schema for product number fields ($i as placeholder for the index)
     * @param quantityFieldNameSchema - ID Schema for quantity fields ($i as placeholder for the index)
     * @param inputChangedCallback - The callback to be called if any input happens on one of the created inputs
     */
    constructor(productNumberFieldPlaceholder, quantityFieldPlaceholder, productNumberFieldNameSchema, quantityFieldNameSchema, inputChangedCallback) {
        this._productNumberFieldPlaceholder = productNumberFieldPlaceholder;
        this._quantityFieldPlaceholder = quantityFieldPlaceholder;

        // convert name schemas to helper functions
        this._productNumberFieldName = index => productNumberFieldNameSchema.replace(/\$i/, index.toString());
        this._quantityFieldName = index => quantityFieldNameSchema.replace(/\$i/, index.toString());

        this._inputInputCallback = inputChangedCallback;
    }

    /**
     * Create a new form row element
     * @param index - The index of the form row
     * @param productNumberValue - The initial value for the product number field
     * @param quantityValue - The initial value for the quantity value field
     * @returns {HTMLDivElement}
     */
    createFormRow(index, productNumberValue = '', quantityValue = '') {
        const rowContainer = document.createElement('div');
        rowContainer.classList.add(FormRowHandler.ROW_CONTAINER_CLASS, 'row', 'mt-2');

        const productNumberInputContainer = document.createElement('div');
        productNumberInputContainer.classList.add('col-8');

        const quantityInputContainer = document.createElement('div');
        quantityInputContainer.classList.add('col-4');

        const productNumberInputField = this._createInputField(this._productNumberFieldName(index), this._productNumberFieldPlaceholder, 'text', productNumberValue);
        const quantityInputField = this._createInputField(this._quantityFieldName(index), this._quantityFieldPlaceholder, 'text', quantityValue);

        productNumberInputContainer.append(productNumberInputField);
        quantityInputContainer.append(quantityInputField);

        rowContainer.append(productNumberInputContainer, quantityInputContainer);

        return rowContainer;
    }

    /**
     * Create an input field for the form row
     * @param name - The name and id of the input
     * @param placeholder - The placeholder of the input
     * @param type - The type of the input
     * @param initialValue - The initial value of the input
     * @returns {HTMLDivElement}
     * @private
     */
    _createInputField(name, placeholder, type = 'text', initialValue = '') {
        const formGroup = document.createElement('div');
        formGroup.classList.add('form-group', 'mb-0')

        const input = document.createElement('input');
        input.classList.add('form-control');
        input.type = type;
        input.id = name;
        input.name = name;
        input.value = initialValue;
        input.placeholder = placeholder;

        input.addEventListener('input', this._inputInputCallback);

        formGroup.append(input);

        return formGroup;
    }
}
