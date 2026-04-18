# MongoDB Setup Guide for Kramic.sh

This guide will help you set up MongoDB for the Kramic.sh backend.

## Option 1: Local MongoDB Installation (Recommended for Development)

### Windows

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Download the Windows MSI installer
   - Run the installer and follow the setup wizard
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service (recommended)

2. **Verify Installation**
   ```bash
   mongod --version
   ```

3. **Start MongoDB Service**
   - MongoDB should start automatically as a Windows service
   - Or manually start it:
   ```bash
   net start MongoDB
   ```

4. **Connect to MongoDB**
   ```bash
   mongosh
   ```

### macOS

1. **Install using Homebrew**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB**
   ```bash
   brew services start mongodb-community
   ```

3. **Verify Installation**
   ```bash
   mongosh
   ```

### Linux (Ubuntu/Debian)

1. **Import MongoDB GPG Key**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   ```

2. **Add MongoDB Repository**
   ```bash
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   ```

3. **Install MongoDB**
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

4. **Start MongoDB**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

## Option 2: MongoDB Atlas (Cloud - Free Tier Available)

1. **Create Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier (M0 Sandbox)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development)
   - Or add your specific IP address

4. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password
   - Grant "Read and write to any database" role

5. **Get Connection String**
   - Go to "Database" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## Backend Configuration

1. **Update .env file**
   
   For local MongoDB:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=kramic_db
   ```
   
   For MongoDB Atlas:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   DATABASE_NAME=kramic_db
   ```

2. **Install Python Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Seed the Database**
   ```bash
   python seed_mongodb.py
   ```
   
   This will create:
   - 4 sample students with different karma levels
   - 2 sample clients
   - 6 sample tasks (various difficulties)
   - Karma events history

4. **Start the Backend Server**
   ```bash
   python run.py
   ```

## Verify Setup

1. **Check MongoDB Connection**
   ```bash
   mongosh
   use kramic_db
   show collections
   db.users.countDocuments()
   ```

2. **Test API**
   - Visit: http://localhost:8000/docs
   - Try the `/api/auth/login` endpoint with test credentials
   - Email: `alice@example.com`
   - Password: `password123`

## MongoDB GUI Tools (Optional)

### MongoDB Compass (Official GUI)
- Download: https://www.mongodb.com/products/compass
- Connect using: `mongodb://localhost:27017`

### Studio 3T (Advanced)
- Download: https://studio3t.com/download/
- Free for non-commercial use

## Common Issues

### Issue: "Connection refused"
**Solution:** Make sure MongoDB service is running
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Issue: "Authentication failed"
**Solution:** Check your MongoDB connection string and credentials in `.env`

### Issue: "Database not found"
**Solution:** Run the seed script to create the database and collections
```bash
python seed_mongodb.py
```

## Database Collections

After seeding, you'll have these collections:

- **users** - Students and clients
- **tasks** - Work posted by clients
- **task_submissions** - Student submissions
- **task_applications** - Student applications for tasks
- **karma_events** - Karma history
- **sprint_sessions** - Squad sprint sessions
- **referral_requests** - Referral requests

## Migration from SQLite

If you were using SQLite before, your old data is in `kramic.db`. The MongoDB setup is a fresh start with the new schema. To migrate:

1. Export data from SQLite (if needed)
2. Transform to MongoDB format
3. Import using the seed script or custom migration script

## Production Considerations

For production deployment:

1. **Use MongoDB Atlas** or managed MongoDB service
2. **Enable authentication** on local MongoDB
3. **Use connection pooling** (already configured in Motor)
4. **Set up backups** (Atlas has automatic backups)
5. **Monitor performance** using MongoDB Atlas monitoring
6. **Use environment variables** for all credentials
7. **Enable SSL/TLS** for connections

## Resources

- MongoDB Documentation: https://docs.mongodb.com/
- Motor (Async Driver): https://motor.readthedocs.io/
- Beanie ODM: https://beanie-odm.dev/
- MongoDB University (Free Courses): https://university.mongodb.com/
