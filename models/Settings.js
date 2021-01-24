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
      type: ["ANYONE", "PASSWORD", "REQUEST", "MANUAL"],
      password: {
        type: String,
      },
    },
    emailTemplates: {
      emailVerification: {
        subject: {
          type: String,
        },
        message: {
          type: String,
        },
      },
      passwordReset: {
        subject: {
          type: String,
        },
        message: {
          type: String,
        },
      },
      emailChange: {
        subject: {
          type: String,
        },
        message: {
          type: String,
        },
      },
    },
    general: {
      companyName: {
        type: String
      }
    }
    //
    // newUsersCreatedBy: {
    //   required: true,
    //   type: String,
    //   enum: ["INVITE", "PASSCODE", "NORMALSIGNUP"],
    //   default: "INVITE",
    // },
    // newUsersPasscode: { type: String },
    // cors: [
    //   {
    //     url: { type: String, unique: true },
    //   },
    // ],
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
