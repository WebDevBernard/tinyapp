const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080
const { generateRandomString, urlsForUser, getUserByEmail, users, urlDatabase} = require("./helpers");

// Quick reference to what different user id's are referring to:
// user_id is used in req.session.user_id to look at cookies and see if user is signed in.  The cookie value is the same value as the 6 character key in users object.
// userID is used in urlDatabase object to look if the userID belongs to a specific user
// userId is used in POST: /register to create new users

app.set("view engine", "ejs");

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
}));

app.get("/".trim(), (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { urls: urlsForUser(urlDatabase, req.session.user_id), user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  } else {
    return res.status("401").send("Please login first");
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status("404").send("This URL does not exists");
  }
  if (!req.session.user_id) {
    return res.status("401").send("Please login first");
  }
  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    return res.status("404").send("This URL does not belong to you");
  }
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user: users[req.session.user_id] };
  return res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status("404").send("This URL does not exist");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// checks to see if user is logged in. Only logged in users can generate short URL.
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status("401").send("Please login first");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect("/urls/");
});

//  User can update their own URLs only, users cannot modify other user's shortURL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!req.session.user_id) {
    return res.status("401").send("Please login first");
  }
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    return res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

// user login - match email and password to database
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = getUserByEmail(users, email);

  if (!foundUser) {
    return res.status(403).send("Email or password combination does not exist");
  }
  if (!bcrypt.compareSync(password, users[foundUser].password)) {
    return res.status(403).send("Invalid Password");
  }
  req.session.user_id = users[foundUser].id;
  res.redirect('/urls');
});

// only users logged in can delete short URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.status("404").send('User needs to log before deleting.');
  } else if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  } else {
    res.status("404").send('URL does not belong to you!');
  }
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Email or password required");
  }
  if (getUserByEmail(users, email)) {
    return res.status(400).send("Please use another email address");
  }
  // creates a user object: generates random 6 characters for id key
  const newUser = {
    id: userId,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  // adds newUser object using the 6 character userId as key to users object
  users[userId] = newUser;
  // adds an encrypted cookies
  req.session.user_id = userId;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});