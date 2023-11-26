// fsMock.js
const fs = jest.createMockFromModule('fs');
fs.createReadStream = jest.fn().mockReturnValue({
    on: jest.fn((event, handler) => {
        if (event === 'open') handler();
    }),
    pipe: jest.fn(),
    close: jest.fn()
});
module.exports = fs;
