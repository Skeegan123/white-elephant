const app = require('../src/server');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

jest.mock('twilio', () => () => ({
    messages: {
        create: jest.fn().mockResolvedValue({ sid: 'mocked_sid' }),
    },
}));

// Mock services used in server.js
jest.mock('../src/services/participantService');
jest.mock('../src/services/adminService');
jest.mock('../src/services/smsService');
jest.mock('../src/services/logger');

const participantService = require('../src/services/participantService');
const adminService = require('../src/services/adminService');
const smsService = require('../src/services/smsService');

// const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Include the routes from server.js
require('../src/server');

describe('Server Endpoints', () => {
    test('GET / should return running message', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('White Elephant Application is running!');
    });

    describe('POST /sms', () => {
        test('should handle START message', async () => {
            const response = await request(app)
                .post('/sms')
                .send({ Body: 'START', From: '+1234567890' });

            expect(response.statusCode).toBe(200);
            expect(participantService.optInParticipant).toHaveBeenCalledWith('+1234567890', expect.any(Function));
        });

        test('should handle STOP message', async () => {
            const response = await request(app)
                .post('/sms')
                .send({ Body: 'STOP', From: '+1234567890' });

            expect(response.statusCode).toBe(200);
            expect(participantService.optOutParticipant).toHaveBeenCalledWith('+1234567890', expect.any(Function));
        });

        test('should handle admin command', async () => {
            process.env.ADMIN_PHONE_NUMBER = '+1234567890';

            const response = await request(app)
                .post('/sms')
                .send({ Body: '!START_OUTREACH', From: '+1234567890' });

            expect(response.statusCode).toBe(200);
            expect(adminService.processAdminCommand).toHaveBeenCalledWith('!START_OUTREACH');

            delete process.env.ADMIN_PHONE_NUMBER;
        });

        test('should handle regular message', async () => {
            const response = await request(app)
                .post('/sms')
                .send({ Body: 'Hello', From: '+1234567890' });

            expect(response.statusCode).toBe(200);
            expect(participantService.recordResponse).toHaveBeenCalledWith('+1234567890', 'Hello');
        });
    });
});