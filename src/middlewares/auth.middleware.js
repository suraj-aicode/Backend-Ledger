const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

async function authMiddleware(req, res, next) { 
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            status: "Failed"
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token });
    if (isTokenBlacklisted) {
      return res.status(401).json({
        message: "Unauthorized access, token is blacklisted",
        status: "Failed",
      });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);
        req.user = user;
        return next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
            status: "Failed"
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing",
            status: "Failed"
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token });
    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is blacklisted",
            status: "Failed"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId).select("+systemUser");
        if (!user || !user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, user is not a system user",
                status: "Failed"
            })
        }
        req.user = user;
        return next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
            status: "Failed"
        })
    }
}

module.exports = {authMiddleware, authSystemUserMiddleware};