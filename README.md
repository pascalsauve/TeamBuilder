# Team Builder - Hackathon Team Generator

A full-stack web application for creating optimized hackathon teams based on roles, team sizes, and custom constraints. Built with Vue 3 and Node.js.

## Features

### Core Functionality (v1)
- **Intelligent Team Generation**: Create balanced teams using an optimization algorithm
- **Role-based Assignment**: Organize participants by their roles (Developer, Designer, etc.)
- **Custom Constraints**: Define rules like "User A cannot be with User B" or "User C must be with User D"
- **Randomness Control**: Adjust the randomness factor (0-100%) for team generation
- **Manual Adjustments**: Modify teams after optimization with drag-and-drop functionality
- **Team Persistence**: Save and load team configurations

### Authentication
- **User Registration**: Create an account with username and email
- **Email Verification**: Verify email addresses via magic link
- **Password Login**: Traditional username/password authentication
- **Magic Link Login**: Passwordless login via email link

### User Experience
- **Dashboard**: View all your team projects
- **Project Management**: Create, edit, and delete projects
- **Real-time Updates**: See optimization scores and constraint violations
- **Responsive Design**: Works on desktop and tablet devices

### Extended Backend Features (v2)
- Export teams to CSV and PDF (backend complete)
- Export participants to CSV
- Import participants from CSV (duplicate & validation handling)
- Detailed team statistics endpoint
- Team history & versioning (save, list, restore)
- Email notifications for team assignments
- Admin panel backend (user/project/system stats, role management)
- Skill-based constraints (backend only)
- Enhanced participant schema (skills, email)
- Role distribution exact counts per team

> Frontend UI for v2 features is not yet implemented. Backend endpoints are ready.

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email services
- **bcrypt** for password hashing

### Frontend
- **Vue 3** with Composition API
- **Vue Router** for navigation
- **Pinia** for state management
- **Vite** for build tooling
- **Axios** for HTTP requests

### Additional Backend Dependencies (v2)
Installed in backend/package.json:
```bash
npm install csv-parse csv-stringify pdfkit multer
```

- csv-parse / csv-stringify: CSV import/export
- pdfkit: PDF generation
- multer: File upload handling

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- SMTP email service (Gmail, SendGrid, etc.)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd TeamBuilder
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/teambuilder

# JWT Secret (change this!)
JWT_SECRET=change-this-to-a-secure-random-string

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@teambuilder.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Magic Link Token Expiry (in minutes)
MAGIC_LINK_EXPIRY=15
```

### 3. Frontend Setup
If using backend on 8080:
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_URL=http://localhost:8080/api
```

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Email Configuration

### Using Gmail

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Use this password in your `.env` file as `EMAIL_PASS`

### Using Other Email Services

Update the following in your `.env` file:

