const mongoose = require('mongoose');

class Database {

    constructor() {
        this.connect();
    }

    connect() {
        mongoose.connect('mongodb://localhost/twitter_clone', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        }).then(() => {
                console.log("Database Connected")
        }).catch((err) => {
                console.log("Database Connection error" + err)
        });

    }
};

module.exports = new Database();