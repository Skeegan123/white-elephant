jest.mock('fs', () => require('../__mocks__/fsMock'));
const readline = require('readline');
jest.mock('readline', () => require('../__mocks__/readlineMock'));

const csvParser = require('../../src/utils/csvParser');

describe('CSV Parser', () => {
    beforeEach(() => {
        readline.__setMockLines([
            'Name,PhoneNumber,FamilyFlag',
            'John Doe,+1234567890,1',
            'Jane Doe,+0987654321,0'
        ]);
    });

    test('parseCSV should parse a CSV file into participant objects', async () => {
        const participants = await csvParser.parseCSV('participants.csv');
        expect(participants).toHaveLength(2);
        expect(participants[0]).toEqual({ name: 'John Doe', phoneNumber: '+1234567890', familyFlag: true });
        expect(participants[1]).toEqual({ name: 'Jane Doe', phoneNumber: '+0987654321', familyFlag: false });
    });
});
