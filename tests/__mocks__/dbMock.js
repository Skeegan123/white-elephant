const sqlite3 = {
    run: jest.fn().mockImplementation((sql, params, callback) => {
        callback(null);
    }),
    all: jest.fn().mockImplementation((sql, params, callback) => {
        callback(null, []); // Adjust this based on the expected return value
    }),
    get: jest.fn().mockImplementation((sql, params, callback) => {
        callback(null, {}); // Adjust this based on the expected return value
    })
};

module.exports = sqlite3;
