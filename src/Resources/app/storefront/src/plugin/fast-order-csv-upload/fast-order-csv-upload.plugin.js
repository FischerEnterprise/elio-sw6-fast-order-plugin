import Plugin from "src/plugin-system/plugin.class";
import PluginOptionCheck from "../extensions/plugin-option-check";

export default class FastOrderCsvUploadPlugin extends Plugin {

    static DOM_CLASS_INVALID = 'is-invalid';
    static DOM_CLASS_VALID = 'is-valid';

    static requiredOptions = [
        "columnSelectElements.productNumber",
        "columnSelectElements.amount",
        "invalidFeedbackElements.csvFileInput",
        "invalidFeedbackElements.productNumber",
        "invalidFeedbackElements.amount",
        "manualFormFieldIdSchemas.productNumber",
        "manualFormFieldIdSchemas.amount",
        "csvInputLabel",
        "importButton",
        "manualInputFormTabControl",
        "manualInputFormInputList"
    ];

    static options = {
        errorTexts: {
            'file-input--missing-file': 'A file must be selected',
            'file-input--too-many-files': 'Only one file can be selected',
            'file-input--invalid-file': 'Only CSV files can be selected',

            'import-data--invalid-qtty': 'Your import contains invalid quantities'
        },

        columnSelectElements: {
            productNumber: null,
            amount: null
        },

        invalidFeedbackElements: {
            csvFileInput: null,
            productNumber: null,
            amount: null
        },

        manualFormFieldIdSchemas: {
            productNumber: null,
            amount: null
        },

        csvInputLabel: null,
        importButton: null,

        manualInputFormTabControl: null,

        manualInputFormInputList: null
    };

    init() {
        // check for required options
        PluginOptionCheck.CheckProvidedOptions(this.options, FastOrderCsvUploadPlugin.requiredOptions, this.constructor.name);

        // get control elements related to this plugin
        this._getRelatedControls();

        // check if the required elements could be found
        this._checkRequiredElements({
            '_elements.csvFileInput': this._elements.csvFileInput,
            '_elements.csvInputLabel': this._elements.csvInputLabel,
            '_elements.importButton': this._elements.importButton,
            '_elements.productNumberColumnSelect': this._elements.productNumberColumnSelect,
            '_elements.amountColumnSelect': this._elements.amountColumnSelect,
            '_elements.invalidFeedback.csvFileInput': this._elements.invalidFeedback.csvFileInput,
            '_elements.invalidFeedback.productNumber': this._elements.invalidFeedback.productNumber,
            '_elements.invalidFeedback.amount': this._elements.invalidFeedback.amount,
            '_elements.manualInputFormTabControl': this._elements.manualInputFormTabControl,
            '_elements.manualInputFormInputList': this._elements.manualInputFormInputList
        });

        // store default label text
        this._defaultCsvInputLabelText = this._elements.csvInputLabel.innerText;

        // create class variable for imported data
        this._importData = {};

        // create class variable for column selects status
        this._columnSelectsValid = false;

        // disable column selects and import button
        this._elements.productNumberColumnSelect.setAttribute('disabled', true);
        this._elements.amountColumnSelect.setAttribute('disabled', true);
        this._elements.importButton.setAttribute('disabled', true);

        // add event listeners
        this._addListeners();
    }

    _checkRequiredElements(requiredElements) {
        Object.keys(requiredElements).forEach(code => {
            if (!requiredElements[code])
                throw new Error(`Could not find '${code}' for plugin ${this.constructor.name}`);
        })
    }

