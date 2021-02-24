const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const Permission = require("../../models/Permission");
const Role = require("../../models/Role");
const User = require("../../models/User");
const Settings = require("../../models/Settings");
const {
  errorReporter,
  errorReporterWithHtml,
} = require("../../processes/errorReporter");

/**
 * GET /
 * Home page.
 */
exports.viewGeneral = (req, res) => {
  try {
    res.render("pages/settings/settings-index", {
      title: "General | Settings",
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
 * /api/v1/settings/general/:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get general settings.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '200':
 *         description: Get general settings.
 *
 */
exports.getGeneral = async (req, res) => {
  try {
    const settings = await Settings.findOne({});

    res.status(200).json({
      success: true,
      data: settings.general,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this role.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/settings/general/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Update general settings.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '201':
 *         description: Update general settings.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of name. More to come in the future."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *                companyName:
 *                  type: "String"
 *
 */
exports.postGeneral = async (req, res) => {
  try {
    await Settings.findOneAndUpdate(
      {},
      { general: req.body },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this role.",
    });
  }
};

exports.viewNewUsers = (req, res) => {
  try {
    res.render("pages/settings/settings-new-users", {
      title: "New Users | Settings",
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
 * /api/v1/settings/new-users/:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get settings for new user requirements.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '200':
 *         description:  Get settings for new user requirements.
 *
 */
exports.getNewUsers = async (req, res) => {
  try {
    const settings = await Settings.findOne({});

    res.status(200).json({
      success: true,
      data: settings.newUsers,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with retrieving this record.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/settings/new-users/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Update new users settings.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '201':
 *         description: Update new users settings.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of type. This is an enum of ('ANYONE', 'PASSWORD', 'REQUEST', 'MANUAL'). 'Anyone' is dangerous in production because anyone can become an admin of your organization. 'Password' is risky in production because a password to join can be shared. 'Request' is safe because the user signs up but an admin needs to approve. 'Manual' is safe because there is no sign up, admin must add every user manually. If type enum has password selected, then a property of password is required."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *                name:
 *                  type: "String"
 *
 */
exports.postNewUsers = async (req, res) => {
  try {
    const { password, type } = req.body;

    const newSettings = await Settings.findOneAndUpdate(
      {},
      { newUsers: req.body },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      data: newSettings.newUsers,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this role.",
    });
  }
};

exports.viewExports = async (req, res) => {
  try {
    const setting = await Settings.findOne({});
    const permissions = await Permission.find({ isDeleted: { $ne: true } });
    const roles = await Role.find({ isDeleted: { $ne: true } });
    const testUsers = await User.find({
      isDeleted: { $ne: true },
      type: "TEST",
    })
      .populate("permissions")
      // .populate('roles')
      .populate({
        path: "roles",
        populate: {
          path: "permissions",
        },
      })
      .exec();
    const applicationUsers = await User.find({
      isDeleted: { $ne: true },
      type: "APPLICATION",
    })
      .populate("permissions")
      // .populate('roles')
      .populate({
        path: "roles",
        // populate: {
        //   path: "permissions",
        // },
      })
      .exec();
    res.render("pages/settings/settings-exports", {
      title: "Exports | Settings",
      setting,
      permissions,
      roles,
      testUsers,
      applicationUsers,
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.postExports = async (req, res) => {
  try {
    const {
      permissions,
      roles,
      testUsers,
      applicationUsers,
      settings,
      filename,
      defaultPassword,
    } = req.body;

    const dbApplicationUsers = [],
      dbTestUsers = [];

    if (testUsers) {
      for (var i = 0; i < testUsers.length; i++) {
        const currentTestUser = await User.findOne({ email: testUsers[i] })
          .populate("roles")
          .populate("permissions")
          .exec();

        let addPropertiesObj = {};
        let newPermissions = [];
        let newRoles = [];

        if (defaultPassword) {
          addPropertiesObj.password = defaultPassword;
        }

        if (currentTestUser.permissions) {
          newPermissions = currentTestUser.permissions.map((p) => p.name);
        }

        if (currentTestUser.roles) {
          newRoles = currentTestUser.roles.map((r) => r.name);
        }

        dbTestUsers.push(
          Object.assign(addPropertiesObj, {
            email: testUsers[i],
            permissions: newPermissions,
            roles: newRoles,
            profile: currentTestUser.profile,
          })
        );
      }
    }

    if (applicationUsers) {
      for (var i = 0; i < applicationUsers.length; i++) {
        const currentApplicationUser = await User.findOne({
          email: applicationUsers[i],
        })
          .populate("roles")
          .populate("permissions")
          .exec();

        let addPropertiesObj = {};
        let newPermissions = [];
        let newRoles = [];

        if (defaultPassword) {
          addPropertiesObj.password = defaultPassword;
        }

        if (currentApplicationUser.permissions) {
          newPermissions = currentApplicationUser.permissions.map(
            (p) => p.name
          );
        }

        if (currentApplicationUser.roles) {
          newRoles = currentApplicationUser.roles.map((r) => r.name);
        }

        dbApplicationUsers.push(
          Object.assign(addPropertiesObj, {
            email: applicationUsers[i],
            permissions: newPermissions,
            roles: newRoles,
            profile: currentApplicationUser.profile,
          })
        );
      }
    }

    //all of settings

    //download this in yaml
    const finalData = {
      permissions,
      roles,
      testUsers: dbTestUsers,
      applicationUsers: dbApplicationUsers,
      settings,
    };

    const filePath = path.join(__dirname, "..", "..","uploads", "exports");
    const newFilename = `${filename}-${Date.now()}.yaml`

    const finalYaml = yaml.dump(finalData);

    await fs.writeFileSync(
      path.join(filePath, newFilename),
      finalYaml,
      "utf8"
    );

    res.json({success: true, filename: newFilename})

    // if (permissions) {
    //   permissions.map((permission, i) => {
    //     if (await Permissions.count({name: permission.name}) === 0) {
    //       const newPermission = new Permissions({name: permission.name})
    //     }
    //   })
    // }

    // if (roles) {

    // }

    // if (testUsers) {

    // }

    // if (applicationUsers) {

    // }

    // if (filename) {

    // }

    // if (defaultPassword) {

    // }
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged",
    });
  }
};

exports.getExportsFile = (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "..","uploads", "exports");

    res.download(path.join(filePath, req.query.filename))
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged",
    });
  }
}

exports.viewImports = (req, res) => {
  try {
    res.render("pages/settings/settings-imports", {
      title: "Imports | Settings",
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.viewEmailTemplates = (req, res) => {
  try {
    res.render("pages/settings/settings-email-templates", {
      title: "Email Templates | Settings",
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
 * /api/v1/settings/email-templates/:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get all email templates in the system.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '200':
 *         description:  Get all email templates in the system.
 *
 */
exports.getEmailTemplates = async (req, res) => {
  try {
    const settings = await Settings.findOne({});

    res.status(200).json({
      success: true,
      data: settings.emailTemplates,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with retrieving this record.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/settings/email-templates/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Update email templates.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '200':
 *         description: Update email templates.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with three properties; emailVerification, passwordReset, and emailChange. All three of these properties are objects containing two properties: subject, message."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *                emailVerification:
 *                  type: "object"
 *                  properties:
 *                    subject:
 *                      type: "String"
 *                    message:
 *                      type: "String"
 *                passwordReset:
 *                  type: "object"
 *                  properties:
 *                    subject:
 *                      type: "String"
 *                    message:
 *                      type: "String"
 *                emailChange:
 *                  type: "object"
 *                  properties:
 *                    subject:
 *                      type: "String"
 *                    message:
 *                      type: "String"
 *
 */
exports.postEmailTemplates = async (req, res) => {
  try {
    await Settings.findOneAndUpdate(
      {},
      { emailTemplates: req.body },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this role.",
    });
  }
};

exports.viewPasswordPolicy = (req, res) => {
  try {
    res.render("pages/settings/settings-password-policy", {
      title: "Password Policy | Settings",
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
 * /api/v1/settings/password-policy/:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get password policy in settings.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '200':
 *         description:  Get password policy in settings
 *
 */
exports.getPasswordPolicy = async (req, res) => {
  try {
    const settings = await Settings.findOne({});

    res.status(200).json({
      success: true,
      data: settings.passwordPolicy,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with retrieving this record.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/settings/password-policy/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Create the new password policy. This will override the old password policy.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Settings"
 *     responses:
 *       '201':
 *         description: Create a new password policy.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of roles. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *                passwordLength:
 *                  type: "number"
 *                shouldHaveUppercaseLetter:
 *                  type: "boolean"
 *                shouldHaveLowercaseLetter:
 *                  type: "boolean"
 *                shouldHaveNumber:
 *                  type: "boolean"
 *                shouldHaveSymbol:
 *                  type: "boolean"
 *
 */
exports.postPasswordPolicy = async (req, res) => {
  try {
    const { passwordLength } = req.body;

    if (passwordLength > 20 || passwordLength < 3) {
      return res.json({
        success: false,
        message: "Password length needs to be between 3-20",
      });
    }

    await Settings.findOneAndUpdate(
      {},
      { passwordPolicy: req.body },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this role.",
    });
  }
};
