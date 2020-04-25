const jwt = require('jsonwebtoken');
const secretKey = require('./secretKey');

module.exports = {
    verify(req) {
        return jwt.verify(req.param('token'), secretKey)
    },

    isAdmin(req) {
        return this.verify(req).role === 'admin'
    },

    findUserById(req) {
        return this.verify(req).id
    },

    createToken(user) {
        return jwt.sign({
            id: user._id,
            role: user.role
        }, secretKey);
    }
};
