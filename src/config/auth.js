const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const authConfig = {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    jwtExpiration: process.env.JWT_EXPIRATION || '1d',
};

const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, authConfig.jwtSecret, {
        expiresIn: authConfig.jwtExpiration,
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, authConfig.jwtSecret);
};

module.exports = {
    authConfig,
    generateToken,
    verifyToken,
};