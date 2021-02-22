const { promisify } = require("util");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const passport = require("passport");
const _ = require("lodash");
const validator = require("validator");
const mailChecker = require("mailchecker");
const User = require("../models/User");
const jwt = require("../config/jwt");
const SettingsModel = require("../models/Settings");
const {
  sendEmail,
  sendEmailWithSecurityDowngrade,
} = require("../processes/send-email");
const { errorReporter } = require("../processes/errorReporter");

const randomBytesAsync = promisify(crypto.randomBytes);

const {
  processLogin,
  processSignup,
  processUpdateProfile,
  processUpdatePassword,
  processDeleteAccount,
  processVerifyEmailToken,
  processSendEmailforVerifyToken,
  processResetPassword,
  processSendEmailForPasswordReset,
} = require("../processes/accounts");

/**
 * @swagger
 *
 * /api/v1/login/:
 *   post:
 *     description: Sign in using email and password
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Sign in using email and password.
 *     parameters:
 *       - name: email
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         in: formData
 *         required: true
 *         type: string
 *
 */
exports.postLogin = (req, res, next) => {
  try {
    processLogin(
      {
        email: req.body.email,
        password: req.body.password,
      },
      {
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.map(e => e.msg).join(", ") });
          // req.flash("errors", validationErrors);/
          // return res.redirect("/login");
        },
        signInErrorFN: (err) => {
          res
            .status(400)
            .json({ success: false, message: "User couldn't sign in." });
        },
        noUserErrorFN: (err, user, info) => {
          res.status(400).json({ success: false, message: info });
          // return res.redirect("/login");
        },
        successFN: (err, user) => {
          if (err) {
            return next(err);
          }

          var claims = {
            _id: user._id,
          };

          var token = jwt.sign(claims, process.env.JWT_SECRET, {
            expiresIn: 60, // in seconds
          });

          //https://stackoverflow.com/questions/39163413/node-js-passport-jwt-how-to-send-token-in-a-cookie
          res.cookie("jwt", token); // add cookie here
          res.status(200).json({ success: true, token: token });
        },
      }
    )(req, res, next);
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/signup/:
 *   post:
 *     description: Create a new local account
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Create a new local account
 *     parameters:
 *       - name: email
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         in: formData
 *         required: true
 *         type: string
 *
 */
