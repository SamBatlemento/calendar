const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, text) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    text,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('SendGrid error:', err.response?.body || err.message);
    throw err;
  }
}

module.exports = sendEmail;