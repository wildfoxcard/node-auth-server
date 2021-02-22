const mongoose = require("mongoose");

const errorSchema = new mongoose.Schema(
  {
    application: {
      type: String,
      require: true
    },
    message: {
      type: String,
      require: true
    },
    stack: {
      type: String,
      require: true
    }
  },
  { timestamps: true }
);

const Error = mongoose.model("Error", errorSchema);

module.exports = Error;
