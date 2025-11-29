let express = require('express');
let mongoose = require('mongoose');
let cors=require('cors');
const patientRouter = require('./App/routes/web/patientRoutes');
const noticeRouter = require('./App/routes/web/noticeRoutes');
const bodyParser=require('body-parser');
const router = require('./App/routes/admin/authRouter');
const prorouter = require('./App/routes/admin/productRouter');
const medicineRouter = require('./App/routes/admin/medicineRouter');
const salesRouter = require('./App/routes/web/salesRoute');
const purchaseRouter = require('./App/routes/web/purchaseRoute');
const closingStockRouter = require('./App/routes/web/closingRoute');
let app = express();
require('dotenv').config();

 
app.use(express.json());
app.use(bodyParser.json())
app.use(cors())
//routes
app.use('/api/website/enquiry', patientRouter);
app.use('/api/website/notice', noticeRouter);
app.use('/auth', router)
app.use('/products', prorouter)
app.use('/medicine', medicineRouter)
app.use('/api/sale', salesRouter);
app.use('/api/purchase', purchaseRouter);
app.use('/api/closing-stock', closingStockRouter);

app.use(cors({
  origin: [
    'https://bhartiyadharohar.in',
    'https://www.bhartiyadharohar.in',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// connect to mongoDB
mongoose.connect(process.env.DBURL).then(()=>{
    console.log('connected to mongodb');
    app.listen(process.env.PORT || 3000, ()=>{
        console.log('server is running');
    });
}).catch((err)=>{console.log(err)}) 