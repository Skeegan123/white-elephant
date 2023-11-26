const fs = require('fs');
const readline = require('readline');

async function parseCSV(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const participants = new Map(); // Using a Map to avoid duplicates
    let isFirstLine = true; // Flag to skip the header line

    for await (const line of rl) {
        if (isFirstLine) {
            isFirstLine = false;
            continue;
        }

        const [name, phoneNumber, familyFlag] = line.split(',').map(entry => entry.trim());
        participants.set(phoneNumber, { name, phoneNumber, familyFlag: familyFlag === '1' });
    }
    return Array.from(participants.values());
}

module.exports = { parseCSV };