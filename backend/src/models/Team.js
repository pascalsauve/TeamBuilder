import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  assignedTeam: {
    type: Number,
    default: null
  }
});

const constraintSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cannot_be_together', 'must_be_together', 'role_distribution', 'team_size'],
    required: true
  },
  participants: [{
    type: String // participant names
  }],
  roleRequirements: {
    type: Map,
    of: Number,
    default: undefined // For role_distribution constraints: { "Developer": 2, "Designer": 1 }
  },
  description: {
    type: String,
    required: true
  }
});

const teamResultSchema = new mongoose.Schema({
  teamNumber: {
    type: Number,
    required: true
  },
  teamName: {
    type: String,
    default: ''
  },
  members: [{
    name: String,
    role: String
  }]
});

const teamProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  participants: [participantSchema],
  constraints: [constraintSchema],
  teamSize: {
    type: Number,
    required: true,
    min: 2,
    default: 4
  },
  numberOfTeams: {
    type: Number,
    min: 1
  },
  randomnessFactor: {
    type: Number,
    min: 0,
    max: 100,
    default: 30,
    description: 'Percentage of randomness in team generation (0-100)'
  },
  generatedTeams: [teamResultSchema],
  isOptimized: {
    type: Boolean,
    default: false
  },
  optimizationScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const TeamProject = mongoose.model('TeamProject', teamProjectSchema);

export default TeamProject;
