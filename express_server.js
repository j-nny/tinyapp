const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
// helper functions:
const { generateID, getUserByEmail, userURLs } = require("./helpers.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["user_id"]
}));

// used to keep track of all the URLs and their shortened forms
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "blank" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "blank" }
};

//global variable, used to store and access users in the app
let users = {  };

//registers the user (handles registration form data)
app.post("/register", function(req, res) {
  const newUserID = generateID();
  if (!req.body.email || !req.body.password) { //ensures fields are not empty, else error 400
    res.status(400).send("Oops! Please enter an email and password :) <a href='/urls/'>Register</a>");
  } else if (getUserByEmail(req.body.email, users)) {
    res.send("Hey! We're already friends, just log in! :)");
  } else {
    users[newUserID] = {id: newUserID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10)};
    req.session.user_id = newUserID;
    res.redirect("/urls");
  }
});

//renders register template
app.get('/register', function(req, res) {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  res.render("user_registration", templateVars);
});

app.post('/login', function(req, res) {
  if (!req.body.email || !req.body.password) { //ensures fields are not empty, else error 400
    res.status(400).send("Oops! Please enter an email and password :)");
  } else if (!getUserByEmail(req.body.email, users)) {
    res.status(403).send("Looks like we're not friends yet :( This email does not exist, please register!");
  } else if (getUserByEmail(req.body.email, users) && bcrypt.compareSync(req.body.password, bcrypt.hashSync(users[getUserByEmail(req.body.email, users)].password, 10))) {
    res.status(403).send("Oops! Password and email do not match!");
  } else {
    req.session.user_id = getUserByEmail(req.body.email, users);
    res.redirect("/urls");
  }
});

//renders the user log-in page
app.get('/login/', function(req, res) {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  res.render("user_login", templateVars);
});

app.get("/logout", function(req, res) {
  req.session = null;
  res.redirect('/urls');
});

// main page
app.get("/", (req, res) => {
  let templateVars = { urls: userURLs(req.session.user_id, urlDatabase), user: users[req.session.user_id] };
  if (templateVars.user === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// lists all the existing short URLs saved to the database
app.get("/urls", (req, res) => {
  let templateVars = { urls: userURLs(req.session.user_id, urlDatabase), user: users[req.session.user_id] };
  if (templateVars.user === undefined) {
    res.status(403).send("Well this is embarassing, I have a bad memory... Could you please <a href='/login'>log in</a>?");
  } else {
    res.render("urls_index", templateVars);
  }
});

// renders creates the new short URL page
app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  if (templateVars.user === undefined) {
    res.redirect("/login");
  // } else if (req.params.longURL === undefined) {
  //   res.status(403).send("That can't get any tinier! Please enter a URL!");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//renders page showing user's URLs
app.get("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.status(403).send("Well this is embarassing, I have a bad memory... Could you please log in?");
  } else if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(403).send("This is a little sad... this TinyURL does not exist!");
  } else if (users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("Looks like this page isn't for you, but you can have your own TinyURL ;)");
  } else {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user:users[req.session.user_id] };
    res.render("urls_show", templateVars);
  }
});

// adds new short URL to database
app.post("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  let newShortURL = generateID();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: templateVars.user.id};
  res.redirect(`/urls/${newShortURL}`);
});

// redirects from short URL to URL page
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// keep the short URL, edit the long URL
app.post("/urls/:shortURL", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  if (templateVars.user) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).send("Looks like this page isn't for you, but you can have your own TinyURL ;)");
  }
});

//deletes existing URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  if (templateVars.user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Looks like this page isn't for you, but you can have your own TinyURL ;)");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});