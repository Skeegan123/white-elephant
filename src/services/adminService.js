const participantService = require('./participantService');
const smsService = require('./smsService');
const csvParser = require('../utils/csvParser');
const logger = require('./logger');

async function processAdminCommand(command) {
    command = command.substring(1);
    const [action, ...params] = command.split(' ');

    switch (action) {
        case 'START_OUTREACH':
            participantService.removeAllParticipants();
            const participants = await csvParser.parseCSV('participants.csv');
            participants.forEach(participant => {
                participantService.addParticipant(participant);
                // smsService.sendSMS(participant.phoneNumber, 'Your questionnaire message here');
            });
            break;

        case 'ADD_PARTICIPANT':
            // Assuming params are like: "Name,PhoneNumber,FamilyFlag"
            const [name, phoneNumber, familyFlag] = params.join(' ').split(',');
            participantService.addParticipant({ name, phoneNumber, familyFlag });
            break;

        case 'REMOVE_PARTICIPANT':
            // Assuming param is the phone number
            const phoneNumberToRemove = params[0];
            participantService.removeParticipant(phoneNumberToRemove);
            break;
        case 'RANDOMIZE_PARTICIPANTS':
            participantService.randomizeParticipants((err, randomizedParticipants) => {
                if (err) {
                    logger.error(`Error randomizing participants: ${err.message}`);
                } else {
                    randomizedParticipants.forEach(participant => {
                        // smsService.sendSMS(participant.phoneNumber, `You are buying a gift for ${participant.partnerName}`);
                        logger.info(`${participant.name} is buying a gift for ${participant.partnerName}`);
                    });
                }
            });
            break;
        default:
            logger.info(`Unknown command: ${command}`);
    }
}

module.exports = { processAdminCommand };
