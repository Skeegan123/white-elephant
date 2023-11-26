const db = require('../db/database');
const smsService = require('./smsService');
const logger = require('./logger');

function cronJob() {
    const today = moment().format('MM/DD/YYYY');

    if (today === dueDate) {
        // Send reminder text
        logger.info('Sending reminder texts...');
        participantService.sendReminderTexts();
    } else if (today === dayAfterDueDate) {
        // Perform randomization and notify users
        logger.info('Running randomization and notifying users...');
        participantService.randomizeParticipants(() => {
            // Logic to notify users after randomization
            participantService.notifyParticipants();
            logger.info('Randomization and notification complete.');
        });
    } else {
        logger.info('No scheduled task for today.');
    }
}

function optInParticipant(phoneNumber, callback) {
    const sql = `INSERT INTO opt_ins (phone_number, opted_in) VALUES (?, 1) ON CONFLICT(phone_number) DO UPDATE SET opted_in = 1`;
    db.run(sql, [phoneNumber], (err) => {
        if (err) {
            console.error(`Error updating opt-in status: ${err.message}`);
        }
        callback();
    });
}

function optOutParticipant(phoneNumber, callback) {
    const sql = `INSERT INTO opt_ins (phone_number, opted_in) VALUES (?, 0) ON CONFLICT(phone_number) DO UPDATE SET opted_in = 0`;
    db.run(sql, [phoneNumber], (err) => {
        if (err) {
            console.error(`Error updating opt-out status: ${err.message}`);
        }
        callback();
    });
}

function addParticipant(participant) {
    const { name, phoneNumber, familyFlag } = participant;
    const sql = `INSERT INTO participants (name, phone_number, family_flag) VALUES (?, ?, ?)`;
    db.run(sql, [name, phoneNumber, familyFlag ? 1 : 0], function (err) {
        if (err) {
            logger.error(`Error adding participant: ${err.message}`);
        } else {
            logger.info(`Participant added with ID: ${this.lastID}`);
        }
    });
}

function removeParticipant(phoneNumber) {
    const sql = `DELETE FROM participants WHERE phone_number = ?`;
    db.run(sql, [phoneNumber], function (err) {
        if (err) {
            logger.error(`Error removing participant: ${err.message}`);
        } else {
            logger.info(`Participant removed with phone number: ${phoneNumber}`);
        }
    });
}

function removeAllParticipants() {
    const sql = `DELETE FROM participants`;
    db.run(sql, [], function (err) {
        if (err) {
            logger.error(`Error removing all participants: ${err.message}`);
        } else {
            logger.info(`Removed all participants`);
        }
    });
}

function recordResponse(phoneNumber, responseText) {
    const findParticipantSql = `SELECT id FROM participants WHERE phone_number = ?`;
    db.get(findParticipantSql, [phoneNumber], function (findErr, row) {
        if (findErr) {
            logger.error(`Error finding participant: ${findErr.message}`);
            return;
        }
        if (row) {
            const insertResponseSql = `INSERT INTO responses (participant_id, response_text) VALUES (?, ?)`;
            db.run(insertResponseSql, [row.id, responseText], function (insertErr) {
                if (insertErr) {
                    logger.error(`Error recording response: ${insertErr.message}`);
                } else {
                    logger.info(`Response recorded for participant ID: ${row.id}`);
                }
            });
        } else {
            logger.info(`Participant not found with phone number: ${phoneNumber}`);
        }
    });
}

function getAllParticipants(callback) {
    const sql = `SELECT * FROM participants`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
}

function randomizeParticipants(callback) {
    getAllParticipants((err, participants) => {
        if (err) {
            console.error(err.message);
            callback(err);
            return;
        }

        let validAssignment = false;
        while (!validAssignment) {
            // Shuffle the array
            for (let i = participants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [participants[i], participants[j]] = [participants[j], participants[i]];
            }

            // Check if anyone is assigned to themselves
            validAssignment = !participants.some((participant, index) => participant.id === participants[(index + 1) % participants.length].id);
        }

        // Assign partners
        participants.forEach((participant, index) => {
            const partner = participants[(index + 1) % participants.length];
            const updateSql = `UPDATE participants SET partner_id = ? WHERE id = ?`;
            db.run(updateSql, [partner.id, participant.id], (updateErr) => {
                if (updateErr) {
                    logger.error(`Error updating partner for participant ID: ${participant.id}`);
                }
            });
        });

        // Return the randomized participants
        const partners = participants.map(participant => {
            return {
                name: participant.name,
                phoneNumber: participant.phone_number,
                partnerName: participants.find(p => p.id === participant.partner_id).name
            };
        });

        callback(null, partners);
    });
}

function sendReminderTexts() {
    const sql = `
        SELECT p.phone_number
        FROM participants p
        LEFT JOIN responses r ON p.id = r.participant_id
        WHERE p.opted_in = 1 AND r.id IS NULL`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            logger.error(`Error querying non-responded participants: ${err.message}`);
            return;
        }

        rows.forEach(row => {
            smsService.sendSMS(row.phone_number, "Reminder: Please complete your questionnaire for white elephant by tonight!");
        });
    });
}

function notifyParticipants() {
    const sql = `
        SELECT p1.phone_number AS participantPhone, p2.name AS partnerName, r.response_text AS partnerResponse
        FROM participants p1
        JOIN participants p2 ON p1.partner_id = p2.id
        LEFT JOIN responses r ON p2.id = r.participant_id
        WHERE p1.opted_in = 1`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            logger.error(`Error querying for participant notifications: ${err.message}`);
            return;
        }

        rows.forEach(row => {
            // TODO: Break up long messages into multiple messages
            const message = `Your partner for the family event is ${row.partnerName}. Their response: ${row.partnerResponse || 'No response provided.'}`;
            smsService.sendSMS(row.participantPhone, message);
        });
    });
}


module.exports = {
    cronJob,
    optInParticipant,
    optOutParticipant,
    addParticipant,
    removeParticipant,
    removeAllParticipants,
    recordResponse,
    randomizeParticipants,
    sendReminderTexts,
    notifyParticipants,
};
