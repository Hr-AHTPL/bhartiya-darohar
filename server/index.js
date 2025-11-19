const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import your routes
const patientRouter = require('./App/routes/web/patientRoutes');
const noticeRouter = require('./App/routes/web/noticeRoutes');
const router = require('./App/routes/admin/authRouter');
const prorouter = require('./App/routes/admin/productRouter');
const medicineRouter = require('./App/routes/admin/medicineRouter');
const salesRouter = require('./App/routes/web/salesRoute');
const purchaseRouter = require('./App/routes/web/purchaseRoute');
const closingStockRouter = require('./App/routes/web/closingRoute');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API Routes
app.use('/api/website/enquiry', patientRouter);
app.use('/api/website/notice', noticeRouter);
app.use('/auth', router);
app.use('/products', prorouter);
app.use('/medicine', medicineRouter);
app.use('/api/sale', salesRouter);
app.use('/api/purchase', purchaseRouter);
app.use('/api/closing-stock', closingStockRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DBURL);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
    setTimeout(connectDB, 5000);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});