jest.mock('../../src/services/participantService', () => ({
    removeAllParticipants: jest.fn(),
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    randomizeParticipants: jest.fn().mockImplementation(callback => {
        callback(null, []);
    })
}));

jest.mock('../../src/services/smsService', () => ({
    sendSMS: jest.fn()
}));

jest.mock('../../src/utils/csvParser', () => ({
    parseCSV: jest.fn().mockResolvedValue([])
}));

jest.mock('../../src/services/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}));

const adminService = require('../../src/services/adminService');
const participantService = require('../../src/services/participantService');
const smsService = require('../../src/services/smsService');
const csvParser = require('../../src/utils/csvParser');
const logger = require('../../src/services/logger');

describe('processAdminCommand', () => {
    test('START_OUTREACH command should remove all participants and add new ones from CSV', async () => {
        await adminService.processAdminCommand('!START_OUTREACH');
        expect(participantService.removeAllParticipants).toHaveBeenCalled();
        expect(csvParser.parseCSV).toHaveBeenCalledWith('participants.csv');
        expect(participantService.addParticipant).toHaveBeenCalledTimes(0);
        expect(smsService.sendSMS).toHaveBeenCalledTimes(0);
    });

    test('ADD_PARTICIPANT command should add a new participant', async () => {
        await adminService.processAdminCommand('!ADD_PARTICIPANT John,+1234567890,0');
        expect(participantService.addParticipant).toHaveBeenCalledWith({
            name: 'John',
            phoneNumber: '+1234567890',
            familyFlag: '0'
        });
    });

    test('REMOVE_PARTICIPANT command should remove a participant', async () => {
        await adminService.processAdminCommand('!REMOVE_PARTICIPANT +1234567890');
        expect(participantService.removeParticipant).toHaveBeenCalledWith('+1234567890');
    });

    test('RANDOMIZE_PARTICIPANTS command should randomize participants', async () => {
        await adminService.processAdminCommand('!RANDOMIZE_PARTICIPANTS');
        expect(participantService.randomizeParticipants).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledTimes(0);
    });

    test('Unknown command should log an error', async () => {
        await adminService.processAdminCommand('!UNKNOWN_COMMAND');
        expect(logger.info).toHaveBeenCalledWith('Unknown command: UNKNOWN_COMMAND');
    });
});

