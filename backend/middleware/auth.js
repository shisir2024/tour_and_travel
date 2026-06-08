const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "mytripagency_secret_2024";

// Verify JWT token from Authorization header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Role-based authorization middleware factory
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(" or ")}` });
  }
  next();
};

module.exports = { verifyToken, authorizeRoles };
