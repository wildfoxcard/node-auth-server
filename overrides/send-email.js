// This function will override the functionality of `${___dirname}/processes/send-email.js`
exports.sendEmailOverride = ({
    to,
    from,
    subject,
    text
  }) => {
    return new Promise((resolve, reject) => {
        //add code here


        // return resolve(true) // returning true will override existing send email function.
        return resolve(false)
    })    
}