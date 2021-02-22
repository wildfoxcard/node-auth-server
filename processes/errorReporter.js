const ErrorModel = require("../models/Error");

const sharedLogic = ({ err, message }) => {
  return new Promise(async (resolve, reject) => {
    const newError = ErrorModel({
      application: "this",
      message: err.message,
      stack: err.stack,
    });

    await newError.save();

    resolve({ _id: newError._id });
  });
};

module.exports.errorReporter = async ({ err, res, resMessage }) => {
  console.error(err);
  //save error
  const { _id } = await sharedLogic({err, resMessage});

  if (res) {
    res.status(400).json({
      success: false,
      message:
        `Error Id:${_id}\n${resMessage}` ||
        `Error Id:${_id}\nError with request. It has been reported.`,
    });
  }
};

module.exports.errorReporterWithHtml = async ({ err, res, resMessage }) => {
  console.error(err);

  //save error
  await sharedLogic({err, resMessage});

  if (res) {
    res.render("pages/errors/user-friendly-error", {
      title: "Fatal Error",
    });
  }
};
