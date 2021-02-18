const passport = require("passport");
const validator = require("validator");

exports.processLogin = (
  { email, password },
  { validationFailedFN, signInErrorFN, noUserErrorFN, successFN }
) => {
  const validationErrors = [];
  if (!validator.isEmail(email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (validator.isEmpty(password))
    validationErrors.push({ msg: "Password cannot be blank." });

  if (validationErrors.length) {
    return validationFailedFN(validationErrors);
  }
  email = validator.normalizeEmail(email, {
    gmail_remove_dots: false,
  });

  return passport.authenticate("local", (err, user, info) => {
    if (err) {
      return signInErrorFN(err);
    }
    if (!user) {
      return noUserErrorFN(err, user, info);
    }

    return successFN(err, user);
  });
};
