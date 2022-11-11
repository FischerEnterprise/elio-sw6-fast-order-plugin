import Plugin from "src/plugin-system/plugin.class";
import FormRowHandler from "./form-row-handler";
import PluginOptionCheck from "../extensions/plugin-option-check";

export default class FastOrderAdjustableFormPlugin extends Plugin {

    static requiredOptions = [
        'placeholders.productNumber',
        'placeholders.amount',
        'fieldNameSchemas.productNumber',
        'fieldNameSchemas.amount',
    ];

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

    init() {
        PluginOptionCheck.CheckProvidedOptions(this.options, FastOrderAdjustableFormPlugin.requiredOptions, this.constructor.name);

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

    appendFormRow() {
        const formRow = this._formRowHandler.createFormRow(this._getCurrentFormRowCount());
        this.el.append(formRow);
    }

    _getCurrentFormRowCount() {
        return this.el.querySelectorAll(`.${FormRowHandler.ROW_CONTAINER_CLASS}`).length;
    }

    _getSchemaTestRegex(schema) {
        // create a test regex from a schema using $i as placeholder for the index.
        // index is a match group, so it can be used to get the index out of a converted schema.
        // access it on array offset 1 of the match result.
        return new RegExp(schema.replace(/\$i/, '([0-9]+)'));
    }

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
