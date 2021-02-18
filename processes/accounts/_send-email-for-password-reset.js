const validator = require("validator");
const User = require("../../models/User");
const {
  sendEmail,
  sendEmailWithSecurityDowngrade,
} = require("../../processes/send-email");

exports.processSendEmailForPasswordReset = (
  { email },
  { validationFailedFN, noUserErrorFN, errorFN, successFn }
) => {
  const validationErrors = [];
  if (!validator.isEmail(email))
    validationErrors.push({ msg: "Please enter a valid email address." });

  if (validationErrors.length) {
    return validationFailedFN(validationErrors);
  }
  email = validator.normalizeEmail(email, {
    gmail_remove_dots: false,
  });

  const createRandomToken = randomBytesAsync(16).then((buf) =>
    buf.toString("hex")
  );

  const setRandomToken = (token) =>
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        return noUserErrorFN();
      } else {
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user = user.save();
      }
      return user;
    });

  const sendForgotPasswordEmail = (user) => {
    if (!user) {
      return;
    }

    const { emailTemplates } = Settings.findOne({});

    const token = user.passwordResetToken;
    // let transporter = nodemailer.createTransport({
    //   service: "SendGrid",
    //   auth: {
    //     user: process.env.SENDGRID_USER,
    //     pass: process.env.SENDGRID_PASSWORD,
    //   },
    // });
    const mailOptions = {
      to: user.email,
      from: emailTemplates.vars.fromEmail,
      subject: emailTemplates.passwordResetSubject,
      text: emailTemplates.passwordResetMessage,
      token
    };
    return sendEmail(mailOptions)
      .then(() => {
        // req.flash("info", {
        //   msg: `An e-mail has been sent to ${user.email} with further instructions.`,
        // });
      })
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
            // req.flash("info", {
            //   msg: `An e-mail has been sent to ${user.email} with further instructions.`,
            // });
          });
        }

        return errorFN();
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => successFn())
    .catch(next);
};
