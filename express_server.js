const express = require('express');
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helpers');



//Database
const urlDatabase = {};
//all users (from registration page)
const users = {};


//function for generating shortURL and USERID(RANDOM)
const generateRandomString = () => {
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(6)]
    .map(() => alphanumeric[Math.floor(Math.random() * 36)])
    .join('');
};
//function checking if userID already exists in database upon register
const urlsForUser = userId => {
  return Object.entries(urlDatabase).reduce((acc, [shortURL, urlInfo]) => {
    return urlInfo.userID === userId ? {...acc, [shortURL]: urlInfo} : acc;
  }, {});
};

app.set('view engine', 'ejs');

//middleware for cookies
app.use(cookieSession({
  name: 'session',
  secret: 'AKTi6ZrOK07q6mosGZJigZjM+GCODRbsTs9n85ZraBZXmDu3QuHCOlBYa7U='
}));
app.use(bodyParser.urlencoded({extended: true}));



//homepage preset
app.get('/', (req, res) => {
  res.send('Hello!');
});
//login page
app.get('/urls', (req, res) => {
  if (!users[req.session.user_id]) {
    return res.redirect('/login');
  }
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

//creating tinyurl for new long url
app.get('/urls/new', (req, res) => {
  if (!users[req.session.user_id]) {
    return res.redirect('/login');
  }
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render('urls_new', templateVars);
});


//SHORTURL GET and POSTS
//viewing current shorturl -added security for personal urls
app.get('/urls/:shortURL', (req, res) => {
  if (!users[req.session.user_id]) {
    return res.redirect('/login');
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('You are not authorized to view this url.');
  }
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };
  res.render('urls_show', templateVars);
});
// verifying if login matches userID who created that shortURL
app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longUrl;
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('Cannot edit this URL');
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});
//verifying userID to authorize delete
app.post('/urls/:shortURL/delete', (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('You must be logged in to delete a url.');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});




//register GET and POSTS
app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send('The email and password fields cannot be empty.');
  }
  if (getUserByEmail(req.body.email, users)) {
    return res.status(400).send('The email has already been registered.');
  }
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = userId;
  res.redirect('/urls');
});


//login GET and POSTS
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (!user) {
    return res.status(403).send('This email address cannot be found.');
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {
    res.status(403).send('The email address and password are incorrect');
  }
});
//logout to clear cookies
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});