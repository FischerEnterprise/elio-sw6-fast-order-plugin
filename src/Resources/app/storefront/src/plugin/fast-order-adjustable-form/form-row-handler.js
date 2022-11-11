export default class FormRowHandler {

    static ROW_CONTAINER_CLASS = 'order-list-row-container';

    constructor(productNumberFieldPlaceholder, quantityFieldPlaceholder, productNumberFieldNameSchema, quantityFieldNameSchema, inputChangedCallback) {
        this._productNumberFieldPlaceholder = productNumberFieldPlaceholder;
        this._quantityFieldPlaceholder = quantityFieldPlaceholder;

        this._productNumberFieldName = index => productNumberFieldNameSchema.replace(/\$i/, index.toString());
        this._quantityFieldName = index => quantityFieldNameSchema.replace(/\$i/, index.toString());

        this._inputInputCallback = inputChangedCallback;
    }

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
