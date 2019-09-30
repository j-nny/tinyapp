const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new")
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars)
})

app.post("/urls", (req, res) => {
  let string = generateRandomString()
  urlDatabase[string] = req.body.longURL;
  console.log(req.body);
  console.log(urlDatabase);
  res.redirect(`/urls/${string}`);
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});