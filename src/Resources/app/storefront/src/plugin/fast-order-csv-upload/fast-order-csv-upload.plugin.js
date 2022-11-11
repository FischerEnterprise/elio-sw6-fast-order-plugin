import Plugin from "src/plugin-system/plugin.class";
import PluginOptionCheck from "../extensions/plugin-option-check";
import CsvUploadColumnGuesser from "./csv-upload-column-guesser";

/**
 * Provides functionality for the csv-import page of the fast order plugin
 * @author Ben Fischer
 */
export default class FastOrderCsvUploadPlugin extends Plugin {

    static DOM_CLASS_INVALID = 'is-invalid'; // bootstrap control invalid class
    static DOM_CLASS_VALID = 'is-valid'; // bootstrap control valid class

    /**
     * Options that are required to be set.
     * Nesting represented via dot syntax.
     */
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

    /**
     * Initial value for options
     * @type {{importGuessSuccessText: string, csvInputLabel: null, columnSelectElements: {amount: null, productNumber: null}, invalidFeedbackElements: {amount: null, csvFileInput: null, productNumber: null}, manualFormFieldIdSchemas: {amount: null, productNumber: null}, manualInputFormTabControl: null, manualInputFormInputList: null, errorTexts: {"file-input--missing-file": string, "import-data--guess-failed--quantity": string, "import-data--guess-failed--both": string, "import-data--guess-failed--product-number": string, "file-input--invalid-file": string, "import-data--invalid-quantity": string, "file-input--too-many-files": string}, importButton: null}}
     */
    static options = {
        errorTexts: {
            'file-input--missing-file': 'A file must be selected',
            'file-input--too-many-files': 'Only one file can be selected',
            'file-input--invalid-file': 'Only CSV files can be selected',

            'import-data--invalid-quantity': 'Your import contains invalid quantities',

            'import-data--guess-failed--product-number': 'Failed to guess the product number column. Maybe your imported file is invalid?',
            'import-data--guess-failed--quantity': 'Failed to guess the quantity column. Maybe your imported file is invalid?',
            'import-data--guess-failed--both': 'Failed to guess the product number and quantity columns. Maybe your imported file is invalid?',
        },

        importGuessSuccessText: 'Successfully guessed product number and quantity columns for your import',

        columnSelectElements: {
            productNumber: null, amount: null
        },

        invalidFeedbackElements: {
            csvFileInput: null, productNumber: null, amount: null
        },

        manualFormFieldIdSchemas: {
            productNumber: null, amount: null
        },

        csvInputLabel: null, importButton: null,

        manualInputFormTabControl: null,

        manualInputFormInputList: null
    };

    /**
     * Initialize the plugin
     */
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

    /**
     * Check if required elements are set.
     * Syntax for input: [[key: path of the required element]: value of the required element]
     * @param requiredElements
     * @private
     */
    _checkRequiredElements(requiredElements) {
        Object.keys(requiredElements).forEach(code => {
            if (!requiredElements[code]) throw new Error(`Could not find '${code}' for plugin ${this.constructor.name}`);
        })
    }

    /**
     * Load all DOM-Elements required for the plugin to work
     * @private
     */
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

    /**
     * Add listeners to DOM-Elements
     * @private
     */
    _addListeners() {
        // listen to change events on the csv file input
        this._elements.csvFileInput.addEventListener('change', this._csvFileInputChanged.bind(this));

        // listen to change events on the column selects
        this._elements.productNumberColumnSelect.addEventListener('change', this._checkColumnSelectStates.bind(this));
        this._elements.amountColumnSelect.addEventListener('change', this._checkColumnSelectStates.bind(this));

        // listen to click events on the import button
        this._elements.importButton.addEventListener('click', this._importButtonClicked.bind(this));
    }

