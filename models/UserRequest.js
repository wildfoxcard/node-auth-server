const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name : {type: String, required: true},
  status: { type: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },  
  isDeleted: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userRequestSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userRequestSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

const UserRequest = mongoose.model('UserRequest', userRequestSchema);

module.exports = UserRequest;
