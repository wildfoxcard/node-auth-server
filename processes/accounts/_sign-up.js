const validator = require("validator");
const User = require("../../models/User");
const {
  processEnforcePasswordPolicy,
} = require("../../processes/enforce-password-policy");

exports.processSignup = async (
  { email, password, confirmPassword },
  { validationFailedFN, signInErrorFN, noUserErrorFN, successFN }
) => {
  const validationErrors = [];
  if (!validator.isEmail(email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  // if (!validator.isLength(password, { min: 8 }))
  //   validationErrors.push({
  //     msg: "Password must be at least 8 characters long",
  //   });
  if (password !== confirmPassword)
    validationErrors.push({ msg: "Passwords do not match" });

  const passwordPolicy = await processEnforcePasswordPolicy({ text: password });

  if (!passwordPolicy.success) {
    passwordPolicy.messages.map((p) => {
      validationErrors.push(p);
    });
  }

  if (validationErrors.length) {
    return validationFailedFN(validationErrors);
  }
  email = validator.normalizeEmail(email, {
    gmail_remove_dots: false,
  });

  let isAdmin = false
  if (await User.countDocuments() === 0) {
    isAdmin = true;
  }

  const user = new User({
    email: email,
    password: password,
    isAdmin
  });

  User.findOne({ email: email }, (err, existingUser) => {
    if (err) {
      return signInErrorFN(err);
    }
    if (existingUser) {
      return noUserErrorFN(err, user);
    }
    user.save((err) => {
      if (err) {
        return signInErrorFN(err);
      }

      return successFN(user);
    });
  });
};
