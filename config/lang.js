const get = require('lodash.get');

exports.trans = (key) => {

    const translate = get(globalConfig.lang.file, key)

    if (!translate) {
        throw new Error(`Cannot find ${key}`);
    }

    return translate

};