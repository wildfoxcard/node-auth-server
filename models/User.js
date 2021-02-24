const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    password: { type: String, select: false },
    applicationToken: { type: String, select: false },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: Boolean,
    isBlocked: Boolean,

    snapchat: String,
    facebook: String,
    twitter: String,
    google: String,
    github: String,
    instagram: String,
    linkedin: String,
    steam: String,
    twitch: String,
    quickbooks: String,
    tokens: Array,
    type: {
      type: String,
      enum: ["NORMAL", "TEST", "APPLICATION"],
      default: "NORMAL",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profile: {
      name: String,
      gender: String,
      location: String,
      website: String,
      picture: String,
    },

    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "Permission",
      },
    ],

    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "Role",
      },
    ],
  },
  { timestamps: true }
);

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
  const user = this;
  if (user.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else if (user.isModified("applicationToken")) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.applicationToken, salt, (err, hash) => {
        if (err) {
          return next(err);
        }
        user.applicationToken = hash;
        next();
      });
    });
  } else {
    next()
  }
  // return next();
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
  cb
) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for validating application's token.
 */
userSchema.methods.compareApplicationToken = function comparePassword(
  candidateApplicationToken,
  cb
) {
  bcrypt.compare(
    candidateApplicationToken,
    this.applicationToken,
    (err, isMatch) => {
      cb(err, isMatch);
    }
  );
};
/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
