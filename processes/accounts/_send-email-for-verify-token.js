const mailChecker = require("mailchecker");
const User = require("../../models/User");
const {
  sendEmail,
  sendEmailWithSecurityDowngrade,
} = require("../../processes/send-email");

exports.processSendEmailforVerifyToken = (
  { user },
  { userEmailIsAlreadyVerifiedFn, mailCheckerNoValidFn, successFn }
) => {
  if (user.emailVerified) {
    return userEmailIsAlreadyVerifiedFn();
  }

  if (!mailChecker.isValid(user.email)) {
    return mailCheckerNoValidFn();
  }

  const createRandomToken = randomBytesAsync(16).then((buf) =>
    buf.toString("hex")
  );

  const setRandomToken = (token) => {
    User.findOne({ email: user.email }).then((user) => {
      user.emailVerificationToken = token;
      user = user.save();
    });
    return token;
  };

  const sendVerifyEmail = (token) => {
    const { emailTemplates } = Settings.findOne({});

    const mailOptions = {
      to: user.email,
      from: emailTemplates.vars.fromEmail,
      subject: emailTemplates.emailVerificationSubject,
      text: emailTemplates.emailVerificationMessage,
      token
    };
    return sendEmail(mailOptions)
      .catch((err) => {
        if (err.message === "self signed certificate in certificate chain") {
          console.log(
            "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
          );
          
          return sendEmailWithSecurityDowngrade(mailOptions);
        }
        return errorFn(err);
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendVerifyEmail)
    .then(() => successFn())
    .catch(next);
};
