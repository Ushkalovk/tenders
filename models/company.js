const mongoose = require('mongoose');

module.exports = mongoose.model('Company', {
    id: String,
    name: String,
    login: String,
    password: String,
    proxyIP: String,
    proxyLogin: String,
    proxyPassword: String
});


