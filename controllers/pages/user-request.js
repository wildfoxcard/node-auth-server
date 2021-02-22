const validator = require("validator");

const UserRequestModel = require("../../models/UserRequest");
const {
  errorReporter,
  errorReporterWithHtml,
} = require("../../processes/errorReporter");
const { processApproveUserRequest } = require("../../processes/accounts/");

exports.getIndex = (req, res) => {
  try {
    res.render("pages/user-management/list", {
      title: "User Management",
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.getForm = async (req, res) => {
  try {
    let data;

    if (req.query.id) {
      data = await UserRequestModel.findById(req.query.id);
    }

    res.render("pages/user-management/form", {
      title: "Form | User Management",
      id: req.query.id,
      data,
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
 * /api/v1/user-requests/:
 *   get:
 *     description: You have to be an admin to use this endpoint. A list of all available users or a list of users filtered by name.
 *     produces:
 *       - application/json
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: A list of all available users or a list of users filtered by name.
 *       '400':
 *          description: Can be validation issue.
 *
 *     parameters:
 *       - in: query
 *         name: email
 *         required: false
 *         type: "string"
 *         description: Filter the list of users using user's name.
 */
exports.getManyForm = async (req, res) => {
  try {
    const { email } = req.query;
    let queryObj;

    if (email && email.length > 0) {
      queryObj = {
        email: { $regex: ".*" + email + ".*" },
        isDeleted: {
          $ne: true,
        },
      };
    } else {
      queryObj = {
        isDeleted: {
          $ne: true,
        },
      };
    }

    const users = await UserRequestModel.find(queryObj);

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/user-requests/:
 *   post:
 *     description: Anyone can use this endpoint. Create a new user Request.
 *     produces:
 *       - application/json
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '201':
 *         description: Create a new user Request.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with an email."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              email:
 *                type: "string"
 *
 *
 */
exports.postManyForm = async (req, res) => {
  try {
    const { email } = req.body;

    const validationErrors = [];
    if (!validator.isEmail(req.body.email)) {
      validationErrors.push({ msg: "Please enter a valid email address." });
    }
    // if (!validator.isLength(req.body.password, { min: 8 })) {
    //   validationErrors.push({
    //     msg: "Password must be at least 8 characters long",
    //   });
    // }
    // if (req.body.password !== req.body.confirmPassword) {
    //   validationErrors.push({ msg: "Passwords do not match" });
    // }

    if (validationErrors.length) {
      return res.json({
        success: false,
        message: "Errors: " + validationErrors.join(", "),
      });
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false,
    });

    const user = new UserRequestModel(req.body);

    await user.save();

    await UserRequestModel.findOne(
      { email: req.body.email },
      (err, existingUser) => {
        if (err) {
          throw err;
        }
        res.status(201).json({
          success: true,
          data: user,
        });
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this user request.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/user-requests/:
 *   put:
 *     description: You have to be an admin to use this endpoint. Update many users at once, up to 10. Great for changing names.
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: Update many users.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of users. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              users:
 *                type: "array"
 *                items:
 *                  $ref: '#/definitions/UserRequest'
 *
 *
 *
 *
 */

exports.putManyForm = async (req, res) => {
  try {
    let { users } = req.body;

    if (!users || users.length < 1) {
      return res.json({
        success: false,
        message: "No user properties found on attach object.",
      });
    }

    if (users.length > 10) {
      return res.json({
        success: false,
        message: "Users array can not be more than 10 items.",
      });
    }
    const usersRecordWithIdCount = users.filter((item) => {
      if (item._id) {
        return item;
      }
    }).length;

    if (users.length !== usersRecordWithIdCount) {
      return res.json({
        success: false,
        message: "Please ensure every record has an _id property.",
      });
    }

    const usersWithPasswordsCount = users.filter((u) => u.password).length;

    if (usersWithPasswordsCount !== 0) {
      return res.json({
        success: false,
        message: "Password cannot be changed in put.",
      });
    }

    const usersFromDb = await UserRequestModel.find({
      _id: { $in: users.map((p) => p._id) },
      isDeleted: {
        $ne: true,
      },
    });

    if (users.length !== usersFromDb.length) {
      return res.json({
        success: false,
        message: "Not every record had a valid _id.",
      });
    }

    //sudo, hash password if change with confirm password

    for (var i = 0; i < users.length; i++) {
      const user = users[0];

      await UserRequestModel.updateOne(
        { _id: user._id },
        {
          $set: user,
        }
      );
    }

    const returningUsersFromDb = await UserRequestModel.find({
      _id: { $in: users.map((p) => p._id) },
      isDeleted: {
        $ne: true,
      },
    });

    res.json({
      success: true,
      data: returningUsersFromDb,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/user-requests/:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Delete many users at once, up to 10. Can be undone at a database level.
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: You just soft deleted many users.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of users. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              users:
 *                type: "array"
 *                items:
 *                  type: "object"
 *                  properties:
 *                    _id:
 *                      type: "string"
 *                      required: true
 *
 *
 *
 *
 */

exports.deleteManyForm = async (req, res) => {
  try {
    const { users } = req.body;
    const usersRecordWithIdCount = users.filter((item) => {
      if (item._id) {
        return item;
      }
    }).length;

    if (users.length !== usersRecordWithIdCount) {
      return res.json({
        success: false,
        message: "Please ensure every record has an _id.",
      });
    }

    const usersFromDb = await UserRequestModel.find({
      _id: { $in: users.map((p) => p._id) },
    });

    if (users.length !== usersFromDb.length) {
      return res.json({
        success: false,
        message: "Please ensure every record has an existing _id.",
      });
    }

    for (var i = 0; i < users.length; i++) {
      const user = users[0];

      await UserRequestModel.updateOne(
        { _id: user._id },
        {
          $set: {
            isDeleted: true,
          },
        }
      );
    }

    res.json({
      success: true,
      message: "Multiple deletes executed successfully.",
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/user-requests/{_id}:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: A record of a user
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get user by Id
 *
 */
exports.getSingleForm = async (req, res) => {
  try {
    const { _id } = req.params;

    const user = await UserRequestModel.findOne({
      _id,
      isDeleted: { $ne: true },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

exports.postSingleForm = async (req, res) => {
  res.send(405, "Method Not Allowed");
};

/**
 * @swagger
 *
 * /api/v1/user-requests/{_id}/approve/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Approve a user request.
 *     produces:
 *       - application/json
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: Approve a user request
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get user request by Id
 *
 */
exports.postSingleFormApprove = async (req, res) => {
  try {
    const { _id } = req.params;

    processApproveUserRequest(
      {
        _id,
        email: req.body.email,
      },
      {
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.join(", ") });
        },
        noUserErrorFN: () => {
          res.json({
            success: false,
            message: "No user created.",
          });
        },
        errorFN: () => {
          res.json({
            success: false,
            message: "Fatal Error logged.",
          });
        },
        successFN: () => {
          res.json({
            success: true,
            message: "User request successfully approved.",
          });
        },
      }
    );
    // const user = await UserRequestModel.findOneAndUpdate(
    //   { _id, isDeleted: { $ne: true } },
    //   {type: "ACCEPTED"},
    //   { new: true }
    // );

    // //create user -

    // //email user - like forgot password but approval

    // res.json({
    //   success: true,
    //   message: "User request successfully approved.",
    // });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/user-requests/{_id}/reject/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Reject a user request.
 *     produces:
 *       - application/json
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: Reject a user request
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get user request by Id
 *
 */
exports.postSingleFormReject = async (req, res) => {
  try {
    let { body } = req;
    const { _id } = req.params;

    const user = await UserRequestModel.findOneAndUpdate(
      { _id, isDeleted: { $ne: true } },
      { type: "REJECTED" },
      { new: true }
    );

    res.json({
      success: true,
      message: "User request successfully rejected.",
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};
/**
 * @swagger
 *
 * /api/v1/user-requests/{_id}:
 *   put:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: A record of a user
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get user by Id
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of users. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            $ref: '#/definitions/UserRequest'
 *
 */
exports.putSingleForm = async (req, res) => {
  try {
    let { body } = req;
    const { _id } = req.params;

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    if (body.password) {
      return res.json({
        success: false,
        message: "You can't change passwords from this endpoint.",
      });
    }

    const user = await UserRequestModel.findOneAndUpdate(
      { _id, isDeleted: { $ne: true } },
      body,
      { new: true }
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/user-requests/{_id}:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "User Requests"
 *     responses:
 *       '200':
 *         description: A record of a user
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get user by Id
 *
 */
exports.deleteSingleForm = async (req, res) => {
  try {
    const { body } = req;
    const { _id } = req.params;

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    const user = await UserRequestModel.findOne({
      _id,
      isDeleted: { $ne: true },
    });

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    const returningUser = await UserRequestModel.findOneAndUpdate(
      { _id },
      { isDeleted: true },
      { new: true }
    );

    res.json({
      success: true,
      message: "Record has been successfully deleted.",
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};
