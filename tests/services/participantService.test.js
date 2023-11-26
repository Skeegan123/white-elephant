const participantService = require('../../src/services/participantService');
const db = require('../../src/db/database');
const smsService = require('../../src/services/smsService');

jest.mock('../../src/services/smsService', () => ({
    sendSMS: jest.fn().mockResolvedValue(true)
}));
jest.mock('../../src/services/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}));
// Assuming db.all is mocked to return a list of participants
jest.mock('../../src/db/database', () => ({
    run: jest.fn().mockImplementation((sql, params, callback) => {
        callback(null);
    }),
    all: jest.fn().mockImplementation((sql, params, callback) => {
        // Ensure that participant IDs match for partners
        callback(null, [
            { id: 1, name: 'John', partner_id: 2 },
            { id: 2, name: 'Jane', partner_id: 1 }
        ]);
    }),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Participant Service', () => {
    // Testing optInParticipant and optOutParticipant
    describe('Opt-in and Opt-out', () => {
        test('optInParticipant should add a phone number with opted in status', async () => {
            await participantService.optInParticipant('+1234567890', () => { });
            expect(db.run).toHaveBeenCalled();
        });

        test('optOutParticipant should update a phone number with opted out status', async () => {
            await participantService.optOutParticipant('+1234567890', () => { });
            expect(db.run).toHaveBeenCalled();
        });
    });

    // Testing addParticipant and removeParticipant
    describe('Adding and Removing Participants', () => {
        test('addParticipant should insert a participant', async () => {
            await participantService.addParticipant({ name: 'John', phoneNumber: '+1234567890', familyFlag: 0 });
            expect(db.run).toHaveBeenCalled();
        });

        test('removeParticipant should delete a participant', async () => {
            await participantService.removeParticipant('+1234567890');
            expect(db.run).toHaveBeenCalled();
        });
    });

    // Testing randomizeParticipants
    describe('Randomize Participants', () => {
        test('should randomize and assign partners', async () => {
            await participantService.randomizeParticipants((err, partners) => {
                expect(err).toBeNull();
                expect(partners).toHaveLength(2); // Assuming 2 participants
                // Check if partners are assigned correctly
                partners.forEach(partner => {
                    expect(partner.partnerName).toBeDefined();
                    expect(partner.partnerName).not.toBe(partner.name);
                });
            });
        });
    });

    // Testing sendReminderTexts and notifyParticipants
    describe('Send Reminders and Notifications', () => {
        test('sendReminderTexts should query non-responded participants and send SMS', async () => {
            await participantService.sendReminderTexts();
            expect(db.all).toHaveBeenCalled();
            // Expect smsService.sendSMS to be called based on the number of participants
            expect(smsService.sendSMS).toHaveBeenCalled();
        });

        test('notifyParticipants should query participants and send notifications', async () => {
            await participantService.notifyParticipants();
            expect(db.all).toHaveBeenCalled();
            // Expect smsService.sendSMS to be called based on the number of participants
            expect(smsService.sendSMS).toHaveBeenCalled();
        });
    });
});
