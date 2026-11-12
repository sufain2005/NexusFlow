const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const ingestionRoutes = require('./routes/ingestion');

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

// Routes
app.use('/api/ingestion', ingestionRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: 'NexusFlow IoT Rule Engine API is running',
    dbStatus: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
  });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Connected to MongoDB successfully');
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
