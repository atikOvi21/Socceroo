const passport = require("passport");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();


const cookieExtractor = (req) => {
  return req && req.cookies ? req.cookies.auth_token : null;
};


function initialize(passport) {
  const JwtStrategy = require("passport-jwt").Strategy;
  const ExtractJwt = require("passport-jwt").ExtractJwt;
  const FacebookStrategy = require("passport-facebook").Strategy;
  const GoogleStrategy = require("passport-google-oauth20").Strategy;

  const options = {};
  
  options.jwtFromRequest = ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),      // For tokens sent via headers
    cookieExtractor,                               // For tokens sent via cookies
  ]);
  
  options.secretOrKey = process.env.JWT_SECRET;

  passport.use(
    new JwtStrategy(options, async (jwt_payload, done) => {    
      console.log("jwt payload id->", jwt_payload.id);
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }   
      } catch (err) {
        return done(err, false);
      }
    })
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "/facebook/callback",
        profileFields: ["id", "emails", "name"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ facebookId: profile.id });
          if (user) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1d",
            });
            return done(null, user, { token });
          } else {
            user = new User({
              facebookId: profile.id,
              email: profile.emails[0].value,
              username: `${profile.name.givenName} ${profile.name.familyName}`,
            });
            await user.save();
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1d",
            });
            return done(null, user, { token });
          }
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/google/callback",
      },
      async (token, tokenSecret, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1d",
            });
            return done(null, user, { token });
          } else {
            user = new User({
              googleId: profile.id,
              email: profile.emails[0].value,
              username: profile.displayName,
            });
            await user.save();
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1d",
            });
            return done(null, user, { token });
          }
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
}

module.exports = initialize; 
