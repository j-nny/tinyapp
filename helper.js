//generates the short URL string of 6 chars
let generateID = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    randomString += alphaNum[Math.floor(Math.random() * Math.floor(alphaNum.length))];
  } return randomString;
};

// checks if the user is present in the database
let getUserByEmail = function(email, users) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  } return false;
};

let userURLs = function(user, urlDatabase) {
  let userDatabase = { }
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === user) {
      userDatabase[url] = {longURL: urlDatabase[url].longURL, userID: user}
    }
  }
  return userDatabase
}

module.exports = {
  generateID,
  getUserByEmail,
  userURLs
}