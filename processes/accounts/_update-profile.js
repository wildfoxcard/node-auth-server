const validator = require("validator");
const User = require("../../models/User");

exports.processUpdateProfile = (
  { email, name, gender, location, website },
  { validationFailedFN, errorFN, noUserErrorFN, successFN }
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

  User.findById(req.user.id, (err, user) => {
    if (err) {
        return errorFN(err);
    }
    if (user.email !== email) user.emailVerified = false;
    user.email = email || "";
    user.profile.name = name || "";
    user.profile.gender = gender || "";
    user.profile.location = location || "";
    user.profile.website = website || "";
    user.save((err) => {
      if (err) {
        
        return userSaveFn(err);
      }
      return successFN()
    });
  });
};
