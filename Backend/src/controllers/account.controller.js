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

async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });

    return res.status(200).json({
        message: "User accounts fetched successfully",
        status: "Success",
        accounts
    })
}

async function getAccountBalanceController(req, res) { 
    const accountId = req.params.accountId;
    const account = await accountModel.findOne({ _id: accountId, user: req.user._id });

    if (!account) {
        return res.status(404).json({
            message: "Account not found",
            status: "Error"
        })
    }

    const balance = await account.getBalance();

    return res.status(200).json({
        message: "Account balance fetched successfully",
        status: "Success",
        balance
    })
}

module.exports = {
    createAccountController, getUserAccountsController, getAccountBalanceController
}