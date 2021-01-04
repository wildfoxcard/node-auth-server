const UserModel = require("../models/User");
const crypto = require("crypto");
const jwt = require('jsonwebtoken')

const generatedSecret = require("crypto").randomBytes(64).toString("hex");

module.exports.authenticateToken = (req, res, next) => {
  if (req && req.path.substr(0, 4) === "/api") {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // // if there isn't any token
    // if (token == null) return res.sendStatus(401);

    console.log('token', process.env.SESSION_SECRET, token)

    if (token) {
      jwt.verify(
        token,
        process.env.SESSION_SECRET || generatedSecret,
        (err, user) => {
          console.log(err);
          if (err) return res.sendStatus(403);

          req.user = UserModel.findById(user._id);
          next();
        }
      );
    } else {
        next();
    }
    
  } else {
    next();
  }
};

module.exports.sign = async (user) => {
  return jwt.sign(
    { _id: user._id },
    process.env.SESSION_SECRET || generatedSecret,
    { expiresIn: "1800s" }
  );
};
