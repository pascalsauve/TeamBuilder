import express from 'express';
import User from '../models/User.js';
import TeamProject from '../models/Team.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 });

    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user details (admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's projects
    const projects = await TeamProject.find({ userId: user._id })
      .select('projectName isOptimized createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json({
      user,
      projects,
      projectCount: projects.length
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete user's projects
    await TeamProject.deleteMany({ userId: user._id });

    res.json({
      message: 'User and associated projects deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all projects (admin only)
router.get('/projects', async (req, res) => {
  try {
    const projects = await TeamProject.find()
      .populate('userId', 'username email')
      .sort({ updatedAt: -1 });

    res.json({ projects, count: projects.length });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const totalProjects = await TeamProject.countDocuments();
    const optimizedProjects = await TeamProject.countDocuments({ isOptimized: true });

    // Calculate users active this month (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: thirtyDaysAgo }
    });

    // Calculate projects created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const projectsThisMonth = await TeamProject.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    res.json({
      totalUsers,
      activeUsers,
      totalProjects,
      optimizedProjects,
      adminUsers,
      projectsThisMonth
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
