const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/UserModel');

router.get('/register', (req, res, next) => {
    res.render('register', { pageTitle: "Register"})
});

router.post('/register', async (req, res, next) => {
    const { firstName, lastName, username, email, password } = req.body;
    var payload = req.body;

    if (firstName && lastName && username && email && password) {
        var user = await User.findOne({
            $or: [
                { username: username },
                { email: email  }
            ]
        })
        .catch((error) => {
            console.log(error);
            payload.errorMessage = "Something went wrong";
            res.render("register", payload);
        });

        if(user === null) {
            // No User Found4
            var data = req.body;
            data.password = await bcrypt.hash(password, 10);
            User.create(data).then((user) => {
                // res.render("login", {"message": "Registration Successful!. Login Now!"})
                req.session.user = user;
                return res.redirect('/');
            })
        } else {
            if(email === user.email) {
                payload.errorMessage = "Email already in Use";
            } else {
                payload.errorMessage = "Username already in Use";
            }
            res.render("register", payload);
        }
    } else {
        payload.errorMessage = "Make sure each field has a valid value";
        res.render("register", payload);
    };
});

module.exports = router;