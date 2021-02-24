const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    passwordPolicy: {
      passwordLength: { type: Number, default: 6 },
      shouldHaveUppercaseLetter: { type: Boolean, default: false },
      shouldHaveLowercaseLetter: { type: Boolean, default: false },
      shouldHaveNumber: { type: Boolean, default: false },
      shouldHaveSymbol: { type: Boolean, default: false },
    },
    newUsers: {
      type: {
        type:["ANYONE", "REQUEST", "MANUAL"],
        default: "ANYONE",
      },
    },
    emailTemplates: {
      vars: {
        host: {
          type: String,
          default: process.env.BASE_URL || "http://localhost:8080/"
        },
        fromEmail: {
          type: String,
        },
        company: {
          type: String,
          default: "our company"
        },
        username: {
          type: String,
          default: "buddy"
        }
      },
      emailVerificationSubject: {
        type: String,
        default: "Please verify your email address on Hackathon Starter",
      },
      emailVerificationMessage: {
        type: String,
        default: `Thank you for registering with hackathon-starter.\n\nThis verify your email address please click on the following link, or paste this into your browser:\n\nhttp://{{host}}/account/verify/{{token}}\n\nThank you`,
      },
      passwordResetSubject: {
        type: String,
        default: "Reset your password on Hackathon Starter",
      },
      passwordResetMessage: {
        type: String,
        default: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n{{host}}/reset/{{token}}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
      },
      resetPasswordEmailSubject: {
        type: String,
        default: "Your Hackathon Starter password has been changed"
      },
      resetPasswordEmailMessage: {
        type: String,
        default: `Hello,\n\nThis is a confirmation that the password for your account {{userEmail}} has just been changed.\n`
      },
      // emailChangeSubject: {
      //   type: String,
      //   default: "emailChangeSubject",
      // },
      // emailChangeMessage: {
      //   type: String,
      //   default: "emailChangeMessage",
      // },
      userApprovedSubject: {
        type: String,
        default: "User Request Approved",
      },
      userApprovedMessage: {
        type: String,
        default: "You are receiving this email because your request to become a user has been approved. Please confirm below.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n{{host}}/reset/{{token}}\n\n",
      },
      inviteUserSubject: {
        type: String,
        default: "Welcome aboard",
      },
      inviteUserMessage: {
        type: String,
        default: "You are receiving this email because you have been invited to become a user by an admin. Please confirm below.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n{{host}}/reset/{{token}}\n\n",
      },
    },
    general: {
      serverName: {
        type: String,
        default: "Auth"
      },
      serverMainUrl: {
        type: String,
        default: "/dashboard"
      }
    }
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
