const express = require('express');
require('dotenv').config();
const cron = require('node-cron');
const logger = require('./services/logger');
const moment = require('moment');
const bodyParser = require('body-parser');
const adminService = require('./services/adminService');
const participantService = require('./services/participantService');
const app = express();
const port = 3000;

// Body parser middleware to handle request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dueDate = moment(process.env.DUE_DATE, 'MM/DD/YYYY')
const dayAfterDueDate = moment(dueDate).add(1, 'days').format('MM/DD/YYYY');

if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 17 * * *', () => {
        participantService.cronJob();
    });
}

// Test route
app.get('/', (req, res) => {
    res.status(200).send('White Elephant Application is running!');
});

app.post('/sms', (req, res) => {
    const incomingMsg = req.body.Body;
    const sender = req.body.From;

    if (incomingMsg === 'START') {
        participantService.optInParticipant(sender, () => {
            smsService.sendSMS(sender, "Thank you for opting in to the Family Event SMS Service!");
        });
    } else if (incomingMsg === 'STOP') {
        participantService.optOutParticipant(sender, () => {
            smsService.sendSMS(sender, "You have opted out of the Family Event SMS Service.");
        });
    } else if (sender === process.env.ADMIN_PHONE_NUMBER && incomingMsg.startsWith('!')) {
        adminService.processAdminCommand(incomingMsg);
    } else {
        participantService.recordResponse(sender, incomingMsg);
    }

    res.status(200).send('SMS Received');
});

if (require.main === module) {
    app.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`);
    });
}


module.exports = app;