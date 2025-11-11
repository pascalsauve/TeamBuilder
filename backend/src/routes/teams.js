import express from 'express';
import TeamProject from '../models/Team.js';
import { authenticate } from '../middleware/auth.js';
import { optimizeTeams, validateConstraints } from '../services/teamOptimizer.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all team projects for current user
router.get('/', async (req, res) => {
  try {
    const projects = await TeamProject.find({ userId: req.userId })
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single team project
router.get('/:id', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new team project
router.post('/', async (req, res) => {
  try {
    const { projectName, participants, teamSize, randomnessFactor } = req.body;

    if (!projectName || !participants || !teamSize) {
      return res.status(400).json({
        error: 'Project name, participants, and team size are required'
      });
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'At least one participant required' });
    }

    if (teamSize < 2) {
      return res.status(400).json({ error: 'Team size must be at least 2' });
    }

    const project = new TeamProject({
      userId: req.userId,
      projectName,
      participants,
      teamSize,
      randomnessFactor: randomnessFactor || 30,
      constraints: [],
      numberOfTeams: Math.ceil(participants.length / teamSize)
    });

    await project.save();

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team project
router.put('/:id', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { projectName, participants, teamSize, randomnessFactor, constraints } = req.body;

    if (projectName !== undefined) project.projectName = projectName;
    if (participants !== undefined) {
      project.participants = participants;
      project.numberOfTeams = Math.ceil(participants.length / (teamSize || project.teamSize));
    }
    if (teamSize !== undefined) {
      project.teamSize = teamSize;
      project.numberOfTeams = Math.ceil((participants || project.participants).length / teamSize);
    }
    if (randomnessFactor !== undefined) project.randomnessFactor = randomnessFactor;
    if (constraints !== undefined) project.constraints = constraints;

    // Reset optimization status if participants or constraints changed
    if (participants !== undefined || constraints !== undefined) {
      project.isOptimized = false;
      project.generatedTeams = [];
      project.optimizationScore = 0;
    }

    await project.save();

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete team project
router.delete('/:id', async (req, res) => {
  try {
    const project = await TeamProject.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add participant to project
router.post('/:id/participants', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    // Check if participant already exists
    if (project.participants.some(p => p.name === name)) {
      return res.status(400).json({ error: 'Participant with this name already exists' });
    }

    project.participants.push({ name, role });
    project.numberOfTeams = Math.ceil(project.participants.length / project.teamSize);
    project.isOptimized = false;
    project.generatedTeams = [];

    await project.save();

    res.json({
      message: 'Participant added successfully',
      project
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove participant from project
router.delete('/:id/participants/:participantId', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.participants = project.participants.filter(
      p => p._id.toString() !== req.params.participantId
    );
    project.numberOfTeams = Math.ceil(project.participants.length / project.teamSize);
    project.isOptimized = false;
    project.generatedTeams = [];

    await project.save();

    res.json({
      message: 'Participant removed successfully',
      project
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add constraint to project
router.post('/:id/constraints', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { type, participants, description, roleRequirements, skillRequirements } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Type and description are required' });
    }

    const validTypes = ['cannot_be_together', 'must_be_together', 'role_distribution', 'skill_based', 'team_size'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid constraint type' });
    }

    const constraintData = { type, description };

    if (type === 'role_distribution') {
      if (!roleRequirements || Object.keys(roleRequirements).length === 0) {
        return res.status(400).json({ error: 'Role requirements are required for role distribution constraint' });
      }
      constraintData.roleRequirements = roleRequirements;
      constraintData.participants = [];
    } else if (type === 'skill_based') {
      if (!skillRequirements || !Array.isArray(skillRequirements) || skillRequirements.length === 0) {
        return res.status(400).json({ error: 'Skill requirements are required for skill-based constraint' });
      }
      constraintData.skillRequirements = skillRequirements;
      constraintData.participants = [];
    } else {
      if (!participants || !Array.isArray(participants) || participants.length < 2) {
        return res.status(400).json({ error: 'At least 2 participants required for this constraint type' });
      }
      constraintData.participants = participants;
    }

    project.constraints.push(constraintData);
    project.isOptimized = false;
    project.generatedTeams = [];

    await project.save();

    res.json({ message: 'Constraint added successfully', project });
  } catch (error) {
    console.error('Add constraint error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove constraint from project
router.delete('/:id/constraints/:constraintId', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.constraints = project.constraints.filter(
      c => c._id.toString() !== req.params.constraintId
    );
    project.isOptimized = false;
    project.generatedTeams = [];

    await project.save();

    res.json({
      message: 'Constraint removed successfully',
      project
    });
  } catch (error) {
    console.error('Remove constraint error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Optimize teams
router.post('/:id/optimize', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.participants.length === 0) {
      return res.status(400).json({ error: 'Add participants before optimizing' });
    }

    // Validate constraints
    const validation = validateConstraints(
      project.participants,
      project.constraints,
      project.teamSize
    );

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid constraints',
        details: validation.errors
      });
    }

    // Run optimization
    const result = optimizeTeams(
      project.participants,
      project.teamSize,
      project.constraints,
      project.randomnessFactor
    );

    project.generatedTeams = result.teams;
    project.isOptimized = true;
    project.optimizationScore = result.score;

    await project.save();

    res.json({
      message: 'Teams optimized successfully',
      project,
      optimization: {
        score: result.score,
        violations: result.violations,
        constraintsSatisfied: result.constraintsSatisfied
      }
    });
  } catch (error) {
    console.error('Optimize teams error:', error);
    res.status(500).json({ error: 'Server error during optimization' });
  }
});

// Update generated teams (manual modifications)
router.put('/:id/teams', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { generatedTeams } = req.body;

    if (!generatedTeams || !Array.isArray(generatedTeams)) {
      return res.status(400).json({ error: 'Invalid teams data' });
    }

    project.generatedTeams = generatedTeams;

    await project.save();

    res.json({
      message: 'Teams updated successfully',
      project
    });
  } catch (error) {
    console.error('Update teams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save current teams to history
router.post('/:id/history/save', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.generatedTeams || project.generatedTeams.length === 0) {
      return res.status(400).json({ error: 'No teams to save' });
    }

    const { notes } = req.body;

    // Calculate next version based on highest version in history, not currentVersion
    // This prevents duplicate version numbers when restoring to older versions
    const maxVersion = project.history.length > 0
      ? Math.max(...project.history.map(h => h.version))
      : 0;

    const newVersion = {
      version: maxVersion + 1,
      teams: project.generatedTeams,
      optimizationScore: project.optimizationScore,
      randomnessFactor: project.randomnessFactor,
      teamSize: project.teamSize,
      notes: notes || ''
    };

    project.history.push(newVersion);
    project.currentVersion = newVersion.version;

    await project.save();

    res.json({
      message: 'Team version saved successfully',
      version: newVersion.version,
      project
    });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team history
router.get('/:id/history', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      history: project.history,
      currentVersion: project.currentVersion
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Restore from history version
router.post('/:id/history/:version/restore', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const version = parseInt(req.params.version);
    const historyEntry = project.history.find(h => h.version === version);

    if (!historyEntry) {
      return res.status(404).json({ error: 'Version not found' });
    }

    project.generatedTeams = historyEntry.teams;
    project.optimizationScore = historyEntry.optimizationScore;
    project.isOptimized = true;
    project.currentVersion = version;

    await project.save();

    res.json({
      message: `Restored to version ${version}`,
      project
    });
  } catch (error) {
    console.error('Restore history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a version from history
router.delete('/:id/history/:version', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const version = parseInt(req.params.version);

    // Prevent deletion of current version
    if (project.currentVersion === version) {
      return res.status(400).json({ error: 'Cannot delete the current active version' });
    }

    const historyIndex = project.history.findIndex(h => h.version === version);

    if (historyIndex === -1) {
      return res.status(404).json({ error: 'Version not found' });
    }

    project.history.splice(historyIndex, 1);
    await project.save();

    res.json({
      message: `Version ${version} deleted successfully`,
      history: project.history
    });
  } catch (error) {
    console.error('Delete version error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send team assignment notifications
router.post('/:id/notify', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.generatedTeams || project.generatedTeams.length === 0) {
      return res.status(400).json({ error: 'No teams to notify about' });
    }

    const { sendBulkTeamAssignments } = await import('../services/emailService.js');
    const results = await sendBulkTeamAssignments(project);

    // Update notification timestamp
    if (!project.notifications) {
      project.notifications = {};
    }
    project.notifications.lastSentAt = new Date();
    await project.save();

    res.json({
      message: 'Notifications sent',
      results
    });
  } catch (error) {
    console.error('Send notifications error:', error);
    res.status(500).json({ error: 'Server error during notification' });
  }
});

// Update notification settings
router.patch('/:id/notifications', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { sendOnOptimization } = req.body;

    if (!project.notifications) {
      project.notifications = {};
    }

    if (sendOnOptimization !== undefined) {
      project.notifications.sendOnOptimization = sendOnOptimization;
    }

    await project.save();

    res.json({
      message: 'Notification settings updated',
      project
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
