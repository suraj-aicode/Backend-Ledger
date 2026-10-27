const dotenv = require("dotenv").config()
const express = require("express")
const connectDB = require("./config/db")
const CookieParser = require("cookie-parser")
const cors = require("cors")
const app = express();

app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(CookieParser());
connectDB();
app.use(express.json());


/**
 * - Routes required
*/
const authRoute = require("./routes/auth.route");
const accountRoute = require("./routes/account.route")
const transactionRoute = require("./routes/transcation.route")


/**
 * - User Routes 
*/
app.get("/", (req, res) => {
    res.send("Ledger service is running")
})
app.use("/api/auth", authRoute)
app.use("/api/account", accountRoute)
app.use("/api/transaction", transactionRoute)

module.exports = app;