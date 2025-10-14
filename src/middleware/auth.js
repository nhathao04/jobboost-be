const jwt = require("jsonwebtoken");
const { authConfig } = require("../config/auth");

const authMiddleware = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }
  
  console.log(token);

  token = token.replace('Bearer ', '');

  jwt.verify(token, authConfig.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" });
    }
    req.userId = decoded.sub;
    next();
  });
};


module.exports = {
  authenticate: authMiddleware,
  authMiddleware,
};
