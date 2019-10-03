const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["user_id"]
}))

//global variable, used to store and access users in the app
let users = { };

// used to keep track of all the URLs and their shortened forms
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "blank" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "blank" }
};

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

let userURLs = function(user) {
  let userDatabase = { }
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === user) {
      userDatabase[url] = {longURL: urlDatabase[url].longURL, userID: user}
    }
  }
  return userDatabase
}

//registers the user (handles registration form data)
app.post('/register', function(req, res) {
  const newUserID = generateID();
  if (!req.body.email || !req.body.password) { //ensures fields are not empty, else error 400
    res.status(400);
    res.send("Error 400: Please enter an email and password");
  } else if (validateUser(req.body.email)) {
    res.send("Already registered");
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
    res.status(400).send("Error 400: Please enter an email and password");
  } else if (!validateUser(req.body.email)) {
    res.status(403).send("Error 403: Email does not exist");
  } else if (validateUser(req.body.email) && bcrypt.compareSync(req.body.password, bcrypt.hashSync(users[validateUser(req.body.email)].password, 10))) {
    res.status(403).send("Error 403: Email and password do not match");
  } else {
    req.session.user_id = validateUser(req.body.email);
    res.redirect("/urls");
  }
});

//renders the user log-in page
app.get('/login/', function(req, res) {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  res.render("user_login", templateVars);
});

app.get('/logout', function(req, res) {
  req.session = null;
  res.redirect('/urls');
});

// main page
app.get("/", (req, res) => {
  res.send("Hello!");
});

// lists all the existing short URLs saved to the database
app.get("/urls", (req, res) => {
  let templateVars = { urls: userURLs(req.session.user_id), user: users[req.session.user_id] };
  if (templateVars.user === undefined) {
    res.redirect("/login")
  } else {
    // console.log("USERID", req.cookies["user_id"])
    // console.log("USERURLS", userURLs(req.cookies["user_id"]))
    // console.log("ALLURLS", urlDatabase);
    res.render("urls_index", templateVars);
  }
});

// renders creates the new short URL page
app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  if (templateVars.user === undefined) {
    res.redirect("/login")
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
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user:users[req.session.user_id] };
  res.render("urls_show", templateVars);
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
  console.log("USHORTURL", req.params.shortURL)
  console.log(urlDatabase[req.params.shortURL].longURL)
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// keep the short URL, edit the long URL
app.post("/urls/:shortURL", (req, res) => {
  if (user) {
    urlDatabase[req.params.shortURL] = req.body.longURL;
    res.redirect("/urls");
  }
});

//deletes existing URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  if (user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});