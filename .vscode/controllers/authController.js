const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.register = async (req, res, next) => 
{
  console.log(req.body);
  console.log("Registering user");
  try 
  {
    const { email, password , username } = req.body;
    const errors = [];
    if ( !email || !password) 
    {
      errors.push("All fields are required!");
      return res.status(400).json({ message: "All fields are required" });
    }
    

    User.findOne({email:email}).then((user) => 
    {
        if (user) 
        {
            errors.push("User already exists with this email!");
            res.status(400).json({ error: errors });
        }
        else 
        {
            bcrypt.genSalt(10, (err, salt) => {
            if (err) 
            {
                errors.push(err);
                res.status(400).json({ error: errors });
            } 
            else {
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                errors.push(err);
                res.status(400).json({ error: errors });
                } else {
                const newUser = new User({
                    username : username || email,
                    email,
                    password: hash,
                });

                newUser
                    .save()
                    .then(() => {
                    console.log("User registered successfully");
                    res.redirect("/login");
                    })
                    .catch(() => {
                    errors.push("Please try again");
                    res.status(400).json({ error: errors });
                    });
                }
            });
            }
        });
        }
    });
  }
  catch (err) 
  {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });
    
    if (!user) 
    {
      return res.status(400).json({ message: "User does not exist" });
    }

     
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log("User->",password,"---", user.password);
      return res.status(400).json({ message: "Invalid credentials" });
    }

     
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
});
exports.googleCallback = (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.redirect(`/dashboard?token=${token}`);
};

exports.logout = (req,res)=>{
  req.logout();
  res.redirect('/');
}