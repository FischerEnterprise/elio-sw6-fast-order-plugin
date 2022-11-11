export default class PluginOptionCheck {

    static CheckProvidedOptions(rootOptionsElement, keysToCheck, pluginName, keyPrefix = '') {
        // object to store keys that need to be processed on the next recursion
        const toCheckNext = {};

        // iterate all provided keys
        keysToCheck.forEach(key => {
            // if key includes a dot, prepare it for next recursion
            if (key.includes('.')) {
                const [prefix, ...parts] = key.split('.'); // split prefix from the remaining key
                if (!(prefix in toCheckNext)) toCheckNext[prefix] = []; // create empty array in toCheckNext if this is the first key on that namespace
                toCheckNext[prefix].push(parts.join('.')); // add remaining key to check for next recursion
                return; // don't do anything else in this recursion
            }

            // if key doesn't include a dot, check if it exists on the current root options element
            if (rootOptionsElement[key] === null)
                throw new Error(`Required option '${keyPrefix + key}' missing for plugin ${pluginName}`);
        });

        // if entries in toCheckNext exist, process them
        if (Object.keys(toCheckNext).length > 0) {
            Object.keys(toCheckNext).forEach(nextKeyPrefix => {
                if (!(nextKeyPrefix in rootOptionsElement))
                    throw new Error(`Required option namespace '${keyPrefix}${nextKeyPrefix}.' missing for plugin ${pluginName}`);

                PluginOptionCheck.CheckProvidedOptions(rootOptionsElement[nextKeyPrefix], toCheckNext[nextKeyPrefix], pluginName, `${keyPrefix}${nextKeyPrefix}.`);
            })
        }
    }

}
