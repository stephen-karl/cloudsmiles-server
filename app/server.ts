import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { useGoogleStrategy } from './configs/passport.config';
import connectToMongo from './configs/mongo.config';
// routes
import agentRoute from './routes/agent.route'
import authRoute from './routes/auth.route'
import paymentRoute from './routes/payment.route'
import stockRoute from './routes/stock.route'
import treatmentRoute from './routes/treatment.route'
import staffRoute from './routes/staff.route'
import appointmentRoute from './routes/appointment.route'
import patientRoute from './routes/patient.route'
import vendorRoute from './routes/vendor.route'
import dashboardRoute from './routes/dashboard.route'
import profileRoute from './routes/profile.route';
import reviewRoute from './routes/review.route';
// auths
import passport from 'passport'
import session from 'express-session'
import cookieParser from 'cookie-parser';





dotenv.config();

const app = express();
const port = process.env.PORT || 3000;



connectToMongo()

// auth
useGoogleStrategy()
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


app.use(bodyParser.json({limit: "30mb"}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));

// guest
app.use('/agent/v1', agentRoute)
app.use('/auth/v1', authRoute)  

// admin
app.use('/payment/v1', paymentRoute)  
app.use('/stock/v1', stockRoute)
app.use('/treatment/v1', treatmentRoute,)
app.use('/staff/v1', staffRoute,)
app.use('/appointment/v1', appointmentRoute,)
app.use('/patient/v1', patientRoute)
app.use('/vendor/v1', vendorRoute)
app.use('/dashboard/v1', dashboardRoute)
app.use('/profile/v1', profileRoute)
app.use('/review/v1', reviewRoute)

