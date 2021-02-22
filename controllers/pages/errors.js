const ErrorModel = require("../../models/Error");
const {
  errorReporter,
  errorReporterWithHtml,
} = require("../../processes/errorReporter");

exports.viewList = async (req, res) => {
  try {
    res.render("pages/errors/list", {
      title: "Errors",
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.viewSingle = async (req, res) => {
  try {
    const error = await ErrorModel.findById(req.query.id);

    error.stack = error.stack.replace(new RegExp("\r?\n", "g"), "<br />");

    res.render("pages/errors/single", {
      title: "Log | Errors",
      error,
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/errors/:
 *   get:
 *     description: You have to be an admin to use this endpoint. A list of all available errors or a list of errors filtered by name.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Errors"
 *     responses:
 *       '200':
 *         description: A list of all available errors or a list of errors filtered by name.
 *       '400':
 *          description: Can be validation issue.
 *
 */
exports.getManyForm = async (req, res) => {
  try {
    const { name } = req.query;
    let errors;

    if (name && name.length > 0) {
      errors = await ErrorModel.find({
        name: { $regex: ".*" + name + ".*" },
        isDeleted: {
          $ne: true,
        },
      });
    } else {
      errors = await ErrorModel.find({
        isDeleted: {
          $ne: true,
        },
      });
    }

    res.json({
      success: true,
      data: errors,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/errors/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Create a new error
 *     produces:
 *       - application/json
 *     tags:
 *       - "Errors"
 *     responses:
 *       '201':
 *         description: Create a new error.
 *     parameters:
 *       - name: application
 *         in: formData
 *         required: true
 *         type: string
 *       - name: message
 *         in: formData
 *         required: true
 *         type: string
 *       - name: stack
 *         in: formData
 *         required: true
 *         type: string
 *
 */
exports.postManyForm = async (req, res) => {
  try {
    const { application, message, stack } = req.body;

    if (!application || application.length === 0) {
      return res.json({
        success: false,
        message: "Please enter a name for a errors",
      });
    }

    if (!message || message.length === 0) {
      return res.json({
        success: false,
        message: "Please enter a name for a errors",
      });
    }

    if (!stack || stack.length === 0) {
      return res.json({
        success: false,
        message: "Please enter a name for a errors",
      });
    }

    const newError = new ErrorModel({
      application,
      message,
      stack,
    });
    await newError.save();

    res.status(201).json({
      success: true,
      data: newError,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this error.",
    });
  }
};

exports.putManyForm = async (req, res) => {
  res.send(405, "Method Not Allowed");
};

exports.deleteManyForm = async (req, res) => {
  res.send(405, "Method Not Allowed");
};

/**
 * @swagger
 *
 * /api/v1/errors/{_id}:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get a record of a error.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Errors"
 *     responses:
 *       '200':
 *         description: A record of a error
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get error by Id
 *
 */
exports.getSingleForm = async (req, res) => {
  try {
    const { _id } = req.params;

    const error = await ErrorModel.findOne({
      _id,
    });

    res.json({
      success: true,
      data: error,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

exports.postSingleForm = async (req, res) => {
  res.send(405, "Method Not Allowed");
};

exports.putSingleForm = async (req, res) => {
  res.send(405, "Method Not Allowed");
};

exports.deleteSingleForm = async (req, res) => {
  res.send(405, "Method Not Allowed");
};
