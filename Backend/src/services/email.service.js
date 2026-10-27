const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, Name) { 
    const subject = "Welcome to Backend Ledger!";
    const text = `Hello ${Name},\n\nThank you for registering with Backend Ledger! We're excited to have you on board.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${Name},</p><p>Thank you for registering with Backend Ledger! We're excited to have you on board.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, Name, amount, fromAccount, toAccount) {
    const subject = "Transaction Notification from Backend Ledger";
    const text = `Hello ${Name},\n\nA transaction of amount ${amount} has been made from account ${fromAccount} to account ${toAccount}.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${Name},</p><p>A transaction of amount <strong>${amount}</strong> has been made from account <strong>${fromAccount}</strong> to account <strong>${toAccount}</strong>.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, Name, amount, fromAccount, toAccount) {
    const subject = "Transaction Failure Notification from Backend Ledger";
    const text = `Hello ${Name},\n\nWe regret to inform you that a transaction of amount ${amount} from account ${fromAccount} to account ${toAccount} has failed.\n\nPlease check your account details and try again.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${Name},</p><p>We regret to inform you that a transaction of amount <strong>${amount}</strong> from account <strong>${fromAccount}</strong> to account <strong>${toAccount}</strong> has failed.</p><p>Please check your account details and try again.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {sendRegistrationEmail, sendTransactionEmail, sendTransactionFailureEmail };