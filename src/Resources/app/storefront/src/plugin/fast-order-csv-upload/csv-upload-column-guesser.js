/**
 * Provides functionality to guess columns for fast order csv import
 * @author Ben Fischer
 */
export default class CsvUploadColumnGuesser {

    static ValidQuantityRegex = /^0*[1-9][0-9]*$/; // regex to validate quantity values
    static ValidProductNumberRegex = /^[0-9a-f]{32}$/; // regex to validate product numbers (default: 32 chars consisting of 0-9 and a-f)

    static MaxFieldChecks = 500; // max amount of fields to check (with 10 columns on the import data, we check 50 rows by default)

    static GuessFailedReturn = -1; // value to return if the column could not be guessed

    /**
     * Guess the column index for product numbers on a csv import
     * @param data - The imported data
     * @returns {number|number}
     * @constructor
     */
    static GuessProductNumberColumn(data) {
        return CsvUploadColumnGuesser._guessColumn(data, CsvUploadColumnGuesser.ValidProductNumberRegex);
    }

    /**
     * Guess the column index for quantities on a csv import
     * @param data - The imported data
     * @returns {number|number}
     * @constructor
     */
    static GuessQuantityColumn(data) {
        return CsvUploadColumnGuesser._guessColumn(data, CsvUploadColumnGuesser.ValidQuantityRegex);
    }

    /**
     * Guess the column index using the provided regex
     * @param data - The imported data
     * @param regex - The regex to use for checks
     * @returns {number}
     * @private
     */
    static _guessColumn(data, regex) {
        // can't check without data
        if (data.length === 0) return CsvUploadColumnGuesser.GuessFailedReturn;

        // calculate max amount of rows to be checked
        const rowLength = data[0].length;
        const maxRows = Math.floor(CsvUploadColumnGuesser.MaxFieldChecks / rowLength);

        // truncate input data if needed
        if (data.length > maxRows) {
            data = data.slice(0, maxRows);
        }

        // create an array with all available column indizes
        const validColumns = [...new Array(rowLength).keys()];

        // iterate the provided data and check every field
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                const validColumnIndex = validColumns.indexOf(j);
                if (validColumnIndex === -1) continue; // column was already invalidated

                // invalidate column by removing it from the list if regex test fails
                if (!regex.test(data[i][j])) {
                    validColumns.splice(validColumnIndex, 1);
                }
            }
        }

        // if valid columns is empty, guess failed
        if (validColumns.length === 0)
            return CsvUploadColumnGuesser.GuessFailedReturn;

        // if valid columns is not empty, return the first
        return validColumns[0];
    }

}
