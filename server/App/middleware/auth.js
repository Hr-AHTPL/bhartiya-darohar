// middleware/auth.js
// Enhanced version with role-based access control
const jwt = require('jsonwebtoken');

// Your existing authentication middleware (keep as is)
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

// ✅ NEW: Add role checking middleware
const ensureAdmin = async (req, res, next) => {
    try {
        const userModel = require('../models/userDetails.model');
        
        // Get user from database to check role
        const user = await userModel.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
        // Attach role to request
        req.userRole = user.role;
        next();
    } catch (err) {
        console.error('Error in ensureAdmin middleware:', err);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

// ✅ NEW: Middleware to attach user role (without blocking)
const attachUserRole = async (req, res, next) => {
    try {
        const userModel = require('../models/userDetails.model');
        
        const user = await userModel.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        req.userRole = user.role;
        next();
    } catch (err) {
        console.error('Error in attachUserRole middleware:', err);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

// Export all middlewares
module.exports = {
    ensureAuthenticated,
    ensureAdmin,      // ✅ NEW
    attachUserRole    // ✅ NEW
};

// For backward compatibility (if you're using the old export style)
// module.exports = ensureAuthenticated;
