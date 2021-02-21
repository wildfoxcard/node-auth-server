const { processLogin } = require("./_login");
const { processSignup } = require("./_sign-up");
const { processUpdateProfile } = require('./_update-profile')
const { processUpdatePassword } = require('./_update-password')
const { processDeleteAccount } = require('./_delete-account')
const { processVerifyEmailToken } = require('./_verify-email-token')
const { processSendEmailforVerifyToken } = require('./_send-email-for-verify-token')
const { processResetPassword } = require('./_reset-password')
const { processSendEmailForPasswordReset } = require('./_send-email-for-password-reset')
const { processApproveUserRequest } = require('./_approve-user-request')

module.exports = {
  processLogin,
  processSignup,
  processUpdateProfile,
  processUpdatePassword,
  processDeleteAccount,
  processVerifyEmailToken,
  processSendEmailforVerifyToken,
  processResetPassword,
  processSendEmailForPasswordReset,
  processApproveUserRequest,
};
