const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "bJ48lW" },
  i9999: { longURL: "https://www.google.ca", userID: "0000W" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "a@b.com",
    password: "a"
  },
  "bJ48lW": {
    id: "aJ48lW",
    email: "b@c.com",
    password: "a"
  }
};

//Generates 6 character random string
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// checks urlDatabase and users to find matching id number
const urlsForUser = (urls, id) => {
  const userURLs = {};
  for (const url in urls) {
    if (urls[url].userID === id) {
      userURLs[url] = urls[url];
    }
  }
  return userURLs;
};

// returns user id that matches email in users
const getUserByEmail = function(users, email) {
  for (const user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
};

module.exports = { generateRandomString, urlsForUser, getUserByEmail, users, urlDatabase };
