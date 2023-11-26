const db = require('../db/database');
const logger = require('./logger');
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkOptInStatus(phoneNumber, callback) {
    const sql = `SELECT opted_in FROM opt_ins WHERE phone_number = ?`;
    db.get(sql, [phoneNumber], (err, row) => {
        if (err) {
            logger.error(`Error checking opt-in status: ${err.message}`);
            callback(err, null);
            return;
        }
        callback(null, row && row.opted_in === 1);
    });
}

function splitMessage(message) {
    const maxChar = 160;
    let parts = [];

    while (message.length > 0) {
        let part = message.substring(0, maxChar);
        parts.push(part);
        message = message.substring(maxChar);
    }

    return parts;
}

async function sendSMS(to, message, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 2000; // Delay in milliseconds (e.g., 2000 ms = 2 seconds)

    checkOptInStatus(to, async (err, isOptedIn) => {
        if (err) {
            logger.error(`Error sending SMS to ${to}: ${err.message}`);
            return;
        }

        if (!isOptedIn) {
            logger.info(`Attempted to send SMS to ${to}, but the user has not opted in.`);
            return;
        }

        const messageParts = splitMessage(message);
        for (const part of messageParts) {
            try {
                await client.messages.create({
                    body: part,
                    to: to,
                    from: process.env.TWILIO_PHONE_NUMBER
                });
                logger.info(`SMS part sent to ${to}`);
            } catch (error) {
                logger.error(`Failed to send SMS to ${to}: ${error.message}`);
                if (retryCount < maxRetries) {
                    logger.info(`Retrying SMS to ${to}. Attempt ${retryCount + 1}`);
                    await sleep(retryDelay);
                    await sendSMS(to, part, retryCount + 1);
                } else {
                    logger.error(`Max retries reached for ${to}. Giving up.`);
                }
            }
        }
    });
}

module.exports = { sendSMS };
