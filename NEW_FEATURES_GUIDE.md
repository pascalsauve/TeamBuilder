# New Features Guide - Team Builder v2.0

## 🚀 Overview

This document outlines all the new features added to the Team Builder application. These features significantly enhance the application with export capabilities, analytics, admin functionality, and more.

---

## 📋 Table of Contents

1. [Export & Import Features](#export--import-features)
2. [Team Statistics & Analytics](#team-statistics--analytics)
3. [Team History & Versioning](#team-history--versioning)
4. [Email Notifications](#email-notifications)
5. [Admin Panel](#admin-panel)
6. [Enhanced Constraints](#enhanced-constraints)
7. [API Reference](#api-reference)
8. [Installation](#installation)

---

## 📤 Export & Import Features

### CSV Export

Export teams and participants to CSV format for use in spreadsheets and other tools.

#### Export Teams to CSV

**Endpoint:** `GET /api/export/teams/:id/csv`

**Response:** CSV file download

**CSV Format:**
```csv
Project Name,Spring 2024 Hackathon
Team Size,4
Number of Teams,3
Optimization Score,87.50
Generated At,2024-11-11T10:30:00.000Z

Team 1,,
Member Name,Role,
Alice Johnson,Developer,
Bob Smith,Designer,
...
```

#### Export Participants to CSV

**Endpoint:** `GET /api/export/teams/:id/participants/csv`

**Response:** CSV file download

**CSV Format:**
```csv
Name,Role,Assigned Team
Alice Johnson,Developer,Team 1
Bob Smith,Designer,Team 1
Carol Williams,Product Manager,Team 2
...
```

### PDF Export

Export teams to professionally formatted PDF documents.

**Endpoint:** `GET /api/export/teams/:id/pdf`

**Features:**
- Project information header
- Team names and members
- Role assignments
- Optimization score
- Page numbers
- Professional formatting

**PDF Layout:**
```
=============================================
        Spring 2024 Hackathon
=============================================

Team Size: 4    Number of Teams: 3
Optimization Score: 87.50    Generated: 11/11/2024

Team 1
  • Alice Johnson - Developer
  • Bob Smith - Designer
  • Carol Williams - Product Manager
  • David Brown - Data Scientist
...
```

### CSV Import

Import participants from CSV files to quickly populate projects.

**Endpoint:** `POST /api/export/teams/:id/import`

**Request:** Form-data with file upload

**CSV Template:**
```csv
Name,Role,Skills
Alice Johnson,Developer,JavaScript;React;Node.js
Bob Smith,Designer,UI/UX;Figma;Photoshop
Carol Williams,Product Manager,Agile;Scrum
```

**Features:**
- Automatic header detection
- Duplicate checking
- Skill parsing (semicolon-separated)
- Error reporting
- Validation

**Response:**
```json
{
  "message": "Participants imported successfully",
  "imported": 6,
  "skipped": 2,
  "warnings": ["Participant 'Alice' already exists and will be skipped"],
  "project": { ... }
}
```

#### Get Sample CSV Template

**Endpoint:** `GET /api/export/sample-csv`

Downloads a sample CSV template with example data.

---

## 📊 Team Statistics & Analytics

Comprehensive statistics and analytics for team projects.

**Endpoint:** `GET /api/export/teams/:id/stats`

**Response:**
```json
{
  "stats": {
    "totalParticipants": 24,
    "totalTeams": 6,
    "teamSize": 4,
    "optimizationScore": 87.5,
    "isOptimized": true,
    "roleDistribution": {
      "Developer": 10,
      "Designer": 6,
      "Product Manager": 4,
      "Data Scientist": 4
    },
    "teamStats": [
      {
        "teamNumber": 1,
        "teamName": "Team Alpha",
        "memberCount": 4,
        "roles": {
          "Developer": 2,
          "Designer": 1,
          "Product Manager": 1
        },
        "roleDiversity": 3
      }
    ],
    "averageTeamSize": 4.0,
    "minTeamSize": 4,
    "maxTeamSize": 4,
    "constraints": {
      "total": 5,
      "byType": {
        "cannot_be_together": 2,
        "must_be_together": 1,
        "role_distribution": 2
      }
    }
  }
}
```

**Metrics Included:**
- Total participants and teams
- Role distribution across all participants
- Per-team statistics
- Role diversity per team
- Team size balance
- Constraint breakdown

---

## 🕐 Team History & Versioning

Save, view, and restore previous versions of team configurations.

### Save Current Teams as Version

**Endpoint:** `POST /api/teams/:id/history/save`

**Request:**
```json
{
  "notes": "Initial team assignment before adjustments"
}
```

**Response:**
```json
{
  "message": "Team version saved successfully",
  "version": 3,
  "project": { ... }
}
```

### Get Team History

**Endpoint:** `GET /api/teams/:id/history`

**Response:**
```json
{
  "history": [
    {
      "version": 1,
      "generatedAt": "2024-11-10T10:00:00.000Z",
      "teams": [ ... ],
      "optimizationScore": 85.0,
      "randomnessFactor": 30,
      "teamSize": 4,
      "notes": "First optimization"
    },
    {
      "version": 2,
      "generatedAt": "2024-11-10T14:30:00.000Z",
      "teams": [ ... ],
      "optimizationScore": 87.5,
      "randomnessFactor": 20,
      "teamSize": 4,
      "notes": "After manual adjustments"
    }
  ],
  "currentVersion": 2
}
```

### Restore from History

**Endpoint:** `POST /api/teams/:id/history/:version/restore`

**Response:**
```json
{
  "message": "Restored to version 1",
  "project": { ... }
}
```

**Use Cases:**
- Compare different optimization results
- Undo manual changes
- Track team evolution over time
- Revert to previous configurations

---

## 📧 Email Notifications

Send team assignment notifications to participants via email.

### Send Team Assignments

**Endpoint:** `POST /api/teams/:id/notify`

**Response:**
```json
{
  "message": "Notifications sent",
  "results": {
    "sent": 18,
    "failed": 0,
    "skipped": 6,
    "errors": []
  }
}
```

**Email Content:**
```
Subject: Team Assignment - Spring 2024 Hackathon

Hi Alice Johnson,

You have been assigned to a team for Spring 2024 Hackathon.

Team Alpha
Your Role: Developer

Team Members:
• Alice Johnson - Developer
• Bob Smith - Designer
• Carol Williams - Product Manager
• David Brown - Data Scientist

Looking forward to working with you!
```

### Update Notification Settings

**Endpoint:** `PATCH /api/teams/:id/notifications`

**Request:**
```json
{
  "sendOnOptimization": true
}
```

**Response:**
```json
{
  "message": "Notification settings updated",
  "project": { ... }
}
```

**Requirements:**
- Participants must have email addresses
- SMTP configuration must be set up
- Emails are sent asynchronously

---

## 👨‍💼 Admin Panel

Administrative features for managing users and viewing system statistics.

### Get All Users (Admin Only)

**Endpoint:** `GET /api/admin/users`

**Response:**
```json
{
  "users": [
    {
      "_id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": true,
      "createdAt": "2024-11-01T10:00:00.000Z",
      "lastLoginAt": "2024-11-11T09:00:00.000Z"
    }
  ],
  "count": 42
}
```

### Get User Details (Admin Only)

**Endpoint:** `GET /api/admin/users/:id`

**Response:**
```json
{
  "user": { ... },
  "projects": [ ... ],
  "projectCount": 5
}
```

### Update User Role (Admin Only)

**Endpoint:** `PATCH /api/admin/users/:id/role`

**Request:**
```json
{
  "role": "admin"
}
```

**Available Roles:**
- `user` - Regular user
- `admin` - Administrator

### Delete User (Admin Only)

**Endpoint:** `DELETE /api/admin/users/:id`

**Features:**
- Deletes user account
- Deletes all user's projects
- Cannot delete own account

### Get All Projects (Admin Only)

**Endpoint:** `GET /api/admin/projects`

**Response:**
```json
{
  "projects": [ ... ],
  "count": 127
}
```

### Get System Statistics (Admin Only)

**Endpoint:** `GET /api/admin/stats`

**Response:**
```json
{
  "users": {
    "total": 42,
    "verified": 38,
    "admins": 3,
    "recent": [ ... ]
  },
  "projects": {
    "total": 127,
    "optimized": 95,
    "recent": [ ... ]
  }
}
```

---

## 🎯 Enhanced Constraints

### Skill-Based Constraints

New constraint type for ensuring teams have required skills.

**Schema Addition:**
```javascript
{
  type: 'skill_based',
  skillRequirements: [
    { skill: 'JavaScript', minCount: 1, maxCount: 3 },
    { skill: 'UI/UX', minCount: 1, maxCount: 1 }
  ],
  description: 'Each team needs JavaScript and UI/UX skills'
}
```

**Example Usage:**
```json
{
  "type": "skill_based",
  "skillRequirements": [
    {
      "skill": "React",
      "minCount": 1,
      "maxCount": 2
    },
    {
      "skill": "Python",
      "minCount": 1,
      "maxCount": 1
    }
  ],
  "description": "Teams need 1-2 React developers and 1 Python developer"
}
```

### Enhanced Participant Data

Participants now support additional fields:

```javascript
{
  name: 'Alice Johnson',
  role: 'Developer',
  skills: ['JavaScript', 'React', 'Node.js'],  // NEW
  email: 'alice@example.com'                    // NEW
}
```

---

## 🔌 API Reference

### New Endpoints Summary

#### Export/Import (7 endpoints)
```
GET    /api/export/teams/:id/csv                  # Export teams to CSV
GET    /api/export/teams/:id/participants/csv     # Export participants to CSV
GET    /api/export/teams/:id/pdf                  # Export teams to PDF
GET    /api/export/teams/:id/stats                # Get team statistics
POST   /api/export/teams/:id/import               # Import participants from CSV
GET    /api/export/sample-csv                     # Download sample CSV
```

#### History/Versioning (3 endpoints)
```
POST   /api/teams/:id/history/save                # Save current version
GET    /api/teams/:id/history                     # Get version history
POST   /api/teams/:id/history/:version/restore    # Restore version
```

#### Notifications (2 endpoints)
```
POST   /api/teams/:id/notify                      # Send team notifications
PATCH  /api/teams/:id/notifications               # Update notification settings
```

#### Admin Panel (6 endpoints)
```
GET    /api/admin/users                           # Get all users
GET    /api/admin/users/:id                       # Get user details
PATCH  /api/admin/users/:id/role                  # Update user role
DELETE /api/admin/users/:id                       # Delete user
GET    /api/admin/projects                        # Get all projects
GET    /api/admin/stats                           # Get system stats
```

**Total New Endpoints:** 18

---

## 📦 Installation

### Dependencies Added

```json
{
  "csv-parse": "^5.5.3",      // CSV parsing
  "csv-stringify": "^6.4.5",  // CSV generation
  "pdfkit": "^0.13.0",        // PDF generation
  "multer": "^1.4.5-lts.1"    // File uploads
}
```

### Installation Steps

1. **Install new dependencies:**
```bash
cd backend
npm install
```

2. **No database migration needed** - Mongoose handles schema updates automatically

3. **Create first admin user:**
```bash
# Connect to MongoDB and update a user
mongosh teambuilder
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

4. **Restart the server:**
```bash
npm run dev
```

---

## 🔐 Security & Permissions

### Admin Routes
- All admin routes require authentication
- All admin routes require `role: 'admin'`
- Admins cannot delete themselves
- Returns 403 Forbidden for non-admin users

### File Uploads
- Max file size: 5MB
- Only CSV files accepted
- Files stored in memory (not disk)
- Automatic validation

### Email Notifications
- Only sends to participants with email addresses
- Tracks last sent timestamp
- Prevents duplicate sends
- Optional auto-send on optimization

---

## 📊 Database Schema Changes

### User Model
```javascript
{
  role: { type: String, enum: ['user', 'admin'], default: 'user' },  // NEW
  lastLoginAt: Date                                                   // NEW
}
```

### Participant Schema
```javascript
{
  skills: [{ type: String }],           // NEW
  email: { type: String, lowercase: true }  // NEW
}
```

### Constraint Schema
```javascript
{
  type: { enum: [..., 'skill_based'] },                              // UPDATED
  skillRequirements: [{ skill: String, minCount: Number, maxCount: Number }]  // NEW
}
```

### Team Project Schema
```javascript
{
  history: [teamHistorySchema],         // NEW
  currentVersion: { type: Number },     // NEW
  notifications: {                       // NEW
    sendOnOptimization: Boolean,
    lastSentAt: Date
  }
}
```

---

## 🎨 UI Integration (To Be Implemented)

The backend is fully ready. Frontend implementation needed for:

1. **Export Buttons**
   - Add "Export CSV" and "Export PDF" buttons to ProjectDetail page
   - Add "Download Stats" button

2. **Import Form**
   - File upload component
   - Drag & drop support
   - Preview imported data before saving

3. **Analytics Dashboard**
   - Charts for role distribution
   - Team balance visualization
   - Constraint satisfaction metrics

4. **History Timeline**
   - Version list with timestamps
   - Restore confirmation dialog
   - Version comparison view

5. **Notification Settings**
   - Toggle for auto-send on optimization
   - Manual send button
   - Email status indicator

6. **Admin Panel Pages**
   - User management table
   - Project overview
   - System statistics dashboard

---

## 🧪 Testing the Features

### Test CSV Export
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/export/teams/PROJECT_ID/csv \
  -o teams.csv
```

### Test PDF Export
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/export/teams/PROJECT_ID/pdf \
  -o teams.pdf
```

### Test CSV Import
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@participants.csv" \
  http://localhost:8080/api/export/teams/PROJECT_ID/import
```

### Test Notifications
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/teams/PROJECT_ID/notify
```

### Test Admin Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/admin/stats
```

---

## 📝 Usage Examples

### Example Workflow: Import and Optimize

1. **Create project**
2. **Import participants from CSV**
3. **Add constraints**
4. **Optimize teams**
5. **Save version** ("Initial optimization")
6. **Make manual adjustments**
7. **Save version** ("After manual changes")
8. **Send notifications to team members**
9. **Export to PDF for printing**
10. **Export stats for reporting**

### Example Admin Workflow

1. **View system stats**
2. **Check recent user registrations**
3. **Promote trusted user to admin**
4. **Review all projects**
5. **Monitor optimization success rate**

---

## 🔄 Migration from v1.0

### No Breaking Changes

All existing features continue to work. New features are additive.

### Optional Updates

1. Add email addresses to existing participants
2. Promote an admin user
3. Configure SMTP for notifications

### Recommended Actions

1. Install new dependencies
2. Test export features
3. Create sample CSV for users
4. Document admin procedures

---

## 🚀 Future Enhancements

Potential additions for v3.0:

- [ ] Excel export (.xlsx)
- [ ] Skill matching algorithm
- [ ] Team performance tracking
- [ ] Integration with Slack/Discord
- [ ] Batch operations for admins
- [ ] Advanced analytics (charts, graphs)
- [ ] Team templates
- [ ] Automated scheduling
- [ ] Mobile app version

---

## 📞 Support & Documentation

For questions or issues:

1. Check this guide
2. Review API responses
3. Check server logs
4. Verify environment variables
5. Test with sample data

---

**Version:** 2.0
**Date:** November 2024
**Status:** ✅ Production Ready (Backend Complete)
**Next Steps:** Frontend UI Implementation

