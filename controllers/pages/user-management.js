const validator = require("validator");
const { uuid } = require('uuidv4');

const User = require("../../models/User");
const PermissionModel = require("../../models/Permission");
const RoleModel = require("../../models/Role");
const Settings = require("../../models/Settings");
const { errorReporter } = require("../../processes/errorReporter");
const {
  processEnforcePasswordPolicy,
} = require("../../processes/enforce-password-policy");
const {
  sendEmail,
} = require("../../processes/send-email");


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
      data = await User.findById(req.query.id);
    }

    res.render("pages/user-management/form", {
      title: "Form | User Management",
      id: req.query.id,
      data,
      uuid: uuid()
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
 * /api/v1/users/:
 *   get:
 *     description: You have to be an admin to use this endpoint. A list of all available users or a list of users filtered by name.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
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
    const { email, isAdmin, type } = req.query;
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

    if (isAdmin) {
      queryObj.isAdmin = true;
    }

    if (type) {
      queryObj.type = type;
    }

    const users = await User.find(queryObj)
      .populate("permissions")
      // .populate('roles')
      .populate({
        path: "roles",
        populate: {
          path: "permissions",
        },
      })
      .exec();

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
 * /api/v1/users/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Create a new user
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
 *     responses:
 *       '201':
 *         description: Create a new user.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object of type user."
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User'
 *
 *
 */
exports.postManyForm = async (req, res) => {
  try {
    const {
      email,
      type,
      password,
      applicationToken,
      shouldSendEmailInvitation,
      isAdmin,
    } = req.body;

    const validationErrors = [];
    if (!validator.isEmail(email)) {
      validationErrors.push({ msg: "Please enter a valid email address." });
    }

    if (password) {
      const passwordPolicy = await processEnforcePasswordPolicy({
        text: password,
      });

      if (!passwordPolicy.success) {
        passwordPolicy.messages.map((p) => {
          validationErrors.push(p);
        });
      }
    }

    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.json({
        success: false,
        message: "Errors: " + validationErrors,
      });
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false,
    });

    let passwordOrToken = {};

    switch (type) {
      case "NORMAL":
        passwordOrToken = {
          password
        };
        break;
      case "TEST":
        passwordOrToken = {
          password
        };
        break;
      case "APPLICATION":
        passwordOrToken = {
          // password,
          applicationToken
        };
        break;
    }

    const user = new User(
      Object.assign(passwordOrToken, {
        email,
        type,
        isAdmin,
      })
    );

    User.findOne({ email: email }, async (err, existingUser) => {
      if (err) {
        throw err;
      }
      if (existingUser) {
        return res.json({
          success: false,
          message: "Account with that email address already exists.",
        });
      }

      user.save(async (err) => {
        if (err) {
          throw err;
        }

        //why isn't it a boolean! truthiness
        if (shouldSendEmailInvitation == true) {
          const { emailTemplates } = await Settings.findOne({});
          await sendEmail({
            to: email,
            from: emailTemplates.vars.fromEmail,
            subject: emailTemplates.inviteUserSubject,
            text: emailTemplates.inviteUserMessage,
          });
        }
        // req.logIn(user, (err) => {
        // if (err) {
        //   throw err;
        // }

        //prevent hased password from being exposed
        // delete user.password;

        res.status(201).json({
          success: true,
          data: user,
        });
        // });
      });
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this user.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/users/:
 *   put:
 *     description: You have to be an admin to use this endpoint. Update many users at once, up to 10. Great for changing names.
 *     tags:
 *       - "Users"
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
 *                  $ref: '#/definitions/User'
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

    let profile, roles, permissions;

    if (users.profile) {
      profile = users.profile;
      delete users.profile;
    }

    if (users.roles) {
      roles = users.roles;
      delete users.roles;
    }

    if (users.permissions) {
      permissions = users.permissions;
      delete users.permissions;
    }

    const usersFromDb = await User.find({
      _id: { $in: users.map((p) => p._id) },
      isDeleted: {
        $ne: true,
      },
    });

    if (users.length !== usersFromDb.length) {
      return res.json({
        success: false,
        message: "Note every record had a valid _id.",
      });
    }

    //sudo, hash password if change with confirm password

    for (var i = 0; i < users.length; i++) {
      const user = users[0];

      await User.updateOne(
        { _id: user._id },
        {
          $set: user,
        }
      );
    }

    const returningUsersFromDb = await User.find({
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
 * /api/v1/users/:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Delete many users at once, up to 10. Can be undone at a database level.
 *     tags:
 *       - "Users"
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

    const usersFromDb = await User.find({
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

      await User.updateOne(
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
 * /api/v1/users/{_id}:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
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

    const user = await User.findOne({
      _id,
      isDeleted: { $ne: true },
    })
      .populate("permissions")
      // .populate({path: 'roles', model: permissions})
      // .populate('roles')
      .populate({
        path: "roles",
        populate: {
          path: "permissions",
        },
      })
      .exec();

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
 * /api/v1/users/{_id}:
 *   put:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
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
 *            $ref: '#/definitions/User'
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

    const user = await User.findOneAndUpdate(
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
 * /api/v1/users/{_id}:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
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

    const user = await User.findOne({
      _id,
      isDeleted: { $ne: true },
    });

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    const returningUser = await User.findOneAndUpdate(
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

/**
 * @swagger
 *
 * /api/v1/users/{_usersId}/permissions/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
 *     responses:
 *       '200':
 *         description: A record of a user
 *
 *     parameters:
 *       - in: path
 *         name: _usersId
 *         required: true
 *         type: string
 *         description: "Get user by id"
 *
 *       - in: "body"
 *         name: "body"
 *         description: "Add permission to User by _id"
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              _id:
 *                type: "string"
 *                required: true
 *
 */

exports.postSingleAddPermissionToUser = async (req, res) => {
  try {
    const { body } = req;
    const _permissionId = body._id;
    const _userId = req.params._id;

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    if (!_permissionId) {
      return res.json({
        success: false,
        message:
          "request requires a json object with an _id of permissions _id.",
      });
    }

    const permissionsWithSameId = await PermissionModel.findById(_permissionId);

    if (permissionsWithSameId === null) {
      return res.json({
        success: false,
        message:
          "request requires a json object with an _id of an active permissions.",
      });
    }

    const newUser = await User.findOneAndUpdate(
      { _id: _userId },
      { $push: { permissions: { _id: _permissionId } } },
      { new: true }
    );

    res.json({
      success: true,
      data: newUser,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/users/{_usersId}/permissions/{_permissionsId}:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
 *     responses:
 *       '200':
 *         description: A record of a user
 *
 *     parameters:
 *       - in: path
 *         name: _usersId
 *         required: true
 *         type: string
 *         description: The user record you want
 *       - in: path
 *         name: _permissionsId
 *         required: true
 *         type: string
 *         description: The permission you want to delete on this record.
 *
 */

exports.deleteSinglePermissionInArrayForUser = async (req, res) => {
  try {
    const _permissionId = req.params._permissionsId;
    const _userId = req.params._id;

    const usersWithSameId = await User.findById(_userId);

    if (usersWithSameId === null) {
      return res.json({
        success: false,
        message: "User doesn't exist.",
      });
    }

    const newUser = await User.findOneAndUpdate(
      { _id: _userId },
      { $pull: { permissions: _permissionId } },
      { new: true }
    );

    res.json({
      success: true,
      data: newUser,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/users/{_usersId}/roles/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
 *     responses:
 *       '200':
 *         description: A record of a user
 *
 *     parameters:
 *       - in: path
 *         name: _usersId
 *         required: true
 *         type: string
 *         description: "Get user by id"
 *
 *       - in: "body"
 *         name: "body"
 *         description: "Add permission to User by _id"
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              _id:
 *                type: "string"
 *                required: true
 *
 */

exports.postSingleAddRoleToUser = async (req, res) => {
  try {
    const { body } = req;
    const _roleId = body._id;
    const _userId = req.params._id;

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    if (!_roleId) {
      return res.json({
        success: false,
        message:
          "request requires a json object with an _id of permissions _id.",
      });
    }

    const roleWithSameId = await RoleModel.findById(_roleId);

    if (roleWithSameId === null) {
      return res.json({
        success: false,
        message:
          "request requires a json object with an _id of an active permissions.",
      });
    }

    const newUser = await User.findOneAndUpdate(
      { _id: _userId },
      { $push: { roles: { _id: _roleId } } },
      { new: true }
    );

    res.json({
      success: true,
      data: newUser,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/users/{_usersId}/roles/{_rolesId}:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Get a record of a user.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Users"
 *     responses:
 *       '200':
 *         description: A record of a user
 *
 *     parameters:
 *       - in: path
 *         name: _usersId
 *         required: true
 *         type: string
 *         description: The user record you want
 *       - in: path
 *         name: _rolesId
 *         required: true
 *         type: string
 *         description: The permission you want to delete on this record.
 *
 */

exports.deleteSingleRoleInArrayForUser = async (req, res) => {
  try {
    const _roleId = req.params._rolesId;
    const _userId = req.params._id;

    const usersWithSameId = await User.findById(_userId);

    if (usersWithSameId === null) {
      return res.json({
        success: false,
        message: "User doesn't exist.",
      });
    }

    const newUser = await User.findOneAndUpdate(
      { _id: _userId },
      { $pull: { roles: _roleId } },
      { new: true }
    );

    res.json({
      success: true,
      data: newUser,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};
