
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

//db connection
connectDB();


//middleware
app.use(cors());
app.use(bodyParser.json({ extended: false }));
app.use(express.static("public"));


app.use(cookieParser());


//passport middleware
app.use(passport.initialize());


app.get("/", (req, res) => {
  console.log(req.cookies.auth_token);      
  
});

app.use(authRoutes);
app.use('/fields', fieldRoutes)
app.use("/bookings", bookingRoutes);


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


//lightsOutandTheyKnowwhoYouAre



//listen  
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    }
);
