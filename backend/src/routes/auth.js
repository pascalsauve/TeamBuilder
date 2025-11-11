import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import { sendVerificationEmail, sendLoginEmail } from '../services/emailService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    // Create verification token
    const verificationToken = uuidv4();
    const verificationTokenExpiry = new Date(
      Date.now() + (process.env.MAGIC_LINK_EXPIRY || 15) * 60 * 1000
    );

    // Create user
    const user = new User({
      username,
      email,
      password,
      verificationToken,
      verificationTokenExpiry
    });

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, username);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue anyway - user is created
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully!',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// Login with password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        error: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Request magic link login
router.post('/request-magic-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        message: 'If an account exists with this email, a login link has been sent.'
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        error: 'Please verify your email first',
        needsVerification: true
      });
    }

    // Generate magic link token
    const magicToken = uuidv4();
    const magicTokenExpiry = new Date(
      Date.now() + (process.env.MAGIC_LINK_EXPIRY || 15) * 60 * 1000
    );

    user.resetPasswordToken = magicToken;
    user.resetPasswordExpiry = magicTokenExpiry;
    await user.save();

    // Send magic link email
    try {
      await sendLoginEmail(email, magicToken, user.username);
    } catch (emailError) {
      console.error('Failed to send magic link email:', emailError);
      return res.status(500).json({ error: 'Failed to send login email' });
    }

    res.json({
      message: 'If an account exists with this email, a login link has been sent.'
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify magic link
router.post('/verify-magic-link', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired login link' });
    }

    // Clear the magic link token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isVerified: req.user.isVerified
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
