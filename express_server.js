const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080
const { generateRandomString, urlsForUser, getUserByEmail } = require("./helpers");
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "bJ48lW" }
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

app.set("view engine", "ejs");

// *middleware*

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
}));

// *beginning of get requests*

app.get("/", (req, res) => {
  res.redirect("urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(urlDatabase, req.session.user_id), user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// only users logged in can access short URLs
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.redirect("/urls");
  }
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user: users[req.session.user_id] };
    return res.render("urls_show", templateVars);
  }
  return res.status("404").send('bad request');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

// *beginning of post requests*

// creates new user
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Email or password required");
  }
  if (getUserByEmail(users, email)) {
    return res.status(400).send("Please use another email address");
  }
  const newUser = users[userID] = {
    id: userID,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  users[userID] = newUser;
  req.session.user_id = newUser.id;
  res.redirect("/urls");
});

// user login - match email and password to database
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let foundUser = getUserByEmail(users, email);

  if (!foundUser) {
    return res.status(403).send("Email or password combination does not exist");
  }
  if (!bcrypt.compareSync(password, users[foundUser].password)) {
    return res.status(403).send("Invalid Password");
  }
  req.session.user_id = users[foundUser].id;
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect("/urls/");
});

// only users logged in can delete short URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }
  return res.status("404").send('bad request');
});

// only users can see their own urls
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    return res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

