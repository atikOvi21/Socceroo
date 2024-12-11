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


// const passport = require("passport");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// require("dotenv").config();

// function initialize(passport)
// {
//     var JwtStrategy = require("passport-jwt").Strategy,
//     ExtractJwt = require("passport-jwt").ExtractJwt;
//     const FacebookStrategy = require("passport-facebook").Strategy;
//     const GoogleStrategy = require("passport-google-oauth20").Strategy;
//     var options = {};
//     options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
//     options.secretOrKey = process.env.JWT_SECRET;

//     //console.log("jwt payload id->", jwt_payload.id);
//     console.log(process.env.FACEBOOK_CLIENT_ID);

//     passport.use(
//       new JwtStrategy(options, async (jwt_payload, done) => {
//         console.log("jwt payload id->", jwt_payload.id);
//         try {
//           const user = await User.findById(jwt_payload.id);
//           if (user) {
//             return done(null, user);
//           } else {
//             return done(null, false);
//           }
//         } catch (err) {
//           return done(err, false);
//         }
//       })
//     );

//     passport.use(
//       new FacebookStrategy(
//       {
//         clientID: process.env.FACEBOOK_CLIENT_ID,
//         clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//         callbackURL: "/facebook/callback",
//         profileFields: ["id", "emails", "name"]
//       },
//       async (accessToken, refreshToken, profile, done) => {
//         try
//         {
//           let user = await User.findOne({ facebookId: profile.id });
//           console.log("user info fetched from FB->", user);
//           if (user)
//           {
//             const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"});
//             return done(null, user,{token});
//           }
//           else
//           {
//              user = new User({
//               facebookId: profile.id,
//               email: profile.emails[0].value,
//               username: `${profile.name.givenName} ${profile.name.familyName}`
//             });
//             await user.save();
//             return done(null, user, { token });
//           }
//         }
//         catch (err)
//         {
//           return done(err, false);
//         }
//       }
//     ));

//     passport.use(
//       new GoogleStrategy(
//       {
//         clientID: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         callbackURL: "/google/callback"
//       },
//       async (token, tokenSecret, profile, done) => {
//         try {
//           let user = await User.findOne({ googleId: profile.id });
//           if (user) {
//             return done(null, user);
//           } else {
//             const newUser = new User({
//               googleId: profile.id,
//               email: profile.emails[0].value,
//               name: profile.displayName
//             });
//             await newUser.save();
//             return done(null, newUser);
//           }
//         } catch (err) {
//           return done(err, false);
//         }
//       }
//     )
//   );
// }

//     // passport.use(
//     // new JwtStrategy(options, function (jwt_payload, done) {
//     //     User.findOne(jwt_payload.id)
//     //     .then((err, user) =>
//     //     {
//     //     if (err) {
//     //         return done(err, false);
//     //     }
//     //     if (user) {
//     //         return done(null, user);
//     //     } else {
//     //         return done(null, false);
//     //         // or you could create a new account
//     //     }
//     //     });
//     // })
//     // )

// module.exports = initialize ;

// // const passport = require("passport");
// // const JwtStrategy = require("passport-jwt").Strategy;
// // const ExtractJwt = require("passport-jwt").ExtractJwt;
// // const User = require("../models/User");
// // require("dotenv").config();

// // // JWT options
// // const options = {
// //   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
// //   secretOrKey: process.env.JWT_SECRET || "secret",
// // };

// // // Configure Passport JWT Strategy
// // passport.use(
// //   new JwtStrategy(options, jwtCallback)
// // );

// // // JWT callback function
// // const jwtCallback = (jwt_payload, done) => {
// //   // Find User by ID from the mock database
// //   User.findById(jwt_payload.id, (err, user) => {
// //     if (err) {
// //       return done(err, false);
// //     }
// //     if (user) {
// //       return done(null, user);
// //     } else {
// //       return done(null, false);
// //     }
// //   });
// // };
