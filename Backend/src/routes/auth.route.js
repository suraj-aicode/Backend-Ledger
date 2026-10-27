const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateRegister, validateLogin } = require("../middlewares/validator.middleware");
const router = express.Router();

router.post("/register", validateRegister, authController.userRegisterController);
router.post('/login', validateLogin, authController.userLoginController);
router.post('/logout', authController.userLogoutController);
router.get('/me', authMiddleware.authMiddleware, authController.userMeController);

module.exports = router;