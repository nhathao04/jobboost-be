const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { JWT_SECRET, JWT_EXPIRATION } = require("../config/auth");

// Register a new user
const registerUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user;
};

// Login user and generate JWT
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error("Invalid credentials");
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
  return { user, token };
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Refresh JWT token
const refreshToken = (token) => {
  const decoded = verifyToken(token);
  const newToken = jwt.sign({ id: decoded.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
  return newToken;
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  refreshToken,
};
