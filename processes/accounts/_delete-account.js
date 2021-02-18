const User = require("../../models/User");

exports.processDeleteAccount = ({ id }, { userFinByIdErrorFN, successFN }) => {
  User.deleteOne({ _id: id }, (err) => {
    if (err) {
      return userFinByIdErrorFN(err);
    }
    return successFN();
  });
};
