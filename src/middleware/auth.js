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
    // Token có thể có field 'sub' (Supabase) hoặc 'id' (local JWT)
    req.userId = decoded.sub || decoded.id;
    console.log('User ID from token:', req.userId);
    next();
  });
};


module.exports = {
  authenticate: authMiddleware,
  authMiddleware,
};
