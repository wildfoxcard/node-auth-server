module.exports.errorReporter = ({err, res, resMessage}) => {
    console.error(err);
    //save error

    if (res) {
        res.status(400).json({
          success: false,
          message: resMessage || "Error with request. It has been reported."
        })
    }
}