    /**
     * Callback for the file input's change event
     * @param event
     * @private
     */
    _csvFileInputChanged(event) {
        // only run if target is the plugin's csv file input
        if (event.target !== this._elements.csvFileInput) return;

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
            // add options to column selects and enable them
            this._addColumnSelectOptions();
            this._enableColumnSelects();

            // update file input label to show selected file name
            this._elements.csvInputLabel.innerText = this._elements.csvFileInput.files[0].name;

            // try to guess columns for import
            const guessedProductNumberColumn = CsvUploadColumnGuesser.GuessProductNumberColumn(this._importData.data);
            const guessedQuantityColumn = CsvUploadColumnGuesser.GuessQuantityColumn(this._importData.data);

            // update column selects with guessed values
            this._elements.productNumberColumnSelect.value = guessedProductNumberColumn;
            this._elements.amountColumnSelect.value = guessedQuantityColumn;

            // check if guesses were both valid
            this._checkColumnSelectStates();

            // show warning if both guesses failed
            if (guessedProductNumberColumn + guessedQuantityColumn === -2) // short version to check both equal to -1
                this._displayAlert(this.options.errorTexts['import-data--guess-failed--both'], 'danger');

            // show warning if product number guess failed
            else if (guessedProductNumberColumn === -1)
                this._displayAlert(this.options.errorTexts['import-data--guess-failed--product-number'], 'danger');

            // show warning if quantity guess failed
            else if (guessedQuantityColumn === -1)
                this._displayAlert(this.options.errorTexts['import-data--guess-failed--quantity'], 'danger');

            // show success info if both guesses succeeded
            else
                this._displayAlert(this.options.importGuessSuccessText, 'success');

        });
    }

    /**
     * Check if the selected file is a valid csv file
     * @returns {{valid: boolean, errorCode: string|null}}
     * @private
     */
    _checkSelectedFile() {
        // get files from input element
        const files = this._elements.csvFileInput.files;

        // check if any files were provided
        if (!files || files.length === 0) return this._generateErrorObject('file-input--missing-file');

        // check if more than one file was provided
        if (files.length > 1) return this._generateErrorObject('file-input--too-many-files');

        // check if provided file is of type csv
        if (files[0].type !== 'text/csv') return this._generateErrorObject('file-input--invalid-file');

        // generate valid error object
        return this._generateErrorObject(null, true);
    }

    /**
     * Helper to generate unified error objects for internal validations
     * @param errorCode - The error code to return
     * @param valid - Set to true if the validation succeeded
     * @returns {{valid: boolean, errorCode}}
     * @private
     */
    _generateErrorObject(errorCode, valid = false) {
        return {valid, errorCode};
    }

    /**
     * Display an error message on a control element
     * @param inputElement - The control to be set to invalid
     * @param feedbackElement - The feedback element to display the error in
     * @param errorCode - The error code to display
     * @private
     */
    _displayControlError(inputElement, feedbackElement, errorCode) {
        this._clearControlError(inputElement, feedbackElement);

        inputElement.classList.add(FastOrderCsvUploadPlugin.DOM_CLASS_INVALID);

        feedbackElement.innerText = this.options.errorTexts[errorCode];
    }

    /**
     * Remove an error (generated by _displayControlError)
     * @param inputElement - The control element
     * @param invalidFeedbackElement - The feedback element
     * @private
     */
    _clearControlError(inputElement, invalidFeedbackElement) {
        invalidFeedbackElement.innerText = '';

        if (inputElement.classList.contains(FastOrderCsvUploadPlugin.DOM_CLASS_INVALID)) inputElement.classList.remove(FastOrderCsvUploadPlugin.DOM_CLASS_INVALID);
    }

    /**
     * Set a control element into valid state
     * @param inputElement - The control element
     * @private
     */
    _displayControlSuccess(inputElement) {
        if (!inputElement.classList.contains(FastOrderCsvUploadPlugin.DOM_CLASS_VALID)) inputElement.classList.add(FastOrderCsvUploadPlugin.DOM_CLASS_VALID);
    }

    /**
     * Parse the contents of a csv file to be used for import
     * @param file - The uploaded file+
     * @returns {Promise<void>}
     * @private
     */
    async _processFileContents(file) {
        const fileContents = await this._readFileContents(file) // todo: handle errors

        const csvLines = fileContents.split('\n');
        const csvHeader = csvLines.shift();

        this._importData.headers = csvHeader.split(/[,;]/);

        this._importData.data = csvLines.map(line => line.split(/[,;]/));
    }

    /**
     * Read the contents of a file
     * @param file - The file
     * @returns {Promise<unknown>}
     * @private
     */
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

    /**
     * Add option elements to the column select elements based on imported header data
     * @private
     */
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

    /**
     * Remove options from a select element
     * @param selectElement - The select element to be cleared
     * @param keepPlaceholder - Keep the placeholder? (value=-1)
     * @private
     */
    _clearColumnSelectOptions(selectElement, keepPlaceholder = true) {
        const optionRemoveSelector = keepPlaceholder ? ':not([value="-1"])' : 'option';
        Array.prototype.forEach.call(selectElement.querySelectorAll(optionRemoveSelector), optionElement => {
            optionElement.remove();
        });
    }

    /**
     * Enable both column select elements
     * @private
     */
    _enableColumnSelects() {
        this._elements.productNumberColumnSelect.removeAttribute('disabled');
        this._elements.amountColumnSelect.removeAttribute('disabled');
    }

    /**
     * Check if both column selects have valid values and dis-/enable the import button accordingly
     * @private
     */
    _checkColumnSelectStates() {
        this._columnSelectsValid = ((this._elements.productNumberColumnSelect.value >= 0) && (this._elements.amountColumnSelect.value >= 0));

        if (this._columnSelectsValid)
            this._elements.importButton.removeAttribute('disabled');
        else
            this._elements.importButton.setAttribute('disabled', true)
    }

    /**
     * Callback for the import button's click event
     * @private
     */
    _importButtonClicked() {
        // only allow imports if column selects are both valid
        if (!this._columnSelectsValid) return;

        // validate import data
        const {valid: importDataValid, errorCode: importErrorCode} = this._validateImportData();
        if (!importDataValid)
            return this._displayControlError(this._elements.csvFileInput, this._elements.invalidFeedback.csvFileInput, importErrorCode);

        // get selected columns for the import
        const {productNumberIndex, amountIndex} = this._getImportColumnIndizes();

        // create helper functions to generate id's for product number and amount based on an index
        const productNumberInputId = (index) => this.options.manualFormFieldIdSchemas.productNumber.replace(/\$i/, index);
        const amountInputId = (index) => this.options.manualFormFieldIdSchemas.amount.replace(/\$i/, index);

        // clear all form input rows (they will be added back when injecting imported data)
        this._elements.manualInputFormInputList.innerHTML = '';

        // import data into the form
        this._importData.data.forEach((dataset, index) => {
            // get product number and amount
            const productNumber = dataset[productNumberIndex];
            const amount = dataset[amountIndex];

            // create related input row
            this._elements.manualInputFormInputList.__plugins.get('FastOrderAdjustableFormPlugin').appendFormRow();

            // get related input elements
            const productNumberInput = document.getElementById(productNumberInputId(index));
            const amountInput = document.getElementById(amountInputId(index));

            // set values of input elements
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

    /**
     * Vague import data validation (only quantity values have to be numbers to pass)
     * @returns {{valid: boolean, errorCode}}
     * @private
     */
    _validateImportData() {
        const {productNumberIndex, amountIndex} = this._getImportColumnIndizes();

        // check quantity column of the import
        for (let i = 0; i < this._importData.data.length; i++) {
            const value = this._importData.data[i][amountIndex];
            if (Number.isNaN(Number.parseInt(value))) return this._generateErrorObject('import-data--invalid-qtty');
        }

        // data seems to be valid
        return this._generateErrorObject(null, true);
    }

    /**
     * Helper function to get selected columns for the import
     * @returns {{amountIndex, productNumberIndex}}
     * @private
     */
    _getImportColumnIndizes() {
        return {
            productNumberIndex: this._elements.productNumberColumnSelect.value,
            amountIndex: this._elements.amountColumnSelect.value
        };
    }

    /**
     * Clear the csv file input element
     * @private
     */
    _clearFileInput() {
        this._elements.csvFileInput.value = null;
        this._elements.csvInputLabel.innerText = this._defaultCsvInputLabelText;
    }

    /**
     * Display an alert below the csv import form
     * @param text
     * @param type
     * @private
     */
    _displayAlert(text, type) {
        const alert = document.createElement("div");
        alert.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alert.role = "alert";

        const alertContentContainer = document.createElement("div");
        alertContentContainer.classList.add('alert-content-container');

        const alertContent = document.createElement("div");
        alertContent.classList.add('alert-content', 'py-2');
        alertContent.innerText = text;

        const dismissAlertButton = document.createElement("button");
        dismissAlertButton.type = "button";
        dismissAlertButton.classList.add("close");
        dismissAlertButton.ariaLabel = "Close";
        dismissAlertButton.dataset.dismiss = "alert";

        const buttonContent = document.createElement("span");
        buttonContent.ariaHidden = "true";
        buttonContent.innerHTML = "&times;";

        dismissAlertButton.append(buttonContent);

        alertContentContainer.append(alertContent, dismissAlertButton);
        alert.append(alertContentContainer);

        this._elements.csvFileInput.closest(".container").append(alert);
    }
}
