const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../../models/userDetails.model");

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const allowedRoles = ["doctor", "receptionist"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: doctor or receptionist.",
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

    console.log('\n🔐 Login attempt for:', email);

    const user = await userModel.findOne({ email });
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(403).json({
        message: "Auth failed, email or password is wrong",
        success: false,
      });
    }

    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // 🔍 Debug: Check password comparison
    console.log('🔍 Comparing passwords...');
    console.log('   Input password:', password);
    console.log('   Stored hash (first 20 chars):', user.password?.substring(0, 20));
    
    const isPassEqual = await bcrypt.compare(password, user.password);
    console.log('   Comparison result:', isPassEqual ? '✅ MATCH' : '❌ NO MATCH');
    
    if (!isPassEqual) {
      console.log('❌ Password comparison failed');
      return res.status(403).json({
        message: "Auth failed, email or password is wrong",
        success: false,
      });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 🔍 CRITICAL DEBUG: Log the exact response being sent
    const response = {
      message: "Login successfully",
      success: true,
      jwtToken,
      email: user.email,
      name: user.name,
      role: user.role,  // ⚠️ Make sure this is being sent
      _id: user._id,
    };

    console.log('\n✅ Login successful! Sending response:');
    console.log('📤 Response Object:', JSON.stringify(response, null, 2));
    console.log('🎭 Role being sent:', response.role);
    console.log('📧 Email being sent:', response.email);

    res.status(200).json(response);
  } catch (err) {
    console.error("❌ Login Error:", err);
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