    _getRelatedControls() {
        // prepare storage structure
        this._elements = {};
        this._elements.invalidFeedback = {};

        // get csv file input
        if (this.el && this.el.nodeName === 'INPUT' && this.el.getAttribute('type') === 'file') {
            this._elements.csvFileInput = this.el;
        } else {
            this._elements.csvFileInput = this.el.closest('input[type="file"]');
        }

        // get csv input label
        this._elements.csvInputLabel = document.querySelector(this.options.csvInputLabel);

        // get csv input label
        this._elements.importButton = document.querySelector(this.options.importButton);

        // get csv input label
        this._elements.manualInputFormTabControl = document.querySelector(this.options.manualInputFormTabControl);

        // get csv input label
        this._elements.manualInputFormInputList = document.querySelector(this.options.manualInputFormInputList);

        // get product number select input
        this._elements.productNumberColumnSelect = document.querySelector(this.options.columnSelectElements.productNumber);

        // get product number select input
        this._elements.amountColumnSelect = document.querySelector(this.options.columnSelectElements.amount);

        // get csv file input invalid feedback element
        this._elements.invalidFeedback.csvFileInput = document.querySelector(this.options.invalidFeedbackElements.csvFileInput);

        // get product number column select invalid feedback element
        this._elements.invalidFeedback.productNumber = document.querySelector(this.options.invalidFeedbackElements.productNumber);

        // get amount column select invalid feedback element
        this._elements.invalidFeedback.amount = document.querySelector(this.options.invalidFeedbackElements.amount);
    }

    _addListeners() {
        // listen to change events on the csv file input
        this._elements.csvFileInput.addEventListener('change', this._csvFileInputChanged.bind(this));

        // listen to change events on the column selects
        this._elements.productNumberColumnSelect.addEventListener('change', this._checkColumnSelectStates.bind(this));
        this._elements.amountColumnSelect.addEventListener('change', this._checkColumnSelectStates.bind(this));

        // listen to click events on the import button
        this._elements.importButton.addEventListener('click', this._importButtonClicked.bind(this));
    }

    _csvFileInputChanged(event) {
        // only run if target is the plugin's csv file input
        if (event.target !== this._elements.csvFileInput)
            return;

        // clear previous error messages
        this._clearControlError(this._elements.csvFileInput, this._elements.invalidFeedback.csvFileInput);
        this._clearControlError(this._elements.productNumberColumnSelect, this._elements.invalidFeedback.productNumber);
        this._clearControlError(this._elements.amountColumnSelect, this._elements.invalidFeedback.amount);

        // validate the provided file
        const {valid: fileValid, errorCode: fileValidationErrorCode} = this._checkSelectedFile();
        if (!fileValid) {
            this._displayControlError(this._elements.csvFileInput, this._elements.invalidFeedback.csvFileInput, fileValidationErrorCode);
            return;
        }

        // show success feedback on file input
        this._displayControlSuccess(this._elements.csvFileInput);

        // read and parse file contents
        this._processFileContents(this._elements.csvFileInput.files[0]).then(() => {
            this._addColumnSelectOptions();
            this._enableColumnSelects();
            this._elements.csvInputLabel.innerText = this._elements.csvFileInput.files[0].name;
        });
    }

    _checkSelectedFile() {
        // get files from input element
        const files = this._elements.csvFileInput.files;

        // check if any files were provided
        if (!files || files.length === 0)
            return this._generateErrorObject('file-input--missing-file');

        // check if more than one file was provided
        if (files.length > 1)
            return this._generateErrorObject('file-input--too-many-files');

        // check if provided file is of type csv
        if (files[0].type !== 'text/csv')
            return this._generateErrorObject('file-input--invalid-file');

        // generate valid error object
        return this._generateErrorObject(null, true);
    }

    _generateErrorObject(errorCode, valid = false) {
        return {valid, errorCode};
    }

    _displayControlError(inputElement, feedbackElement, errorCode) {
        this._clearControlError(inputElement, feedbackElement);

        inputElement.classList.add(FastOrderCsvUploadPlugin.DOM_CLASS_INVALID);

        feedbackElement.innerText = this.options.errorTexts[errorCode];
    }

    _clearControlError(inputElement, invalidFeedbackElement) {
        invalidFeedbackElement.innerText = '';

        if (inputElement.classList.contains(FastOrderCsvUploadPlugin.DOM_CLASS_INVALID))
            inputElement.classList.remove(FastOrderCsvUploadPlugin.DOM_CLASS_INVALID);
    }

    _displayControlSuccess(inputElement) {
        if (!inputElement.classList.contains(FastOrderCsvUploadPlugin.DOM_CLASS_VALID))
            inputElement.classList.add(FastOrderCsvUploadPlugin.DOM_CLASS_VALID);
    }

