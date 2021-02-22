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
const {
  errorReporterWithHtml,
} = require("../processes/errorReporter");

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
// const { processSignup } = require("../processes/auth/_sign-up");

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  try {
    if (req.user) {
      return res.redirect("/");
    }
    res.render("account/login", {
      title: "Login",
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.getRequest = (req, res) => {
  try {
    res.render("account/signup-request-wait", {
      title: "Wait for request.",
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
 * POST /login
 * Sign in using email and password.
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
          req.flash("errors", validationErrors);
          return res.redirect("/login");
        },
        signInErrorFN: (err) => {
          return next(err);
        },
        noUserErrorFN: (err, user, info) => {
          req.flash("errors", info);
          return res.redirect("/login");
        },
        successFN: (err, user) => {
          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }
            req.flash("success", { msg: "Success! You are logged in." });
            res.redirect(req.session.returnTo || "/");
          });
        },
      },

      { req, res, next }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  try {
    req.logout();
    req.session.destroy((err) => {
      if (err)
        console.log(
          "Error : Failed to destroy the session during logout.",
          err
        );
      req.user = null;
      res.redirect("/");
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
 * GET /signup
 * Signup page.
 */
exports.getSignup = async (req, res) => {
  try {
    if (req.user) {
      return res.redirect("/");
    }
    const settingsResult = await SettingsModel.findOne({});

    console.log("settingsResult", settingsResult);

    switch (settingsResult.newUsers.type[0].toUpperCase()) {
      case "ANYONE":
        res.render("account/signup", {
          title: "Create Account",
        });
        break;
      case "REQUEST":
        res.render("account/signup-request", {
          title: "Create Account",
        });
        break;
      case "MANUAL":
        res.render("account/signup-closed", {
          title: "Create Account",
        });
        break;
    }
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * POST /signup
 * Create a new local account.
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
        validationFailedFN: (validationErrors) => {
          req.flash("errors", validationErrors);
          return res.redirect("/signup");
        },
        signInErrorFN: (err) => {
          return next(err);
        },
        noUserErrorFN: (err, user, info) => {
          req.flash("errors", {
            msg: "Account with that email address already exists.",
          });
          return res.redirect("/signup");
        },
        successFN: (user) => {
          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }
            res.redirect("/");
          });
        },
      }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  try {
    res.render("account/profile", {
      title: "Account Management",
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
 * POST /account/profile
 * Update profile information.
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
        validationFailedFN: (validationErrors) => {
          req.flash("errors", validationErrors);
          return res.redirect("/account");
        },
        errorFN: (err) => {
          return next(err);
        },
        userSaveFn: (err) => {
          if (err.code === 11000) {
            req.flash("errors", {
              msg:
                "The email address you have entered is already associated with an account.",
            });
            return res.redirect("/account");
          }
          return next(err);
        },

        successFN: () => {
          req.flash("success", {
            msg: "Profile information has been updated.",
          });
          res.redirect("/account");
        },
      }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * POST /account/password
 * Update current password.
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
        validationFailedFN: (validationErrors) => {
          req.flash("errors", validationErrors);

          return res.redirect("/account");
        },
        userFindByIdErrorFn: (err) => {
          return next(err);
        },
        userSaveErrorFn: (err) => {
          return next(err);
        },
        successFN: () => {
          req.flash("success", { msg: "Password has been changed." });
          res.redirect("/account");
        },
      }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  try {
    processDeleteAccount(
      { id: req.user.id },
      {
        userFinByIdErrorFN: (err) => {
          return next(err);
        },
        successFN: () => {
          req.logout();
          req.flash("info", { msg: "Your account has been deleted." });
          res.redirect("/");
        },
      }
    );
    // User.deleteOne({ _id: req.user.id }, (err) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   req.logout();
    //   req.flash("info", { msg: "Your account has been deleted." });
    //   res.redirect("/");
    // });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  try {
    const { provider } = req.params;
    User.findById(req.user.id, (err, user) => {
      if (err) {
        return next(err);
      }
      user[provider.toLowerCase()] = undefined;
      const tokensWithoutProviderToUnlink = user.tokens.filter(
        (token) => token.kind !== provider.toLowerCase()
      );
      // Some auth providers do not provide an email address in the user profile.
      // As a result, we need to verify that unlinking the provider is safe by ensuring
      // that another login method exists.
      if (
        !(user.email && user.password) &&
        tokensWithoutProviderToUnlink.length === 0
      ) {
        req.flash("errors", {
          msg:
            `The ${_.startCase(
              _.toLower(provider)
            )} account cannot be unlinked without another form of login enabled.` +
            " Please link another account or add an email address and password.",
        });
        return res.redirect("/account");
      }
      user.tokens = tokensWithoutProviderToUnlink;
      user.save((err) => {
        if (err) {
          return next(err);
        }
        req.flash("info", {
          msg: `${_.startCase(_.toLower(provider))} account has been unlinked.`,
        });
        res.redirect("/account");
      });
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
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    const validationErrors = [];
    if (!validator.isHexadecimal(req.params.token))
      validationErrors.push({ msg: "Invalid Token.  Please retry." });
    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.redirect("/forgot");
    }

    User.findOne({ passwordResetToken: req.params.token })
      .where("passwordResetExpires")
      .gt(Date.now())
      .exec((err, user) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          req.flash("errors", {
            msg: "Password reset token is invalid or has expired.",
          });
          return res.redirect("/forgot");
        }
        res.render("account/reset", {
          title: "Password Reset",
        });
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
 * GET /account/verify/:token
 * Verify email address
 */
exports.getVerifyEmailToken = (req, res, next) => {
  try {
    processVerifyEmailToken(
      {
        user: req.user,
        token: req.params.token,
      },
      {
        noEmailVerifiedTokenFn: () => {
          req.flash("errors", {
            msg:
              "The verification link was invalid, or is for a different account.",
          });
          return res.redirect("/account");
        },
        userEmailIsAlreadyVerifiedFn: () => {
          req.flash("info", { msg: "The email address has been verified." });
          return res.redirect("/account");
        },
        validationFailedFN: (validationErrors) => {
          req.flash("errors", validationErrors);
          return res.redirect("/account");
        },
        noUserErrorFN: () => {
          req.flash("errors", {
            msg: "There was an error in loading your profile.",
          });
          return res.redirect("back");
        },
        userSaveErrorFN: (error) => {
          console.log(
            "Error saving the user profile to the database after email verification",
            error
          );
          req.flash("errors", {
            msg:
              "There was an error when updating your profile.  Please try again later.",
          });
          return res.redirect("/account");
        },
        successFN: () => {
          req.flash("info", {
            msg: "Thank you for verifying your email address.",
          });
          return res.redirect("/account");
        },
      }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * GET /account/verify
 * Verify email address
 */
exports.getVerifyEmail = (req, res, next) => {
  try {
    processSendEmailforVerifyToken(
      {
        user: req.user,
      },
      {
        userEmailIsAlreadyVerifiedFn: () => {
          req.flash("info", { msg: "The email address has been verified." });
          return res.redirect("/account");
        },
        mailCheckerNoValidFn: () => {
          req.flash("errors", {
            msg:
              "The email address is invalid or disposable and can not be verified.  Please update your email address and try again.",
          });
          return res.redirect("/account");
        },
        successFn: () => {
          req.flash("info", {
            msg: `An e-mail has been sent to ${req.user.email} with further instructions.`,
          });
          return res.redirect("/account");
        },
      }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * POST /reset/:token
 * Process the reset password request.
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
        validationFailedFN: (validationErrors) => {
          req.flash("errors", validationErrors);
          return res.redirect("back");
        },
        noUserWithTokenFN: () => {
          req.flash("errors", {
            msg: "Password reset token is invalid or has expired.",
          });
          return res.redirect("back");
        },
        errorFN: () => {
          console.log(
            "ERROR: Could not send password reset confirmation email after security downgrade.\n",
            err
          );
          req.flash("warning", {
            msg:
              "Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly.",
          });
          return err;
        },
        successFN: () => {
          req.flash("success", {
            msg: "Success! Your password has been changed.",
          });
          if (!res.finished) res.redirect("/");
        },
      }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  try {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    res.render("account/forgot", {
      title: "Forgot Password",
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
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  try {
    processSendEmailForPasswordReset(
      {
        email: req.body.email,
      },
      {
        validationFailedFN: (validationErrors) => {
          req.flash("errors", validationErrors);
          return res.redirect("/forgot");
        },
        noUserErrorFN: () => {
          req.flash("errors", {
            msg: "Account with that email address does not exist.",
          });
        },
        errorFN: () => {
          console.log(
            "ERROR: Could not send forgot password email after security downgrade.\n",
            err
          );
          req.flash("errors", {
            msg:
              "Error sending the password reset message. Please try again shortly.",
          });
          return err;
        },
        successFn: () => {
          req.flash("info", {
            msg: `An e-mail has been sent to ${user.email} with further instructions.`,
          });
          res.redirect("/forgot");
        },
      }
    );
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};
