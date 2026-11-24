const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
});



async function sendEmail(to, subject, text, cc) {
  await transporter.sendMail({ from: process.env.EMAIL_USER, to: to, cc: cc, replyTo: cc, subject: subject, text: text });
}
module.exports = sendEmail;