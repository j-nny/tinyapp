const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
// helper functions:
const { generateID, getUserByEmail, userURLs } = require("./helpers.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["user_id"]
}));
app.use(methodOverride('_method'));

// used to keep track of all the URLs and their shortened forms
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "dummy" },
  "icon": { longURL: "https://i.pinimg.com/originals/b9/3f/80/b93f8070c4178d1906198e264cb4c98f.png", userID: "dummy" }
};

//global variable, used to store and access users in the app
let users = {  };

//registers the user (handles registration form data)
app.post("/register", function(req, res) {
  const newUserID = generateID();
  if (!req.body.email || !req.body.password) {
    // errors if fields are empty
    res.status(400).send("Oops! Please enter an email and password :) <a href='/urls/'>Register</a>");
  } else if (getUserByEmail(req.body.email, users)) {
    res.send("Hey! We're already friends, just <a href='/login'>log in! :)</a>");
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
  if (!req.body.email || !req.body.password) {
    // errors if fields are empty
    res.status(400).send("Oops! Please enter an email and password :) <a href='/login'>Login</a>");
  } else if (getUserByEmail(req.body.email, users) === undefined) {
    // errors if user is not registered
    res.status(403).send("Looks like we're not friends yet :( This email does not exist, please <a href='/register'>register!</a>");
  } else if (getUserByEmail(req.body.email, users) && !bcrypt.compareSync(req.body.password, users[getUserByEmail(req.body.email, users)].password)) {
    // errors if user is registered and passwords do not match
    res.status(403).send("Oops! Password and email do not match! <a href='/login'>Login</a>");
  } else if (getUserByEmail(req.body.email, users) && bcrypt.compareSync(req.body.password, users[getUserByEmail(req.body.email, users)].password)) {
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
    res.status(403).send("I can't show you this yet! Please <a href='/login'>log in</a>!");
  } else {
    res.render("urls_index", templateVars);
  }
});

// renders creates the new short URL page
app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  if (templateVars.user === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World</body></html>\n");
});

//renders page showing user's URLs
app.get("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.status(403).send("I can't show you this yet! Please <a href='/login'>log in</a>!");
  } else if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(403).send("This is a little sad... this TinyURL does not exist! <a href='/urls/new'>Create a new one!</a>");
  } else if (users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("Looks like this page isn't for you, but you can have <a href='/urls/new'>your own TinyURL</a> ;)");
  } else {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user:users[req.session.user_id] };
    res.render("urls_show", templateVars);
  }
});

// adds new short URL to database
app.post("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  let newShortURL = generateID();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: templateVars.user.id, timestamp: Date(Date.now()).toString()};
  console.log(urlDatabase);
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
    res.status(403).send("Looks like this page isn't for you, but you can have <a href='/urls/new'>your own TinyURL</a> ;)");
  }
});

//deletes existing URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  let templateVars = { urls: urlDatabase, user:users[req.session.user_id] };
  if (templateVars.user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Looks like this page isn't for you, but you can have <a href='/urls/new'>your own TinyURL</a> ;)");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});