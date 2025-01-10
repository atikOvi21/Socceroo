const express = require("express");
const { register, login } = require("../controllers/authController");
const passport = require("passport");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

//get
router.get("/register", (req, res) => {
  res.send("Hello World");
});
router.get("/login", (req, res) => {
  res.send("Login page");
});



// Facebook authentication routes
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback", (req, res, next) => {
  passport.authenticate("facebook", (err, user, info) => {
    if (err || !user) {
      console.error("Authentication failed:", err || "No user found");
      return res.redirect("/login?error=authentication_failed");
    }

    // Directly generate the token if not already provided in `info`
    const token = info?.token || jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d", // Token valid for 1 day
    });

    // Securely send the token to the client
    res.cookie("auth_token", token, {
      httpOnly: true, // Prevent access from client-side JavaScript
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // Token expiry in ms (1 day)
    });

    // Redirect to the dashboard or return the token (if using SPA)
    return res.redirect("/dashboard");
  })(req, res, next);
});
router.get("/facebook/callback", (req, res, next) => {
  passport.authenticate("facebook", (err, user, info) => {
    if (err || !user) {
      console.error("Authentication failed:", err || "No user found");
      return res.redirect("/login?error=authentication_failed");
    }

    // Directly generate the token if not already provided in `info`
    const token =
      info?.token ||
      jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d", // Token valid for 1 day
      });

     
    res.cookie("auth_token", token, {
      httpOnly: true,                               // Prevent access from client-side JavaScript
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      maxAge: 24 * 60 * 60 * 1000,                  // Token expiry in ms (1 day)
    });

     
    return res.redirect("/dashboard");
  })(req, res, next);
});


// Google authentication routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
  res.redirect("/dashboard");
});

module.exports = router;
