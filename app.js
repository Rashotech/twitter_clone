const express = require('express');
const app = express();
const middleware = require('./middleware');
const path = require('path');
const bodyParser = require('body-parser');
var session = require('express-session');
require('dotenv').config();
const mongoose = require('./db');

const PORT = 5000;

app.set("view engine", "pug");
app.set("views, views")

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))

// Routes
const loginRoutes = require('./routes/loginRoutes');
const registerRoutes = require('./routes/registerRoutes');
const postRoutes = require('./routes/postRoutes');
const logout = require('./routes/logout');

// Api Routes
const apiPostRoutes = require('./routes/api/posts');

app.use(loginRoutes);
app.use(registerRoutes);
app.use(postRoutes);
app.use(logout);
app.use('/api', apiPostRoutes);

app.get('/', middleware.requireLogin, (req, res) => {
    payload = {
        "pageTitle": "Home",
        "userLoggedIn": req.session.user,
        "userLoggedInJs": JSON.stringify(req.session.user)
    }
    res.render('home', payload);
})
app.listen(PORT, () => {
    console.log(`App running at Port ${PORT}`);
});