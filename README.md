# Team Builder - Hackathon Team Generator

A full-stack web application for creating optimized hackathon teams based on roles, team sizes, and custom constraints. Built with Vue 3 and Node.js.

## Features

### Core Functionality
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
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/teambuilder

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

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

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_URL=http://localhost:5000/api
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
- Backend API: http://localhost:5000

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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with password
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/request-magic-link` - Request magic link
- `POST /api/auth/verify-magic-link` - Verify magic link
- `GET /api/auth/me` - Get current user

### Teams
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

## Optimization Algorithm

The team optimization algorithm:

1. **Validates constraints** before optimization
2. **Applies randomness** based on the randomness factor
3. **Prioritizes must-be-together** constraints first
4. **Avoids cannot-be-together** violations
5. **Balances team sizes** to prevent uneven distribution
6. **Promotes role diversity** within teams
7. **Calculates a score** based on:
   - Constraint violations (heavy penalty)
   - Team size balance
   - Role distribution
8. **Runs multiple iterations** to find the best solution

## Project Structure

```
TeamBuilder/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Team.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── teams.js
│   │   ├── services/
│   │   │   ├── emailService.js
│   │   │   └── teamOptimizer.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── stores/
│   │   │   ├── auth.js
│   │   │   └── teams.js
│   │   ├── views/
│   │   │   ├── Dashboard.vue
│   │   │   ├── Login.vue
│   │   │   ├── LoginVerify.vue
│   │   │   ├── MagicLink.vue
│   │   │   ├── NewProject.vue
│   │   │   ├── ProjectDetail.vue
│   │   │   ├── Register.vue
│   │   │   └── VerifyEmail.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `brew services list` (macOS) or `sudo systemctl status mongod` (Linux)
- Check the connection string in `.env`

### Email Not Sending
- Verify SMTP credentials in `.env`
- Check if less secure app access is enabled (for Gmail)
- Try generating an app-specific password

### Port Already in Use
- Change `PORT` in backend `.env`
- Change `server.port` in frontend `vite.config.js`

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that the proxy is configured in `vite.config.js`

## Future Enhancements

- Export teams to CSV/PDF
- Team analytics and statistics
- Multiple optimization strategies
- Real-time collaboration
- Integration with Slack/Discord
- Mobile app version

## License

ISC

## Support

For issues and questions, please open an issue on the GitHub repository.