```env
EMAIL_HOST=smtp.your-service.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Usage Guide

### 1. Register an Account

1. Navigate to http://localhost:5173
2. Click "Register here"
3. Enter username, email, and password
4. Check your email for verification link
5. Click the verification link to activate your account

### 2. Create a Project

1. Log in to your account
2. Click "Create New Project"
3. Enter project name (e.g., "Spring 2024 Hackathon")
4. Set team size (default: 4)
5. Set randomness factor (default: 30%)
6. Add participants with their names and roles

### 3. Add Constraints

Two types of constraints are available:

**Cannot be Together**
- Select 2 or more participants who should NOT be on the same team
- Example: "Alice and Bob cannot work together"

**Must be Together**
- Select 2 or more participants who MUST be on the same team
- Example: "Carol and Dave are a package deal"

### Constraints (Updated)
Supported types:
1. cannot_be_together (≥2 participants)
2. must_be_together (≥2 participants, ≤ team size)
3. role_distribution (exact count per role per team; counts must sum to teamSize)
4. skill_based (backend only; requires skillRequirements array with min/max per skill)

Example role distribution constraint request:
```json
{
  "type": "role_distribution",
  "roleRequirements": {
    "Developer": 2,
    "Designer": 1,
    "Product Manager": 1
  },
  "description": "Each team must have 2 Developers, 1 Designer, 1 PM"
}
```

### 4. Optimize Teams

1. Click "Optimize Teams" button
2. The algorithm will generate teams based on:
   - Team size preferences
   - Role distribution
   - Constraint satisfaction
   - Randomness factor
3. View optimization score and constraint violations

### 5. Manual Adjustments

After optimization, you can:
- **Rename teams**: Click on team names to edit
- **Move members**: Use the dropdown or drag-and-drop
- **Re-optimize**: Click "Re-optimize" to generate new teams
- **Modify settings**: Change team size or randomness and re-optimize

### 6. Save and Load

Projects are automatically saved to the database. Access them anytime from the Dashboard.

### New v2 Workflows (Backend Available)

#### Export Teams
1. Optimize teams.
2. Call GET `/api/export/teams/:id/csv` or `/api/export/teams/:id/pdf`.

#### Import Participants
1. Prepare CSV: `Name,Role,Skills`
2. POST `/api/export/teams/:id/import` (multipart/form-data with file).

#### Team History
- Save current configuration: `POST /api/teams/:id/history/save`
- List versions: `GET /api/teams/:id/history`
- Restore: `POST /api/teams/:id/history/:version/restore`

#### Notifications
- Send assignment emails: `POST /api/teams/:id/notify`
- Update settings: `PATCH /api/teams/:id/notifications` (e.g. `{ "sendOnOptimization": true }`)

#### Admin (after promoting a user)
```bash
mongosh teambuilder
db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with password
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/request-magic-link` - Request magic link
- `POST /api/auth/verify-magic-link` - Verify magic link
- `GET /api/auth/me` - Get current user

### Team Projects (v1)
- `GET /api/teams` - Get all projects
- `GET /api/teams/:id` - Get single project
- `POST /api/teams` - Create new project
- `PUT /api/teams/:id` - Update project
- `DELETE /api/teams/:id` - Delete project
- `POST /api/teams/:id/participants` - Add participant
- `DELETE /api/teams/:id/participants/:participantId` - Remove participant
- `POST /api/teams/:id/constraints` - Add constraint
- `DELETE /api/teams/:id/constraints/:constraintId` - Remove constraint
- `POST /api/teams/:id/optimize` - Optimize teams
- `PUT /api/teams/:id/teams` - Update generated teams

### Additional Endpoints (v2)

#### Export / Import
```
GET    /api/export/teams/:id/csv
GET    /api/export/teams/:id/participants/csv
GET    /api/export/teams/:id/pdf
GET    /api/export/teams/:id/stats
POST   /api/export/teams/:id/import
GET    /api/export/sample-csv
```

#### History / Versioning
```
POST   /api/teams/:id/history/save
GET    /api/teams/:id/history
POST   /api/teams/:id/history/:version/restore
```

#### Notifications
```
POST   /api/teams/:id/notify
PATCH  /api/teams/:id/notifications
```

#### Admin
```
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/role
DELETE /api/admin/users/:id
GET    /api/admin/projects
GET    /api/admin/stats
```

### Constraint Addition (role_distribution example)
...existing code...

## Data Model Updates (v2)

### Participant (extended)
```javascript
{
  name: String,
  role: String,
  email: String,        // optional (for notifications)
  skills: [String]      // optional (for skill-based constraints)
}
```

### Constraint (extended)
```javascript
{
  type: 'cannot_be_together' | 'must_be_together' | 'role_distribution' | 'skill_based',
  participants: [String],           // for participant-based
  roleRequirements: { Role: Number }, // for role_distribution
  skillRequirements: [               // for skill_based
    { skill: String, minCount: Number, maxCount: Number }
  ],
  description: String
}
```

### Team Project (added fields)
```javascript
{
  history: [ { version, teams, optimizationScore, notes, generatedAt } ],
  currentVersion: Number,
  notifications: {
    sendOnOptimization: Boolean,
    lastSentAt: Date
  }
}
```

### User (added field)
```javascript
{
  role: 'user' | 'admin',
  lastLoginAt: Date
}
```

## Optimization Algorithm (Updated)
Penalties:
- cannot_be_together: -20
- must_be_together: -15
- role_distribution mismatch: -18 per team per role
- size imbalance: -5 per member difference
Bonuses:
- role diversity: up to +5 per team

Iterations scale by randomness factor (≤20 → 100, >20 → 50, >50 → 10).

## Future Enhancements

- Export teams to CSV/PDF
- Team analytics and statistics
- Multiple optimization strategies
- Real-time collaboration
- Integration with Slack/Discord
- Mobile app version

## Troubleshooting (Updated Ports)
- If frontend 5173 cannot reach backend: verify backend runs on 8080 and `VITE_API_URL` matches.
- Constraint errors: ensure role distribution totals equal `teamSize`.

## Known Gaps (Frontend Pending)
- No UI yet for export/import/history/admin/notifications/skill constraints.
- All endpoints testable via curl/Postman.

## Quick Test Commands

```bash
# Export teams CSV
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/export/teams/PROJECT_ID/csv -o teams.csv

# Save version
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Initial"}' \
  http://localhost:8080/api/teams/PROJECT_ID/history/save
```

## License

ISC

## Support

For issues and questions, please open an issue on the GitHub repository.
