const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../../models/userDetails.model");

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const allowedRoles = ["doctor", "receptionist", "admin"]; // ✅ Added 'admin'
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: doctor, receptionist, or admin.",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists, you can login.",
      });
    }

    // ✅ Create new user with role
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Signup successful.",
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(403).json({
        message: "Auth failed, email or password is wrong",
        success: false,
      });
    }

    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) {
      return res.status(403).json({
        message: "Auth failed, email or password is wrong",
        success: false,
      });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id, role: user.role }, // ✅ Added role to JWT
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successfully",
      success: true,
      jwtToken,
      email: user.email,
      name: user.name,
      role: user.role,
      _id: user._id,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

module.exports = {
  signup,
  login,
};
