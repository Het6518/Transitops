const cron = require('node-cron');
const prisma = require('./prisma/client');
const emailService = require('./services/email.service');

/**
 * Scan database for drivers whose license expires in exactly 30 days and email them a reminder.
 */
async function checkAndSendLicenseExpiryReminders() {
  console.log('⏰ Running driving license expiry check...');
  
  const targetDateStart = new Date();
  targetDateStart.setDate(targetDateStart.getDate() + 30);
  targetDateStart.setHours(0, 0, 0, 0);

  const targetDateEnd = new Date(targetDateStart);
  targetDateEnd.setHours(23, 59, 59, 999);

  try {
    const expiringDrivers = await prisma.driver.findMany({
      where: {
        licenseExpiry: {
          gte: targetDateStart,
          lte: targetDateEnd
        },
        email: { not: null }
      }
    });

    console.log(`🔍 Found ${expiringDrivers.length} driver(s) whose license expires in 30 days.`);

    let sentCount = 0;
    for (const driver of expiringDrivers) {
      if (driver.email) {
        const sent = await emailService.sendLicenseExpiryReminderEmail(
          driver.name,
          driver.email,
          driver.licenseNo,
          driver.licenseExpiry
        );
        if (sent) sentCount++;
      }
    }

    console.log(`✅ Driving license expiry check complete. Sent ${sentCount} reminders.`);
    return expiringDrivers;
  } catch (error) {
    console.error('❌ Error while running driving license expiry check:', error);
    throw error;
  }
}

function initCronJobs() {
  // Run every day at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      await checkAndSendLicenseExpiryReminders();
    } catch (err) {
      console.error('Cron job error:', err);
    }
  });
  console.log('⏰ Cron scheduler initialized.');
}

module.exports = {
  initCronJobs,
  checkAndSendLicenseExpiryReminders
};
