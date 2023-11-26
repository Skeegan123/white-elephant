let mockLines = [];
const readline = {
    createInterface: jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: jest.fn().mockImplementation(() => {
            return {
                next: jest.fn().mockImplementation(() => {
                    if (!mockLines.length) {
                        return Promise.resolve({ done: true });
                    }
                    return Promise.resolve({ value: mockLines.shift(), done: false });
                })
            };
        }),
        close: jest.fn()
    }),
    __setMockLines: newLines => {
        mockLines = [...newLines];
    }
};
module.exports = readline;