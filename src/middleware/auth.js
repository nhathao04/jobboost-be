const jwt = require("jsonwebtoken");
const { authConfig } = require("../config/auth");
const { User } = require("../models");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  jwt.verify(token, authConfig.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

const authenticateAdmin = async (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || user.user_type !== "admin") {
      return res.status(403).json({ message: "Admin access required!" });
    }

    req.userId = decoded.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized!" });
  }
};

module.exports = {
  authenticate: authMiddleware,
  authMiddleware,
  authenticateAdmin,
};
