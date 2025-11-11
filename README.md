# Team Builder v2 - Hackathon Team Generator

A full-stack application for generating optimized hackathon teams with advanced constraints, export/import, history/versioning, notifications, and admin capabilities.

## 1. Features (v2 Consolidated)

### Team & Optimization
- Intelligent multi-iteration team generation (balance + constraints + role distribution)
- Adjustable randomness factor (0–100%) influencing iterations
- Manual team adjustments (rename, move, drag-and-drop, reorder)
- Team history & versioning (save, list, restore)
- Optimization scoring (penalties/rewards)

### Participants & Data
- Add/remove participants with role
- Extended participant fields: email (notifications), skills (array)
- Role distribution exact counts per team
- Skill-based constraints (backend-ready)

### Constraints (Implemented)
1. cannot_be_together (≥2)
2. must_be_together (≥2, ≤ teamSize)
3. role_distribution (roleRequirements sum must equal teamSize)
4. skill_based (min/max per skill, backend only)

### Export / Import / Stats
- Export teams (CSV, PDF)
- Export participants (CSV)
- Import participants (CSV with duplicate handling & skills parsing)
- Detailed statistics endpoint (role counts, diversity, constraint breakdown)

### Notifications
- Bulk team assignment emails
- Optional auto-send on optimization (toggle)
- Tracks lastSentAt
- Skips participants without email

### Admin (Backend Complete)
- User listing, detail, role update, deletion
- Project listing
- System statistics (users/projects summary)
- Role-based access control (user/admin)

### Authentication
- Registration with email verification
- Password login
- Magic link login (email token)
- JWT authentication (7-day expiry)

### Technology Summary
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Nodemailer
- Frontend: Vue 3, Pinia, Vue Router, Axios, Vite
- Additional libs: csv-parse, csv-stringify, pdfkit, multer

> Frontend UI for v2 additions (export/import/history/admin/notifications/skill constraints) pending. Backend fully operational.

## 2. Installation