    async _processFileContents(file) {
        const fileContents = await this._readFileContents(file) // todo: handle errors

        const csvLines = fileContents.split('\n');
        const csvHeader = csvLines.shift();

        this._importData.headers = csvHeader.split(/[,;]/);

        this._importData.data = csvLines.map(line => line.split(/[,;]/));
    }

    _readFileContents(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsText(file);

            fileReader.onload = function () {
                resolve(fileReader.result);
            }

            fileReader.onerror = function () {
                reject(fileReader.error);
            }
        });
    }

    _addColumnSelectOptions() {
        [this._elements.productNumberColumnSelect, this._elements.amountColumnSelect].forEach(selectElement => {
            const headerOptions = [];

            this._importData.headers.forEach((header, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.innerText = header;
                headerOptions.push(option);
            });

            this._clearColumnSelectOptions(selectElement);

            selectElement.append(...headerOptions);
        });
    }

    _clearColumnSelectOptions(selectElement, keepPlaceholder = true) {
        const optionRemoveSelector = keepPlaceholder ? ':not([value="-1"])' : 'option';
        Array.prototype.forEach.call(selectElement.querySelectorAll(optionRemoveSelector), optionElement => {
            optionElement.remove();
        });
    }

    _enableColumnSelects() {
        this._elements.productNumberColumnSelect.removeAttribute('disabled');
        this._elements.amountColumnSelect.removeAttribute('disabled');
    }

    _checkColumnSelectStates() {
        this._columnSelectsValid = (
            (this._elements.productNumberColumnSelect.value >= 0) &&
            (this._elements.amountColumnSelect.value >= 0)
        );

        if (this._columnSelectsValid)
            this._elements.importButton.removeAttribute('disabled');
        else
            this._elements.importButton.setAttribute('disabled', true)
    }

    _importButtonClicked() {
        if (!this._columnSelectsValid) return;

        const {valid: importDataValid, errorCode: importErrorCode} = this._validateImportData();
        if (!importDataValid)
            return this._displayControlError(this._elements.csvFileInput, this._elements.invalidFeedback.csvFileInput, importErrorCode);

        const {productNumberIndex, amountIndex} = this._getImportColumnIndizes();

        const productNumberInputId = (index) => this.options.manualFormFieldIdSchemas.productNumber.replace(/\$i/, index);
        const amountInputId = (index) => this.options.manualFormFieldIdSchemas.amount.replace(/\$i/, index);

        // clear all form input rows (they will be added back when injecting imported data)
        this._elements.manualInputFormInputList.innerHTML = '';

        this._importData.data.forEach((dataset, index) => {
            const productNumber = dataset[productNumberIndex];
            const amount = dataset[amountIndex];

            // create related input row
            this._elements.manualInputFormInputList.__plugins.get('FastOrderAdjustableFormPlugin').appendFormRow();

            const productNumberInput = document.getElementById(productNumberInputId(index));
            const amountInput = document.getElementById(amountInputId(index));

            productNumberInput.value = productNumber;
            amountInput.value = amount;
        });

        // add another form row to enable the user to add more data
        this._elements.manualInputFormInputList.__plugins.get('FastOrderAdjustableFormPlugin').appendFormRow();

        //todo: show confirmation modal

        // switch to import form tab
        this._elements.manualInputFormTabControl.click();

        //clear related inputs
        this._clearFileInput();
        this._clearColumnSelectOptions(this._elements.productNumberColumnSelect);
        this._clearColumnSelectOptions(this._elements.amountColumnSelect);
    }

    _validateImportData() {
        const {productNumberIndex, amountIndex} = this._getImportColumnIndizes();

        // check quantity column of the import
        for (let i = 0; i < this._importData.data.length; i++) {
            const value = this._importData.data[i][amountIndex];
            if (Number.isNaN(Number.parseInt(value)))
                return this._generateErrorObject('import-data--invalid-qtty');
        }

        // data seems to be valid
        return this._generateErrorObject(null, true);
    }

    _getImportColumnIndizes() {
        return {
            productNumberIndex: this._elements.productNumberColumnSelect.value,
            amountIndex: this._elements.amountColumnSelect.value
        };
    }

    _clearFileInput() {
        this._elements.csvFileInput.value = null;
        this._elements.csvInputLabel.innerText = this._defaultCsvInputLabelText;
    }
}
