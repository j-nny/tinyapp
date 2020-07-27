const bcrypt = require("bcrypt");

//generates the short URL string of 6 chars
let generateID = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const alphaNum =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    randomString +=
      alphaNum[Math.floor(Math.random() * Math.floor(alphaNum.length))];
  }
  return randomString;
};

// checks if the user is present in the database
let getUserByEmail = function(email, users) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  }
};

// filters the URLs for only that user
let userURLs = function(user, urlDatabase) {
  let userDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === user) {
      userDatabase[url] = { longURL: urlDatabase[url].longURL, userID: user };
    }
  }
  return userDatabase;
};

const hashPassword = (password, saltRounds = 10) => {
  let salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
};

const getEmailList = (stateUsers) => {
  // returns an array with the VALUES (not KEYS) in stateUsers
  const arrayOfUserObjects = Object.values(stateUsers);
  // reduce is your best friend you can do pretty much everything with it
  return arrayOfUserObjects.reduce(
    (arrayToBeReturned, currentUserObject) => [...arrayToBeReturned, currentUserObject.email],
    [],
  );
};

const emailExists = (stateUsers, email) =>
  // See if the email exists already in the users object
  getEmailList(stateUsers).some((userEmail) => userEmail === email);

const areValidEmailPassword = (stateUsers = undefined, email, password) => {
  const arrayOfUserObjects = stateUsers ? Object.values(stateUsers) : [];
  return (
    arrayOfUserObjects.filter(
      (userObject) =>
        userObject.email === email &&
        bcrypt.compareSync(password, userObject.password),
    ).length > 0
  );
};

const getArrayIndexOfUrl = (stateUsers, userId, urlId) =>
  stateUsers[userId].shorturls.findIndex((url) => url === urlId);

module.exports = {
  emailExists,
  generateID,
  getEmailList,
  getUserByEmail,
  hashPassword,
  userURLs,
  areValidEmailPassword,
};
