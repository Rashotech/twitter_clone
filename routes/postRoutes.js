const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const User = require('../models/UserModel');

router.get('/post/:id', middleware.requireLogin, (req, res, next) => {
    payload = {
        "pageTitle": "View Post",
        "userLoggedIn": req.session.user,
        "userLoggedInJs": JSON.stringify(req.session.user),
        "postId": req.params.id
    }
    res.render('postPage', payload);
});

module.exports = router;