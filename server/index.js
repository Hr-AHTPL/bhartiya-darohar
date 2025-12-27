let express = require('express');
let mongoose = require('mongoose');
let cors = require('cors');
const patientRouter = require('./App/routes/web/patientRoutes');
const noticeRouter = require('./App/routes/web/noticeRoutes');
const bodyParser = require('body-parser');
const router = require('./App/routes/admin/authRouter');
const prorouter = require('./App/routes/admin/productRouter');
const medicineRouter = require('./App/routes/admin/medicineRouter');
const salesRouter = require('./App/routes/web/salesRoute');
const purchaseRouter = require('./App/routes/web/purchaseRoute');
const closingStockRouter = require('./App/routes/web/closingRoute');
let app = express();
require('dotenv').config();

// ✅ FIXED: Proper CORS configuration (only once!)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://bhartiyadharohar.in',
      'https://www.bhartiyadharohar.in',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'], // ✅ Important for file downloads
  maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// ✅ Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '50mb' })); // ✅ Increased limit for large requests
app.use(bodyParser.json({ limit: '50mb' }));

// ✅ Add error handling middleware for better debugging
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Set CORS headers even on errors
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Routes
app.use('/api/website/enquiry', patientRouter);
app.use('/api/website/notice', noticeRouter);
app.use('/auth', router);
app.use('/products', prorouter);
app.use('/medicine', medicineRouter);
app.use('/api/sale', salesRouter);
app.use('/api/purchase', purchaseRouter);
app.use('/api/closing-stock', closingStockRouter);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Connect to MongoDB with better error handling
mongoose.connect(process.env.DBURL, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
