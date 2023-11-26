const sqlite3 = require('sqlite3').verbose();
const logger = require('../services/logger');
const path = require('path');
const dbPath = path.resolve(__dirname, 'sqlite.db');
const Participant = require('./models/Participants');

let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error(err.message);
        throw err;
    } else {
        logger.info('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    // SQL query to create the Participants table
    const createParticipantsTable = `
    CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL UNIQUE,
        family_flag INTEGER DEFAULT 0,
        partner_id INTEGER,
        FOREIGN KEY (partner_id) REFERENCES participants(id)
    )`;

    // SQL query to create the Responses table
    const createResponsesTable = `
    CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant_id INTEGER,
        response_text TEXT,
        FOREIGN KEY (participant_id) REFERENCES participants(id)
    )`;

    const createOptInsTable = `
        CREATE TABLE IF NOT EXISTS opt_ins (
            phone_number TEXT PRIMARY KEY,
            opted_in INTEGER DEFAULT 0
        )`;

    db.run(createOptInsTable);
    db.run(createParticipantsTable);
    db.run(createResponsesTable);

    logger.info('Initialized the database tables.');
}

module.exports = db;
