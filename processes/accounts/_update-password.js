const validator = require("validator");
const User = require("../../models/User");
const {
  processEnforcePasswordPolicy,
} = require("../../processes/enforce-password-policy");

exports.processUpdatePassword = (
  { id, password, confirmPassword },
  { validationFailedFN, userFindByIdErrorFn, userSaveErrorFn, successFN }
) => {
  const validationErrors = [];
  if (password !== confirmPassword)
    validationErrors.push({ msg: "Passwords do not match" });

  const passwordPolicy = processEnforcePasswordPolicy({ text: password });

  if (!passwordPolicy.success) {
    passwordPolicy.messages.map((p) => {
      validationErrors.push(p);
    });
  }
  if (validationErrors.length) {
    return validationFailedFN(validationErrors);
  }

  User.findById(id, (err, user) => {
    if (err) {
      return userFindByIdErrorFn(err);
    }
    user.password = password;
    user.save((err) => {
      if (err) {
        return userSaveErrorFn(err);
      }

      return successFN();
    });
  });
};
