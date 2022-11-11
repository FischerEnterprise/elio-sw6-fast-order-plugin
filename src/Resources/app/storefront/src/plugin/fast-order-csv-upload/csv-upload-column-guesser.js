export default class CsvUploadColumnGuesser {

    static ValidQuantityRegex = /^0*[1-9][0-9]*$/;
    static ValidProductNumberRegex = /^[0-9a-f]{32}$/;

    static MaxFieldChecks = 500;

    static GuessFailedReturn = -1;

    static GuessProductNumberColumn(data) {
        return CsvUploadColumnGuesser._guessColumn(data, CsvUploadColumnGuesser.ValidProductNumberRegex);
    }

    static GuessQuantityColumn(data) {
        return CsvUploadColumnGuesser._guessColumn(data, CsvUploadColumnGuesser.ValidQuantityRegex);
    }

    static _guessColumn(data, regex) {
        if (data.length === 0) return CsvUploadColumnGuesser.GuessFailedReturn;

        // calculate max amount of rows to be checked
        const rowLength = data[0].length;
        const maxRows = Math.floor(CsvUploadColumnGuesser.MaxFieldChecks / rowLength);

        // truncate input data if needed
        if (data.length > maxRows) {
            data = data.slice(0, maxRows);
        }

        const validColumns = [...new Array(rowLength).keys()];

        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                const validColumnIndex = validColumns.indexOf(j);
                if (validColumnIndex === -1) continue; // column was already invalidated

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
