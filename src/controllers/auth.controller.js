const userModel = require("../models/user.model");
const tokenBlacklistModel = require("../models/blacklist.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
/**
 * - user register controller
 * - POST /api/auth/register
 */

async function userRegisterController(req, res) {
  const { name, email, password } = req.body;

  const isExists = await userModel.findOne({
    email: email,
  });

  if (isExists) {
    return res.status(422).json({
      message: "User Already Exists",
      status: "Failed",
    });
  }

  const user = await userModel.create({
    name,
    email,
    password,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  res.cookie("token", token);

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token: token,
    message: "User Created Successfully",
    status: "Success",
  });

  await emailService.sendRegistrationEmail(user.email, user.name);
}

/**
 * - user login controller
 * - POST /api/auth/login
 */

async function userLoginController(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(404).json({
      message: "Email or Password is Incorrect",
      status: "Failed",
    });
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(404).json({
      message: "Email or Password is Invalid",
      status: "Failed",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  res.cookie("token", token);

  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token: token,
    message: "User Created Successfully",
    status: "Success",
  });
}

async function userLogoutController(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(200).json({
      message: "User Logged Out Successfully",
    });
  }

  await tokenBlacklistModel.create({ token });

  res.clearCookie("token");

  res.status(200).json({
    message: "User Logged Out Successfully",
  });
}
module.exports = { userRegisterController, userLoginController, userLogoutController };
