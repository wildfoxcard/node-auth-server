const UserModel = require("../../models/User");

exports.processApproveUserRequest = async (
  { _id, email },
  { validationFailedFN, noUserErrorFN, errorFN, successFN }
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

  const userRequest = await UserRequestModel.findOneAndUpdate(
    { _id, isDeleted: { $ne: true } },
    { type: "ACCEPTED" },
    { new: true }
  );

  const setRandomToken = (token) => {
    const user = new UserModel({ email, password: `${token}` });

    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    user = user.save();

    return user;
  };

  const sendNewUserEmail = (user) => {
    if (!user) {
      return noUserErrorFN();
    }

    const { emailTemplates } = Settings.findOne({});

    const token = user.passwordResetToken;

    const mailOptions = {
      to: user.email,
      from: emailTemplates.vars.fromEmail,
      subject: emailTemplates.userApprovedSubject,
      text: emailTemplates.userApprovedMessage,
      token
    };
    return sendEmail(mailOptions).catch((err) => {
      if (err.message === "self signed certificate in certificate chain") {
        console.log(
          "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
        );
        return sendEmailWithSecurityDowngrade(mailOptions);
      }

      return errorFN();
    });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendNewUserEmail)
    .then(() => successFN())
    .catch(next);
};
