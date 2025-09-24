// src/utils/helpers.js

const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US');
};

const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const ageDiff = Date.now() - new Date(dateOfBirth).getTime();
    return Math.floor(ageDiff / (1000 * 3600 * 24 * 365.25));
};

const isEmailValid = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

module.exports = {
    formatDate,
    generateRandomString,
    calculateAge,
    isEmailValid,
};