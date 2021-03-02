const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/UserModel');

router.get('/login', (req, res, next) => {
    res.render('login')
});

router.post('/login', async (req, res, next) => {

    const { logUsername,logPassword } = req.body;
    var payload = req.body;

    if (logUsername && logPassword) {
        var user = await User.findOne({
            $or: [
                { username: logUsername },
                { email: logUsername  }
            ]
        })
        .catch((error) => {
            console.log(error);
            payload.message = "Something went wrong";
            res.render("login", payload);
        });

        if(user !== null) {
            var result = await bcrypt.compare(logPassword, user.password);

            if (result === true) {
                req.session.user = user;
                return res.redirect('/');
            }
    
        }

        payload.message = "Login credentials incorrect";
        return res.render("login", payload);
    } 
    
    payload.message = "Make sure each field has a value";
    res.render("login", payload);
});

module.exports = router;