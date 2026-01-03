
// const jwt = require("jsonwebtoken");
// const SuperAdmin = require("../models/SuperAdmin");
// const Admin = require("../models/Admin");

// const protect = async (req, res, next) => {
//   let token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "No token provided" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET,{ expiresIn: "1h" });
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// const superadminOnly = (req, res, next) => {
//   if (req.user.role !== "superadmin")
//     return res.status(403).json({ message: "Access denied" });
//   next();
// };

// const adminOnly = (req, res, next) => {
//   if (req.user.role !== "admin" && req.user.role !== "superadmin")
//     return res.status(403).json({ message: "Access denied" });
//   next();
// };

// const ownerOnly = (req, res, next) => {
//   if (req.user.role !== "owner") {
//     return res.status(403).json({ message: "Access denied" });
//   }
//   next();
// };

// module.exports = { protect, superadminOnly, adminOnly , ownerOnly };





































const jwt = require("jsonwebtoken");

/* --------------------------------
   AUTH: VERIFY TOKEN
-------------------------------- */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ Verify token (expiry already handled by JWT)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded must contain: { id, role }
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/* --------------------------------
   ROLE: SUPERADMIN ONLY
-------------------------------- */
const superadminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Superadmin access only",
    });
  }
  next();
};

/* --------------------------------
   ROLE: ADMIN ONLY
-------------------------------- */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }
  next();
};

/* --------------------------------
   ROLE: OWNER ONLY
-------------------------------- */
const ownerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Owner access only",
    });
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
  superadminOnly,
  ownerOnly,
};