### Backend
```bash
cd backend
npm install
```
`.env` example:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/teambuilder
JWT_SECRET=change-this-to-a-secure-random-string
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@teambuilder.com
FRONTEND_URL=http://localhost:5173
MAGIC_LINK_EXPIRY=15
```

### Frontend
```bash
cd frontend
npm install
```
`frontend/.env`:
```env
VITE_API_URL=http://localhost:8080/api
```

### Run
```bash
# Terminal 1
cd backend && npm run dev
# Terminal 2
cd frontend && npm run dev
```
- Backend: http://localhost:8080
- Frontend: http://localhost:5173

## 3. Core Workflows

### Create & Optimize
1. Create project (name, teamSize, randomnessFactor, participants).
2. Add constraints.
3. Optimize teams (`POST /api/teams/:id/optimize`).
4. (Optional) Save version (`POST /api/teams/:id/history/save`).

### Export
- Teams CSV: `GET /api/export/teams/:id/csv`
- Teams PDF: `GET /api/export/teams/:id/pdf`
- Participants CSV: `GET /api/export/teams/:id/participants/csv`
- Stats: `GET /api/export/teams/:id/stats`

### Import
```bash
POST /api/export/teams/:id/import  (multipart/form-data: file=participants.csv)
CSV Columns: Name,Role,Skills (semicolon separated)
```

### Versioning
- Save: `POST /api/teams/:id/history/save`
- List: `GET /api/teams/:id/history`
- Restore: `POST /api/teams/:id/history/:version/restore`

### Notifications
- Send: `POST /api/teams/:id/notify`
- Settings: `PATCH /api/teams/:id/notifications` (e.g. `{ "sendOnOptimization": true }`)

### Admin Setup
Promote a user to admin:
```bash
mongosh teambuilder
db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
```

## 4. API Endpoints (v2 Complete)

### Auth
```
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/verify-email
POST  /api/auth/request-magic-link
POST  /api/auth/verify-magic-link
GET   /api/auth/me
```

### Projects & Participants
```
GET    /api/teams
GET    /api/teams/:id
POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id
POST   /api/teams/:id/participants
DELETE /api/teams/:id/participants/:participantId
POST   /api/teams/:id/constraints
DELETE /api/teams/:id/constraints/:constraintId
POST   /api/teams/:id/optimize
PUT    /api/teams/:id/teams
```

### History / Versioning
```
POST   /api/teams/:id/history/save
GET    /api/teams/:id/history
POST   /api/teams/:id/history/:version/restore
```

### Notifications
```
POST   /api/teams/:id/notify
PATCH  /api/teams/:id/notifications
```

### Export / Import / Stats
```
GET    /api/export/teams/:id/csv
GET    /api/export/teams/:id/participants/csv
GET    /api/export/teams/:id/pdf
GET    /api/export/teams/:id/stats
POST   /api/export/teams/:id/import
GET    /api/export/sample-csv
```

### Admin
```
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/role
DELETE /api/admin/users/:id
GET    /api/admin/projects
GET    /api/admin/stats
```

## 5. Constraints Details

### role_distribution
- roleRequirements object keys = roles, values = exact count per team.
- Sum must equal teamSize.
- Validation ensures enough participants overall.

Example:
```json
{
  "type": "role_distribution",
  "roleRequirements": { "Developer": 2, "Designer": 1, "PM": 1 },
  "description": "Each team must have 2 Developers, 1 Designer, 1 PM"
}
```

### skill_based (backend)
```json
{
  "type": "skill_based",
  "skillRequirements": [
    { "skill": "React", "minCount": 1, "maxCount": 2 },
    { "skill": "Python", "minCount": 1, "maxCount": 1 }
  ],
  "description": "React and Python coverage"
}
```

## 6. Data Models (Expanded)

### User
```javascript
{
  username, email, password(hash), isVerified,
  role: 'user' | 'admin',
  lastLoginAt,
  verificationToken, verificationTokenExpiry,
  resetPasswordToken, resetPasswordExpiry,
  timestamps
}
```

### Participant
```javascript
{ name, role, email, skills: [String], assignedTeam }
```

### Constraint
```javascript
{
  type,
  participants: [String],
  roleRequirements: { [role]: Number },
  skillRequirements: [{ skill, minCount, maxCount }],
  description
}
```

### TeamProject
```javascript
{
  userId,
  projectName,
  participants: [...],
  constraints: [...],
  teamSize,
  numberOfTeams,
  randomnessFactor,
  generatedTeams: [{ teamNumber, teamName, members: [{ name, role }] }],
  isOptimized,
  optimizationScore,
  history: [{ version, teams, optimizationScore, notes, generatedAt }],
  currentVersion,
  notifications: { sendOnOptimization, lastSentAt },
  timestamps
}
```

## 7. Optimization Algorithm Summary

Base score: 100  
Penalties:
- cannot_be_together: -20
- must_be_together: -15
- role_distribution mismatch: -18 per team per role
- team size imbalance: -5 per size difference > 1
Bonus:
- Role diversity: up to +5 per team (uniqueRoles/totalRoles * 5)

Iterations:
- randomnessFactor ≤ 20 → 100 iterations
- 21–50 → 50 iterations
- >50 → 10 iterations

Greedy placement with constraint-aware scoring + randomness (partial shuffle).

## 8. Quick Test Commands

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"secret123"}'

# Optimize
curl -X POST http://localhost:8080/api/teams/PROJECT_ID/optimize \
  -H "Authorization: Bearer TOKEN"

# Export CSV
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/export/teams/PROJECT_ID/csv -o teams.csv

# Save Version
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Initial"}' \
  http://localhost:8080/api/teams/PROJECT_ID/history/save

# Send Notifications
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/teams/PROJECT_ID/notify
```

## 9. Troubleshooting

| Issue | Check |
|-------|-------|
| 401 errors | Token expired / missing Authorization header |
| Role distribution error | Counts sum != teamSize or insufficient participants |
| CSV import fails | Header format: Name,Role,Skills |
| Emails not sent | SMTP credentials / less secure app access / app password |
| Admin access denied | User role set to 'admin' in DB |
| Frontend not hitting API | VITE_API_URL matches backend port 8080 |

## 10. Roadmap

Already Implemented (Backend):
- CSV/PDF Export, Import, Stats
- History & Versioning
- Notifications
- Admin Panel
- Skill-Based & Role Distribution Constraints

Pending (Frontend):
- UI for export/import/history/admin/notifications/skill constraints
- Analytics visualization
- Skill-based assignment UI

Future:
- XLSX export
- Real-time collaboration (WebSockets)
- Slack/Discord integration
- Dark mode
- Test coverage (unit/E2E)
- Docker + CI/CD

## 11. License

ISC

## 12. Support

Open an issue in the repository for bugs or questions.

---
Backend v2 complete. Frontend enhancements pending integration.
