
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db");
const PORT = process.env.port || 5000;
const authRoutes =  require('./routes/authRoutes');
require("dotenv").config();
const isAuth = require('./middleware/auth.middleware');
const passport = require('passport');
require('./config/passport')(passport);
const fieldRoutes = require('./routes/fieldRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { report } = require('process');
const reportRoutes = require('./routes/reportRoutes');
//db connection
connectDB();


//middleware
app.use(cors());
app.use(bodyParser.json({ extended: false }));
app.use(express.static(path.join(__dirname, 'uploads'))); // Corrected static file serving




app.use(cookieParser());


//passport middleware
app.use(passport.initialize());


app.get("/", (req, res) => {
  console.log(req.cookies.auth_token);      
  res.send("Hello World");
});

app.use(authRoutes);
app.use('/fields', fieldRoutes);
app.use("/bookings", bookingRoutes);
app.use('/reports', reportRoutes);

//passport middleware
// app.use(session({
//     secret:process.env.SESSION_SECRET,
//     resave:false,
//     saveUninitialized:false
//     })
// );

// app.use(passport.session());


//routes
//app.get('/auth', authRoutes);
app.get('/dashboard',  isAuth, (req, res) => {
    res.send('Dashboard');
});

app.get('/protected', isAuth, (req, res) => {
    console.log('User->',req.user);
    res.send('Protected route');
});

app.get('/', (req, res) => {
    res.send('Hello World');
});


 
//production script
// app.use(express.static("./client/build"))
// app.get("*", (req,res)=>{
//     res.sendFile(path.resolve(__dirname,"client","build","index.html"))
// })


//listen  
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    }
);
