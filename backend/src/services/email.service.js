const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL || 'nirbhayshingala71@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'zumobwtvkkdgkeda'
  }
});

/**
 * Send driving license expiry reminder email.
 */
async function sendLicenseExpiryReminderEmail(driverName, email, licenseNo, expiryDate) {
  if (!email) {
    console.warn(`⚠️ Cannot send expiry reminder email: No email address defined for driver "${driverName}".`);
    return false;
  }

  const formattedExpiry = new Date(expiryDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const mailOptions = {
    from: `"TransitOps Fleet Management" <${process.env.EMAIL || 'nirbhayshingala71@gmail.com'}>`,
    to: email,
    subject: 'Reminder: Your Driving License Expires Soon',
    text: `Dear ${driverName},
This is a reminder that your driving license is due to expire in one month.
License Number: ${licenseNo}
Expiry Date: ${formattedExpiry}
Please renew your license before the expiry date to avoid any interruption in your trip assignments. Drivers with an expired license cannot be assigned to new trips until a valid, updated license is submitted.
Kindly share your renewed license details with the fleet office once available.

Thank you,
TransitOps Fleet Management Team`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email successfully sent to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send license expiry reminder email to ${email}:`, error);
    throw error;
  }
}

module.exports = {
  sendLicenseExpiryReminderEmail
};
