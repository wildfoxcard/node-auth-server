const validator = require("validator");
const User = require("../../models/User");
const {
  sendEmail,
  sendEmailWithSecurityDowngrade,
} = require("../../processes/send-email");

exports.processResetPassword = (
  { password, confirm, token },
  { validationFailedFN, noUserWithTokenFN, errorFN, successFN }
) => {
  const validationErrors = [];

  if (password !== confirm)
    validationErrors.push({ msg: "Passwords do not match" });
  if (!validator.isHexadecimal(token))
    validationErrors.push({ msg: "Invalid Token.  Please retry." });

  const passwordPolicy = processEnforcePasswordPolicy({ text: password });

  if (!passwordPolicy.success) {
    passwordPolicy.messages.map((p) => {
      validationErrors.push(p);
    });
  }
  if (validationErrors.length) {
    return validationFailedFN(validationErrors);
  }

  const resetPassword = () =>
    User.findOne({ passwordResetToken: token })
      .where("passwordResetExpires")
      .gt(Date.now())
      .then((user) => {
        if (!user) {
          return noUserWithTokenFN();
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return user.save().then(
          () =>
            new Promise((resolve, reject) => {
              req.logIn(user, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve(user);
              });
            })
        );
      });

  const sendResetPasswordEmail = (user) => {
    if (!user) {
      return;
    }

    const { emailTemplates } = Settings.findOne({});

    const mailOptions = {
      to: user.email,
      from: emailTemplates.vars.fromEmail,
      subject: emailTemplates.resetPasswordEmailSubject,
      text: emailTemplates.resetPasswordEmailMessage,
    };
    return sendEmail(mailOptions)
      .then(() => {})
      .catch((err) => {
        if (err.message === "self signed certificate in certificate chain") {
          console.log(
            "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
          );
          // transporter = nodemailer.createTransport({
          //   service: "SendGrid",
          //   auth: {
          //     user: process.env.SENDGRID_USER,
          //     pass: process.env.SENDGRID_PASSWORD,
          //   },
          //   tls: {
          //     rejectUnauthorized: false,
          //   },
          // });
          return sendEmailWithSecurityDowngrade(mailOptions).then(() => {
            // req.flash("success", {
            //   msg: "Success! Your password has been changed.",
            // });
          });
        }

        return errorFN(err);
        // console.log(
        //     "ERROR: Could not send password reset confirmation email after security downgrade.\n",
        //     err
        //   );
        //   req.flash("warning", {
        //     msg:
        //       "Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly.",
        //   });
        //   return err;
      });
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => successFN())
    .catch((err) => next(err));
};
