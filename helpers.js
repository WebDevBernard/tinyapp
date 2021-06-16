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

module.exports = { generateRandomString, urlsForUser, getUserByEmail };
