import Plugin from "src/plugin-system/plugin.class";
import FormRowHandler from "./form-row-handler";
import PluginOptionCheck from "../extensions/plugin-option-check";

/**
 * Enhances the fast order form to generate additional input rows when needed
 * @author Ben Fischer
 */
export default class FastOrderAdjustableFormPlugin extends Plugin {

    /**
     * Options that are required to be set.
     * Nesting represented via dot syntax.
     * @type {string[]}
     */
    static requiredOptions = [
        'placeholders.productNumber',
        'placeholders.amount',
        'fieldNameSchemas.productNumber',
        'fieldNameSchemas.amount',
    ];

    /**
     * Initial values for the options
     * @type {{placeholders: {amount: null, productNumber: null}, fieldNameSchemas: {amount: null, productNumber: null}}}
     */
    static options = {
        placeholders: {
            productNumber: null,
            amount: null
        },

        fieldNameSchemas: {
            productNumber: null,
            amount: null
        }
    };

    /**
     * Initialize the plugin
     */
    init() {
        // Check if all required options were set
        PluginOptionCheck.CheckProvidedOptions(this.options, FastOrderAdjustableFormPlugin.requiredOptions, this.constructor.name);

        // Create a form row handler to handle creation of new form rows
        const {placeholders, fieldNameSchemas} = this.options;
        this._formRowHandler = new FormRowHandler(
            placeholders.productNumber,
            placeholders.amount,
            fieldNameSchemas.productNumber,
            fieldNameSchemas.amount,
            this._formInputInput.bind(this)
        );

        // create the first row if none exist
        if (this._getCurrentFormRowCount() === 0)
            this.appendFormRow();
    }

    /**
     * Create a new form row and append it to the form
     */
    appendFormRow() {
        const formRow = this._formRowHandler.createFormRow(this._getCurrentFormRowCount());
        this.el.append(formRow);
    }

    /**
     * Get the amount of form rows currently on the form
     * @returns {number}
     * @private
     */
    _getCurrentFormRowCount() {
        return this.el.querySelectorAll(`.${FormRowHandler.ROW_CONTAINER_CLASS}`).length;
    }

    /**
     * Convert a schema into a regex to test and match the index with it
     * @param schema - The schema to be converted
     * @returns {RegExp}
     * @private
     */
    _getSchemaTestRegex(schema) {
        // create a test regex from a schema using $i as placeholder for the index.
        // index is a match group, so it can be used to get the index out of a converted schema.
        // access it on array offset 1 of the match result.
        return new RegExp(schema.replace(/\$i/, '([0-9]+)'));
    }

    /**
     * Callback for the input event of created form inputs
     * @param event
     * @private
     */
    _formInputInput(event) {
        // only handle events, triggered by product number fields
        const productFieldNameRegex = this._getSchemaTestRegex(this.options.fieldNameSchemas.productNumber);
        if (!productFieldNameRegex.test(event.target.name)) return;

        // only continue if field is in the last row
        const index = Number.parseInt(event.target.name.match(productFieldNameRegex)[1]);
        if (index !== (this._getCurrentFormRowCount() - 1))
            return;

        // append new row
        this.appendFormRow();
    }
}
