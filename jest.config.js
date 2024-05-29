module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/*.test.js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
};
