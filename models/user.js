const mongoose = require('mongoose');

module.exports = mongoose.model('User', {
    id: String,
    role: String,
    password: String,
    email: String,
});