exports.postSignup = (req, res, next) => {
  try {
    processSignup(
      {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
      },
      {
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.map(e => e.msg).join(", ") });
        },
        signInErrorFN: (err) => {
          res
            .status(400)
            .json({ success: false, message: "User couldn't sign in." });
        },
        noUserErrorFN: (err, user, info) => {
          res.status(400).json({ success: false, message: info });
        },
        successFN: (err, user) => {
          if (err) {
            return next(err);
          }

          var claims = {
            _id: user._id,
          };

          var token = jwt.sign(claims, process.env.JWT_SECRET, {
            expiresIn: 60, // in seconds
          });

          //https://stackoverflow.com/questions/39163413/node-js-passport-jwt-how-to-send-token-in-a-cookie
          res.cookie("jwt", token); // add cookie here
          res.status(200).json({ success: true, token: token });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};


/**
 * @swagger
 *
 * /api/v1/forgot/:
 *   post:
 *     description: Create a random token, then the send user an email with a reset link.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Create a random token, then the send user an email with a reset link.
 *     parameters:
 *       - name: email
 *         in: formData
 *         required: true
 *         type: string
 *
 */

exports.postForgot = (req, res, next) => {
  try {
    processSendEmailForPasswordReset(
      {
        email: req.body.email,
      },
      {
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.map(e => e.msg).join(", ") });
        },
        noUserErrorFN: () => {
          res.status(400).json({
            success: false,
            message: `Account with that email address does not exist.`,
          });
        },
        errorFN: () => {
          res.status(400).json({
            success: false,
            message: `ERROR: Could not send password reset confirmation email after security downgrade`,
          });
        },
        successFn: (user) => {
          res.status(200).json({
            success: true,
            message: `An e-mail has been sent to ${user.email} with further instructions.`,
          });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};


/**
 * @swagger
 *
 * /api/v1/forgot/{token}:
 *   post:
 *     description: Process the reset password request.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Process the reset password request.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         type: string
 *         description: Token from email template "Password Reset" using /api/v1/forgot/
 *       - name: password
 *         in: formData
 *         required: true
 *         type: string
 *       - name: confirm
 *         in: formData
 *         required: true
 *         type: string
 *
 */

exports.postReset = (req, res, next) => {
  try {
    processResetPassword(
      {
        password: req.body.password,
        confirm: req.body.confirm,
        token: req.params.token,
      },
      {
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.map(e => e.msg).join(", ") });
        },
        noUserWithTokenFN: () => {
          res.status(400).json({
            success: false,
            message: `Password reset token is invalid or has expired.`,
          });
        },
        errorFN: (err) => {
          res.status(400).json({
            success: false,
            message: `ERROR: Could not send password reset confirmation email after security downgrade`,
          });
        },
        successFN: () => {
          res.status(200).json({
            success: true,
            message: `Success! Your password has been changed`,
          });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};


/**
 * @swagger
 *
 * /api/v1/account/profile/:
 *   post:
 *     description: Update profile information.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description:Update profile information.
 *     parameters:
 *       - name: email
 *         in: formData
 *         required: false
 *         type: string
 *       - name: name
 *         in: formData
 *         required: false
 *         type: string
 *       - name: gender
 *         in: formData
 *         required: false
 *         type: string
 *       - name: location
 *         in: formData
 *         required: false
 *         type: string
 *       - name: website
 *         in: formData
 *         required: false
 *         type: string
 *
 */

exports.postUpdateProfile = (req, res, next) => {
  try {
    //  processUpdateProfile
    processUpdateProfile(
      {
        email: req.body.email,
        name: req.body.name,
        gender: req.body.gender,
        location: req.body.location,
        website: req.body.website,
      },
      {
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.map(e => e.msg).join(", ") });
        },
        errorFN: (err) => {
          res.status(400).json({ success: false, message: err });
        },
        userSaveFn: (err) => {
          if (err.code === 11000) {
            res.status(400).json({
              success: false,
              message: `ERROR: The email address you have entered is already associated with an account.`,
            });
          }
          res.status(400).json({ success: false, message: err });
        },

        successFN: () => {
          res.status(200).json({
            success: true,
            message: "Profile information has been updated.",
          });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/account/password/:
 *   post:
 *     description:  Update current password.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Update current password.
 *     parameters:
 *       - name: password
 *         in: formData
 *         required: false
 *         type: string
 *       - name: confirmPassword
 *         in: formData
 *         required: false
 *         type: string
 *
 */

exports.postUpdatePassword = (req, res, next) => {
  try {
    processUpdatePassword(
      {
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        id: req.user.id,
      },
      {
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.map(e => e.msg).join(", ") });
        },
        userFindByIdErrorFn: (err) => {
          res.status(400).json({ success: false, message: err });
        },
        userSaveErrorFn: (err) => {
          res.status(400).json({ success: false, message: err });
        },
        successFN: () => {
          res.status(400).json({
            success: true,
            message: "Password has been changed.",
          });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};


/**
 * @swagger
 *
 * /api/v1/account/delete/:
 *   post:
 *     description:  Delete user account.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Delete user account.
 *
 */

exports.postDeleteAccount = (req, res, next) => {
  try {
    processDeleteAccount(
      { id: req.user.id },
      {
        userFinByIdErrorFN: (err) => {
          res.status(400).json({ success: false, message: err });
        },
        successFN: () => {
          res.status(200).json({
            success: true,
            message: "Your account has been deleted.",
          });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/account/verify/:
 *   post:
 *     description:  Create a random token, then the send user an email with a verify link.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Create a random token, then the send user an email with a verify link.
 *
 */

exports.postVerifyEmail = (req, res, next) => {
  try {
    processSendEmailforVerifyToken(
      {
        user: req.user,
      },
      {
        userEmailIsAlreadyVerifiedFn: () => {
          res.status(400).json({
            success: false,
            message: `The email address has been verified.`,
          });
        },
        mailCheckerNoValidFn: () => {
          res.status(422).json({
            success: false,
            message: `The email address is invalid or disposable and can not be verified.  Please update your email address and try again.`,
          });
        },
        successFn: () => {
          res.status(200).json({
            success: true,
            message: `An e-mail has been sent to ${req.user.email} with further instructions.`,
          });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};


/**
 * @swagger
 *
 * /api/v1/account/verify/{token}:
 *   post:
 *     description: Verify email address.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Account"
 *     responses:
 *       '200':
 *         description: Verify email address.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         type: string
 *         description: Token from email template "Email Address Verification" using /api/v1/account/verify/
 *
 */

exports.postVerifyEmailToken = (req, res, next) => {
  try {
    processVerifyEmailToken(
      {
        user: req.user,
        token: req.params.token,
      },
      {
        noEmailVerifiedTokenFn: () => {
          res.status(422).json({
            success: false,
            message: `The verification link was invalid, or is for a different account.`,
          });
          // req.flash("errors", {
          //   msg:
          //     "The verification link was invalid, or is for a different account.",
          // });
          // return res.redirect("/account");
        },
        userEmailIsAlreadyVerifiedFn: () => {
          res.status(400).json({
            success: false,
            message: `The email address has been verified.`,
          });
        },
        validationFailedFN: () => {
          res
            .status(422)
            .json({ success: false, message: validationErrors.map(e => e.msg).join(", ") });
        },
        noUserErrorFN: () => {
          res.status(400).json({
            success: false,
            message: `There was an error in loading your profile.`,
          });
        },
        userSaveErrorFN: (error) => {
          console.log(
            "Error saving the user profile to the database after email verification",
            error
          );

          res.status(400).json({
            success: false,
            message: `There was an error when updating your profile.  Please try again later.`,
          });
        },
        successFN: () => {
          res.status(200).json({
            success: true,
            message: `Thank you for verifying your email address`,
          });
        },
      }
    );
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};
