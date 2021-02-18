const SettingsModel = require("../models/Settings");

exports.processEnforcePasswordPolicy = ({text}) => {
    return new Promise((resolve, reject) => {
        const settings = SettingsModel.findOne({});
        
        const 
        {passwordLength,
            shouldHaveUppercaseLetter,
            shouldHaveLowercaseLetter,
            shouldHaveNumber,
            shouldHaveSymbol,
        } = settings.passwordPolicy

        if (text.length < passwordLength) {
            errorArray.push({ msg: "Password not long enough."})
        }

        if (shouldHaveUppercaseLetter && !/(?=.*[a-z])/.test(text)) {
            errorArray.push({ msg: "Password should have a uppercase letter. A-Z"})
        }

        if (shouldHaveLowercaseLetter && !/(?=.*[a-z])/.test(text)) {
            errorArray.push({ msg: "Password should have a lowercase letter. a-z"})
        }

        if (shouldHaveNumber && !/(?=.*\d)/.test(text)) {
            errorArray.push({ msg: "Password should have a number. 1-9"})
        }

        if (shouldHaveSymbol && !/(?=.*\W])/.test(text) ) {
            errorArray.push({ msg: "Password should have a symbol. (!@#$%^&*)"})
        }


        return resolve({success: errorArray.length === 0 , messages: errorArray})
    })
}