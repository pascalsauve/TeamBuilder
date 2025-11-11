import express from 'express';
import multer from 'multer';
import TeamProject from '../models/Team.js';
import { authenticate } from '../middleware/auth.js';
import {
  generateTeamsCSV,
  generateParticipantsCSV,
  generateTeamsPDF,
  generateTeamStats
} from '../services/exportService.js';
import {
  parseParticipantsCSV,
  validateImportedParticipants,
  generateSampleCSV
} from '../services/importService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Export teams to CSV
router.get('/teams/:id/csv', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const csv = generateTeamsCSV(project);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${project.projectName}-teams.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error during export' });
  }
});

// Export participants to CSV
router.get('/teams/:id/participants/csv', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const csv = generateParticipantsCSV(project);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${project.projectName}-participants.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export participants CSV error:', error);
    res.status(500).json({ error: 'Server error during export' });
  }
});

// Export teams to PDF
router.get('/teams/:id/pdf', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const pdfBuffer = await generateTeamsPDF(project);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${project.projectName}-teams.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Server error during PDF export' });
  }
});

// Get team statistics
router.get('/teams/:id/stats', async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const stats = generateTeamStats(project);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Import participants from CSV
router.post('/teams/:id/import', upload.single('file'), async (req, res) => {
  try {
    const project = await TeamProject.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const parseResult = parseParticipantsCSV(csvContent);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'CSV parsing failed',
        details: parseResult.errors
      });
    }

    const validation = validateImportedParticipants(
      parseResult.participants,
      project.participants
    );

    // Add unique participants
    const participantsToAdd = validation.uniqueParticipants;
    project.participants.push(...participantsToAdd);
    project.numberOfTeams = Math.ceil(project.participants.length / project.teamSize);
    project.isOptimized = false;
    project.generatedTeams = [];

    await project.save();

    res.json({
      message: 'Participants imported successfully',
      added: participantsToAdd.length,
      skipped: validation.duplicates.length,
      warnings: validation.warnings,
      hasWarnings: validation.hasWarnings,
      project
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Server error during import' });
  }
});

// Get sample CSV template
router.get('/sample-csv', (req, res) => {
  const csv = generateSampleCSV();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="participants-template.csv"');
  res.send(csv);
});

export default router;
