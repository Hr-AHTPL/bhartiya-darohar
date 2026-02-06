const jwt = require('jsonwebtoken');

// ✅ Standard authentication middleware
const ensureAuthenticated = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(403).json({ message: "Unauthorized, JWT token is required" });
    }
    try {
        const decoded = jwt.verify(auth, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Unauthorized, JWT token wrong or expired" });
    }
};

// ✅ NEW: Admin-only access middleware
const ensureAdmin = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(403).json({ message: "Unauthorized, JWT token is required" });
    }
    try {
        const decoded = jwt.verify(auth, process.env.JWT_SECRET);
        req.user = decoded;
        
        // Check if user role is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                message: "Access denied. Admin privileges required.",
                requiredRole: "admin",
                userRole: decoded.role
            });
        }
        
        next();
    } catch (err) {
        return res.status(403).json({ message: "Unauthorized, JWT token wrong or expired" });
    }
};

// ✅ Export both ways for backward compatibility
module.exports = ensureAuthenticated; // Default export (old style)
module.exports.ensureAuthenticated = ensureAuthenticated; // Named export
module.exports.ensureAdmin = ensureAdmin; // Named export
