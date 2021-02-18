const validator = require("validator");
const User = require("../../models/User");

exports.processVerifyEmailToken = (
  { user, token },
  {
    noEmailVerifiedTokenFn,
    userEmailIsAlreadyVerifiedFn,
    validationFailedFN,
    noUserErrorFN,
    userSaveErrorFN,
    successFN,
  }
) => {
  if (user.emailVerified) {
    return userEmailIsAlreadyVerifiedFn();
  }

  const validationErrors = [];
  if (token && !validator.isHexadecimal(token))
    validationErrors.push({ msg: "Invalid Token.  Please retry." });
  if (validationErrors.length) {
    return validationFailedFN(validationErrors);
  }

  if (token === user.emailVerificationToken) {
    User.findOne({ email: user.email })
      .then((user) => {
        if (!user) {
          return noUserErrorFN();
        }
        user.emailVerificationToken = "";
        user.emailVerified = true;
        user = user.save();

        return successFN(user);
      })
      .catch((error) => {
        return userSaveErrorFN(error);
      });
  } else {
    return noEmailVerifiedTokenFn();
  }
};
