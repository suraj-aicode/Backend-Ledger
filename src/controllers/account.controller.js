const jwt = require("jsonwebtoken");
const accountModel = require("../models/account.model");

async function createAccountController(req, res) { 
    const user = req.user;

    const account = await accountModel.create({
        user: user._id
    });

    return res.status(201).json({
        message: "Account created successfully",
        status: "Success",
        account
    })
}


module.exports = {
    createAccountController
}