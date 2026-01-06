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

// ✅ CRITICAL FIX: CORS MUST BE FIRST, BEFORE ALL MIDDLEWARE
app.use(cors({
  origin: [
    'https://bhartiyadharohar.in',
    'https://www.bhartiyadharohar.in',
    'https://main.d1s4ti04ym0qhc.amplifyapp.com', // Your Amplify URL
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Length'] // ✅ CRITICAL for downloads
}));

// ✅ Body parsers AFTER CORS with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Routes
app.use('/api/website/enquiry', patientRouter);
app.use('/api/website/notice', noticeRouter);
app.use('/auth', router);
app.use('/products', prorouter);
app.use('/medicine', medicineRouter);
app.use('/api/sale', salesRouter);
app.use('/api/purchase', purchaseRouter);
app.use('/api/closing-stock', closingStockRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// MongoDB connection
mongoose.connect(process.env.DBURL).then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(process.env.PORT || 3000, () => {
        console.log(`✅ Server running on port ${process.env.PORT || 3000}`);
    });
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
