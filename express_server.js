const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//global variable, used to store and access users in the app
let users = { }

//generates the short URL string of 6 chars
function generateRandomString() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    randomString += alphaNum[Math.floor(Math.random() * Math.floor(alphaNum.length))]
  } return randomString;
}

// checks if the user is present in the database
function validateUser(email, pass) {
  for (let user in users) {
    console.log(users[user]);
    if (users[user].email === email && users[user].password === pass) {
      return users[user].id;
    }
  } return false;
}

//registers the user (handles registration form data)
app.post('/register', function (req, res) {
  let templateVars = { urls: urlDatabase, users:req.cookies["user_id"] };
  const newUserID = generateRandomString();
  if(!req.body.email || !req.body.password) { //ensures fields are not empty, else error 400
    res.status(400);
    res.send("Error 400: Please enter an email and password")
  } else if (validateUser(req.body.email, req.body.password)) {
    res.send("Already registered")
  } else {
    users[newUserID] = {id: newUserID, email: req.body.email, password: req.body.password}
    res.cookie("user_id", newUserID)
    res.redirect("/urls", templateVars, users)
  }  
});  

//creates register template
app.get('/register', function (req, res) {
  let templateVars = { urls: urlDatabase, users:req.cookies["user_id"] };
  res.render("user_registration", templateVars)
})  

app.post('/login/', function (req, res) {
  let templateVars = { urls: urlDatabase, users:req.cookies["user_id"] };
  if(!req.body.email || !req.body.password) { //ensures fields are not empty, else error 400
    res.status(400).send("Error 400: Please enter an email and password")
  } else if (!validateUser(req.body.email, req.body.password)) {
    res.status(403).send("Error 403: Email and password are incorrect or do not exist")
  } else {
    console.log(users)
    res.cookie("user_id", validateUser(req.body.email, req.body.password))
    res.redirect("/urls", templateVars, users)
  }  
})  

//renders the user log-in page
app.get('/login/', function (req, res) {
  let templateVars = { urls: urlDatabase, users:req.cookies["user_id"] };
  res.render("user_login", templateVars);
})  

app.get('/logout', function (req, res) { 
  res.clearCookie("user_id");
  res.redirect('/urls');
})  

const urlDatabase = { // used to keep track of all the URLs and their shortened forms
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => { // main page
  res.send("Hello!");
});

app.get("/urls", (req, res) => { // lists all the existing short URLs saved to the database
  console.log(req.cookies);
  let templateVars = { urls: urlDatabase, users:req.cookies["user_id"] };
  res.render("urls_index", templateVars)
});

app.get("/urls/new", (req, res) => { // page creates a new short URL
  let templateVars = { urls: urlDatabase, users:req.cookies["user_id"] };
  res.render("urls_new", templateVars)
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:shortURL", (req, res) => { //page shows the longURL and its short URL (and edit)
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], users:req.cookies["user_id"] };
  res.render("urls_show", templateVars)
})

app.post("/urls", (req, res) => { // adds new short URL to database
  let string = generateRandomString()
  urlDatabase[string] = req.body.longURL;
  console.log(req.body);
  console.log(urlDatabase);
  res.redirect(`/urls/${string}`);
});

app.get("/u/:shortURL", (req, res) => { // redirects from short URL to URL page
  res.redirect(urlDatabase[req.params.shortURL]);
})

app.post("/urls/:shortURL", (req, res) => { // keep the short URL, edit the long URL
  urlDatabase[req.params.shortURL] = req.body.longURL;
  console.log(req.body.longURL);
  console.log(req.params.shortURL);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => { //deletes existing URLs
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls");
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});