// src/config/index.js

const databaseConfig = require('./database');
const authConfig = require('./auth');

module.exports = {
    database: databaseConfig,
    auth: authConfig,
};