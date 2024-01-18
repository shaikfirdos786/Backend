import "dotenv/config";
import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";

const app = express();
const port = 3000;
const saltRounds = process.env.SALT_ROUNDS;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
); 
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await db.query("SELECT * FROM users WHERE email = $1", [
          email,
        ]);

        if (user.rows.length === 1) {
          const userPassword = user.rows[0].password;

          bcrypt.compare(password, userPassword, function (err, result) {
            if (err) {
              return done(err);
            }
            if (result === true) {
              return done(null, user.rows[0]);
            } else {
              return done(null, false, { message: "Invalid password" });
            }
          });
        } else {
          return done(null, false, { message: "Invalid user" });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  // You can use either email or facebook_id for serialization
  done(null, user.facebook_id || user.email);
});

passport.deserializeUser(async (identifier, done) => {
  try {
    // Query the database based on the identifier (email or facebook_id)
    const user = await db.query(
      "SELECT * FROM users WHERE facebook_id = $1 OR email = $2",
      [identifier, identifier]
    );
    done(null, user.rows[0]);
  } catch (err) {
    done(err);
  }
});


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        const existingUser = await db.query(
          "SELECT * FROM users WHERE google_id = $1",
          [profile.id]
        );

        if (existingUser.rows.length > 0) {
          // If the user already exists, return the user
          return done(null, existingUser.rows[0]);
        } else {
          // If the user doesn't exist, create a new user
          const newUser = await db.query(
            "INSERT INTO users(email, google_id) VALUES($1, $2) RETURNING *",
            [profile.emails[0].value, profile.id]
          );

          return done(null, newUser.rows[0]);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/secrets",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        const existingUser = await db.query(
          "SELECT * FROM users WHERE facebook_id = $1",
          [profile.id]
        );

        if (existingUser.rows.length > 0) {
          // If the user already exists, return the user
          return done(null, existingUser.rows[0]);
        } else {
          // If the user doesn't exist, create a new user
          const newUser = await db.query(
            "INSERT INTO users(email, facebook_id) VALUES($1, $2) RETURNING *",
            [
              profile.emails && profile.emails.length > 0
                ? profile.emails[0].value
                : profile.displayName,
              profile.id,
            ]
          );

          return done(null, newUser.rows[0]);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Routes

app.get("/", (req, res) => {
  res.render("home", { user: req.user });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    // Check if the user already exists in the database
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("User already exists!");
      return res.redirect("/login"); // Redirect to login page or handle as needed
    }

    // If the user doesn't exist, create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const insert = await db.query(
      "INSERT INTO users(email, password) VALUES($1, $2) RETURNING *",
      [email, hashedPassword]
    );

    console.log("Successfully registered!");
    res.redirect("/login"); // Redirect to the login page after successful registration
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/secrets", async (req, res) => {
  const secrets = await db.query("SELECT * FROM secrets");
  console.log(secrets.rows);
  res.render("secrets", {userSecrets: secrets.rows});
});

app.get("/submit" , (req , res)=>{
  if (req.isAuthenticated()) {
    res.render("submit", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async (req, res) => {
  if(req.isAuthenticated()) {
    const submittedSecret = req.body.secret;

    try {
      console.log(req.user.id);
      const insertSecret = await db.query(
        "INSERT INTO secrets(secret, user_id) VALUES($1, $2)",
        [submittedSecret, req.user.id]
      );
      res.redirect("/secrets");
    } catch (err) {
      console.log(err);
    }
  }else {
    res.redirect("/login");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful Google authentication
    res.redirect("/secrets");
  }
);

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
