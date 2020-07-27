const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
// helper functions:
const {
  areValidEmailPassword,
  generateID,
  getUserByEmail,
  hashPassword,
  userURLs,
  emailExists,
} = require("./helpers.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["user_id"],
  }),
);
app.use(methodOverride("_method"));

// used to keep track of all the URLs and their shortened forms
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "dummy" },
  icon: {
    longURL:
      "https://i.pinimg.com/originals/b9/3f/80/b93f8070c4178d1906198e264cb4c98f.png",
    userID: "dummy",
  },
};

//global variable, used to store and access users in the app
const users = {};

// Create an endpoint that renders an error info page.
app.get("/errors/:statusCode", (req, res) => {
  templateVars = {
    statusCode: req.params.statusCode,
    user: req.session.id,
  };
  res.render("url_errors", templateVars);
});

//registers the user (handles registration form data)
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    // errors if fields are empty
    res.status(406).redirect("/errors/406");
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(409).redirect("/errors/409");
  } else {
    const newUserID = generateID();
    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: hashPassword(req.body.password),
    };
    req.session.user_id = newUserID;
    res.redirect("/urls");
  }
});

//renders register template
app.get("/register", (req, res) => {
  const templateVars = { user: req.session.user_id };
  res.render("user_registration", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (
    emailExists(users, email) &&
    areValidEmailPassword(users, email, password)
  ) {
    // set the cookie
    req.session.user_id = getUserByEmail(req.body.email, users);
    res.redirect("/urls");
  } else {
    res.status(400).redirect("/errors/400");
  }
});

//renders the user log-in page
app.get("/login/", (req, res) => {
  let templateVars = { user: req.session.user_id };
  res.render("user_login", templateVars);
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// main page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// lists all the existing short URLs saved to the database
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  !user_id
    ? res.redirect("/login")
    : res.render("urls_index", {
        urls: userURLs(user_id, urlDatabase),
        user: users[user_id],
      });
});

// renders creates the new short URL page
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  !user_id
    ? res.redirect("/login")
    : res.render("urls_new", {
        urls: urlDatabase,
        user: users[user_id],
      });
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

//renders page showing user's URLs
app.get("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res
      .status(403)
      .send(
        "Tiny Dumpling does not know who you are! Please <a href='/login'>log in</a>!",
      );
  } else if (urlDatabase[req.params.shortURL] === undefined) {
    res
      .status(403)
      .send(
        "This is a little sad... this TinyURL does not exist! <a href='/urls/new'>Create a new one!</a>",
      );
  } else if (
    users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID
  ) {
    res
      .status(403)
      .send(
        "Looks like this page isn't for you, but you can have <a href='/urls/new'>your own TinyURL</a> ;)",
      );
  } else {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.user_id],
      timestamp: urlDatabase[req.params.shortURL].timestamp,
    };
    res.render("urls_show", templateVars);
  }
});

// adds new short URL to database
app.post("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  let newShortURL = generateID();
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: templateVars.user.id,
    timestamp: Date(Date.now()).toLocaleString(),
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${newShortURL}`);
});

// redirects from short URL to URL page
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// keep the short URL, edit the long URL
app.post("/urls/:shortURL", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  if (templateVars.user) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res
      .status(403)
      .send(
        "Looks like this page isn't for you, but you can have <a href='/urls/new'>your own TinyURL</a> ;)",
      );
  }
});

//deletes existing URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  if (templateVars.user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res
      .status(403)
      .send(
        "Looks like this page isn't for you, but you can have <a href='/urls/new'>your own TinyURL</a> ;)",
      );
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
