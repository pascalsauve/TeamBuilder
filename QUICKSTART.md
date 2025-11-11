# Quick Start Guide

## Prerequisites Check

Before starting, verify you have:

```bash
node --version   # Should be v16 or higher
npm --version    # Should be 8 or higher
mongod --version # Should be v5 or higher
```

If not installed:
- **Node.js**: Download from https://nodejs.org/
- **MongoDB**:
  - macOS: `brew install mongodb-community`
  - Ubuntu: `sudo apt-get install mongodb`
  - Windows: Download from https://www.mongodb.com/try/download/community

## Setup Steps (5 minutes)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Email (Important!)

Edit `backend/.env` and update these lines with your email credentials:

```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-app-password-here
```

**For Gmail users:**
1. Enable 2-Factor Authentication
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use that password (not your regular password!)

### 3. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Wait until you see: `Server running on port 5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Wait until you see: `Local: http://localhost:5173`

### 5. Open Your Browser

Navigate to: **http://localhost:5173**

## First Steps in the App

1. **Register** a new account
2. Check your email for the verification link
3. Click the link to verify your account
4. **Create** your first project
5. **Add** participants with their roles
6. **Set** constraints (optional)
7. Click **Optimize Teams** to generate balanced teams!

## Testing Without Email

If you don't want to configure email right away, you can:

1. Comment out the email sending in `backend/src/routes/auth.js`
2. Manually set `isVerified: true` in the database after registration

Or use a test SMTP service like Mailtrap: https://mailtrap.io/

## Common Issues

**Port 5000 already in use:**
```bash
# Kill the process using port 5000
lsof -ti:5000 | xargs kill -9
```

**MongoDB connection error:**
```bash
# Check if MongoDB is running
brew services list  # macOS
sudo systemctl status mongod  # Linux
```

**Can't login after registration:**
- Check email spam folder
- Verify email credentials in `.env`
- Check backend logs for errors

## Development Tips

- Backend runs on: http://localhost:5000
- Frontend runs on: http://localhost:5173
- API endpoints: http://localhost:5000/api/*
- MongoDB: mongodb://localhost:27017/teambuilder

Hot reload is enabled on both frontend and backend!

## Next Steps

See the full [README.md](README.md) for:
- Complete API documentation
- Detailed feature descriptions
- Deployment instructions
- Troubleshooting guide

Happy team building! 🚀
