const request = require('supertest');
const app = require('../src/app'); // Adjust the path if necessary
const db = require('../src/config/database'); // Adjust the path if necessary

beforeAll(async () => {
    await db.connect(); // Connect to the database
});

afterAll(async () => {
    await db.close(); // Close the database connection
});

beforeEach(async () => {
    // Clear the database or reset the state before each test
});

afterEach(async () => {
    // Clean up after each test if necessary
});

module.exports = {
    request,
    app,
};