const sqlite3 = require('sqlite3');
const path = require('path');
const logger = require('../../src/services/logger');

jest.mock('../../src/services/logger');

describe('Database', () => {
    let db;

    beforeAll(() => {
        const dbPath = path.resolve(__dirname, 'test.db');
        db = new sqlite3.Database(dbPath);
    });

    test('should create tables without error', done => {
        const sql = `
            CREATE TABLE IF NOT EXISTS test_table (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            );`;

        db.run(sql, (err) => {
            expect(err).toBeNull();
            done();
        });
    });

    afterAll(() => {
        db.close();
    });
});
