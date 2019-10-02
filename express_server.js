const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//global variable, used to store and access users in the app
let users = { };

//generates the short URL string of 6 chars
let generateID = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    randomString += alphaNum[Math.floor(Math.random() * Math.floor(alphaNum.length))];
  } return randomString;
};

// checks if the user is present in the database
let validateUser = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  } return false;
};

//registers the user (handles registration form data)
app.post('/register', function(req, res) {
  const newUserID = generateID();
  if (!req.body.email || !req.body.password) { //ensures fields are not empty, else error 400
    res.status(400);
    res.send("Error 400: Please enter an email and password");
  } else if (validateUser(req.body.email)) {
    res.send("Already registered");
  } else {
    users[newUserID] = {id: newUserID, email: req.body.email, password: req.body.password};
    res.cookie("user_id", newUserID);
    res.redirect("/urls");
  }
});

//renders register template
app.get('/register', function(req, res) {
  let templateVars = { urls: urlDatabase, user:users[req.cookies["user_id"]] };
  res.render("user_registration", templateVars);
});

app.post('/login/', function(req, res) {
  if (!req.body.email || !req.body.password) { //ensures fields are not empty, else error 400
    res.status(400).send("Error 400: Please enter an email and password");
  } else if (!validateUser(req.body.email)) {
    res.status(403).send("Error 403: Email does not exist");
  } else if (validateUser(req.body.email) && req.body.password !== users[validateUser(req.body.email)].password) {
    res.status(403).send("Error 403: Email and password do not match");
  } else {
    res.cookie("user_id", validateUser(req.body.email));
    res.redirect("/urls");
  }
});

//renders the user log-in page
app.get('/login/', function(req, res) {
  let templateVars = { urls: urlDatabase, user:users[req.cookies["user_id"]] };
  res.render("user_login", templateVars);
});

app.get('/logout', function(req, res) {
  res.clearCookie("user_id");
  res.redirect('/urls');
});

// used to keep track of all the URLs and their shortened forms
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// main page
app.get("/", (req, res) => {
  res.send("Hello!");
});

// lists all the existing short URLs saved to the database
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

// page creates a new short URL
app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//page shows the longURL and its short URL (and edit)
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user:users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

// adds new short URL to database
app.post("/urls", (req, res) => {
  let newID = generateID();
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`/urls/${newID}`);
});

// redirects from short URL to URL page
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

// keep the short URL, edit the long URL
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

//deletes existing URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});