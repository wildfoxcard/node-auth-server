const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    newUsersCreatedBy: {
      required: true,
      type: String,
      enum: ["INVITE", "PASSCODE", "NORMALSIGNUP"],
      default: "INVITE",
    },
    newUsersPasscode: { type: String },
    cors: [
      {
        url: { type: String, unique: true },
      },
    ],
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
