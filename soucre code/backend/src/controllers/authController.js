const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Administrator & Staff Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email address and password.'
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Contact the system administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await AuditLog.create({
      action: 'USER_LOGIN',
      entity: 'User',
      entity_id: user._id.toString(),
      user_id: user._id.toString(),
      user_name: user.name,
      ip_address: req.ip,
      details: { email: user.email, role: user.role }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Current Authenticated User Profile
 */
async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    res.json({
      success: true,
      user: {
        id: req.user._id ? req.user._id.toString() : req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Logout
 */
async function logout(req, res) {
  try {
    if (req.user) {
      await AuditLog.create({
        action: 'USER_LOGOUT',
        entity: 'User',
        entity_id: req.user.id || req.user._id?.toString(),
        user_name: req.user.name,
        ip_address: req.ip
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Register New Administrator or Staff Account
 */
async function register(req, res) {
  try {
    const { name, email, password, role = 'admin', department = 'Administration' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in or use another email.'
      });
    }

    const allowedRoles = ['admin', 'hr_manager', 'compliance_officer', 'viewer'];
    const assignedRole = allowedRoles.includes(role) ? role : 'admin';

    // Create user in MongoDB Atlas (pre-save hook hashes password)
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: assignedRole,
      department: department ? department.trim() : 'Administration',
      active: true,
      lastLogin: new Date()
    });

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await AuditLog.create({
      action: 'USER_REGISTER',
      entity: 'User',
      entity_id: newUser._id.toString(),
      user_id: newUser._id.toString(),
      user_name: newUser.name,
      ip_address: req.ip,
      details: { email: newUser.email, role: newUser.role }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You are now logged in.',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  login,
  register,
  getCurrentUser,
  logout
};

