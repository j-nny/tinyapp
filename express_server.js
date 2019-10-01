const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() { //generates the short URL string
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    randomString += alphaNum[Math.floor(Math.random() * Math.floor(alphaNum.length))]
  } return randomString;
}

const urlDatabase = { // used to keep track of all the URLs and their shortened forms
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => { // main page
  res.send("Hello!");
});

app.get("/urls", (req, res) => { // lists all the existing short URLs saved to the database
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});

app.get("/urls/new", (req, res) => { // page creates a new short URL
  res.render("urls_new")
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:shortURL", (req, res) => { //page shows the longURL and its short URL (and edit)
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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

app.post("/urls/:shortURL/delete", (req, res) => { //deletes existing URLs
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
})

app.post("urls/:shortURL", (req, res) => { // edit the long URL
  urlDatabase[req.params.shortURL] = req.body.longURL;
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});