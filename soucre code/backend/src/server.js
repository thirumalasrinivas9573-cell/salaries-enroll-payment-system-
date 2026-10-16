require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/apiRoutes');
const { BIN_PATH } = require('./services/cppEngineBridge');
const { connectDB, checkDbConnection, isDbConnected } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check middleware
app.use('/api', checkDbConnection);

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File size exceeds maximum permitted limit (5MB).' });
    }
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: messages.join(' ') });
  }
  if (err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error occurred.' });
});

// Health check endpoint verifying MongoDB and C++ Engine availability
app.get('/api/health', (req, res) => {
  const cppEngineReady = fs.existsSync(BIN_PATH);
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'MongoDB Atlas Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    status: dbState === 1 ? 'online' : 'degraded',
    appName: 'Salary Enroll Pay System API',
    cppEngine: {
      ready: cppEngineReady,
      binaryPath: BIN_PATH
    },
    database: {
      status: dbStatusMap[dbState] || 'Unknown',
      readyState: dbState,
      name: mongoose.connection.name || 'salary_enroll_pay',
      host: mongoose.connection.host || 'remote-cluster'
    },
    timestamp: new Date().toISOString()
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Salary Enroll Pay System Backend API (MongoDB Atlas & C++17 Engine)',
    version: '2.0.0',
    documentation: '/api/health'
  });
});

// Start server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=================================================================`);
      console.log(`  SALARY ENROLL PAY SYSTEM BACKEND API READY                      `);
      console.log(`  Port: http://localhost:${PORT}                                  `);
      console.log(`  Database: MongoDB Atlas (${mongoose.connection.name})          `);
      console.log(`  C++ Engine Binary: ${BIN_PATH}                                  `);
      console.log(`  Engine Status: ${fs.existsSync(BIN_PATH) ? '✓ READY' : '✗ NOT FOUND'}     `);
      console.log(`=================================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to start server due to database connection error:', err.message);
    process.exit(1);
  }
}

startServer();
