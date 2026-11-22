const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const ingestionRoutes = require('./routes/ingestion');
const rulesRoutes = require('./routes/rules');

// Import rule engine initialization
const { initializeSavedRules } = require('./services/compiler');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/nexusflow';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route (defined before router mounts so GET / is always instant and never blocked by DB)
app.get('/', (req, res) => {
  res.json({
    message: 'NexusFlow IoT Rule Engine API is running',
    dbStatus: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
  });
});

// Mount routes
app.use('/api/ingestion', ingestionRoutes);
app.use('/', ingestionRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/', rulesRoutes);

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    // Auto-reload saved active rules from MongoDB into live RxJS pipelines
    await initializeSavedRules();
  })
  .catch((err) => {
    console.warn(`[NexusFlow DB Notice] MongoDB connection error: ${err.message}`);
    console.warn('Set MONGODB_URI in backend/.env to connect to MongoDB Atlas or start a local MongoDB service.');
  });

// Start server
const server = app.listen(PORT, () => {
  console.log(`NexusFlow backend server running on port ${PORT}`);
});

module.exports = app;
