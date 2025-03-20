const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");
  
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;  // Attach user data to request
    next();  // Pass control to the next middleware or route handler
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};
