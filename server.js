const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();

// JWT
// const bcrypt = require("bcrypt");
// const crypto = require("crypto");
// const { fromBase64 } = require("base64url");

const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
  PORT = 3000,
  NODE_ENV = "development",
  SESS_NAME = "sid",
  SESS_SECRET = "ssh! quiet,it's a secret!",
  SESS_LIFETIME = TWO_HOURS
} = process.env;

const IN_PROD = NODE_ENV === "production";

// Hash password (for db)
// const hash = bycrypt.hash;
// const hashedPassword = await hash(password, 10);
// TO DO : Users Mongo
const users = [
  { id: 1, name: "Alex", email: "alex@gmail.com", password: "secret" },
  { id: 2, name: "Max", email: "max@gmail.com", password: "secret" },
  { id: 3, name: "Sara", email: "sara@gmail.com", password: "secret" }
];

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(
  session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
      maxAge: SESS_LIFETIME,
      sameSite: true, // 'strict'
      secure: IN_PROD
      // HttpOnly ?
    }
  })
);

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
};

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect("/home");
  } else {
    next();
  }
};

app.use((req, res, next) => {
  const { userId } = req.session;
  if (userId) {
    res.locals.user = users.find(user => user.id === userId);
  }
  next();
});

app.get("/", (req, res) => {
  const { userId } = req.session;
  res.send(`
    <h1>Welcome</h1>
    ${
      userId
        ? `
    <a href='/home'>Home</a>
    <form method='post' action='/logout'>
        <button>Logout</button>
    </form>
    `
        : `
    <a href='/login'>Login</a>
    <a href='/register'>Register</a>
    `
    }
    `);
});

app.get("/home", redirectLogin, (req, res) => {
  const { user } = res.locals;
  res.send(`
    <h1>Home</h1>
    <a href='/'>Main</a>
    <ul>
      <li>Name: ${user.name}</li>
      <li>Email: ${user.email} </li>
    </ul>
  `);
});

app.get("/profile", redirectLogin, (req, res) => {
  const { user } = res.locals;
});

app.get("/login", redirectHome, (req, res) => {
  res.send(
    `
    <h1>Login</h1>
    <form method='post' action='/login'>
      <input type='email' name='email' placeholder='Email' required />
      <input type='password' name='password' placeholder='Password' required />
      <input type='submit' />
    </form>
    <a href='/register' />Register</a>
    `
  );
});

app.get("/register", redirectHome, (req, res) => {
  res.send(
    `
    <h1>Register</h1>
    <form method='post' action='/register'>
      <input name='name' placeholder='Name' required />
      <input type='email' name='email' placeholder='Email' required />
      <input type='password' name='password' placeholder='Password' required />
      <input type='submit' />
    </form>
    <a href='/login'/>Login</a>
    `
  );
});

app.post("/login", redirectHome, (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    const user = users.find(
      user => user.email === email && user.password === password // To Do : hash
    );
    if (user) {
      req.session.userId = user.id;
      return res.redirect("/home");
    }
  }
  res.redirect("/login");
});

app.post("/register", redirectHome, (req, res) => {
  const { name, email, password } = req.body;

  // Generate the authentification token
  // const fromBase64 = base64 =>
  // base64
  //   .replace(/=/g, "")
  //   .replace(/\+/g, "-")
  //   .replace(/\//g, "_");

  // const token = await new Promise((resolve, reject) => {
  // crypto.randomBytes(16, (error, data) => {
  //   error ? reject(error) : resolve(fromBase64(data.toString("base64")));
  // });
  // });

  // const hashedToken = crypto
  // .createHash("sha256")
  // .update(token)
  // .digest("base64");

  // return or insert somewhere the authentification token
  //

  if (name && email && password) {
    // TODO validation
    const exists = users.some(user => user.email === email);

    if (!exists) {
      const user = {
        id: users.length + 1,
        name,
        email,
        password // TODO: hash
      };

      users.push(user);
      req.session.userId = user.id;
      return res.redirect("/home");
    }
  }
  res.redirect("/register"); // ToDo error handling
});

app.post("/logout", redirectLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect("/home");
    }
    res.clearCookie(SESS_NAME);
    res.redirect("/login");
  });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
