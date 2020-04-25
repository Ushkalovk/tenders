const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bCrypt = require('bcrypt-nodejs');

module.exports = (passport) => {

    const isValidPassword = (user, password) => {
        return bCrypt.compareSync(password, user.password);
    };

    passport.use('login', new LocalStrategy({
            passReqToCallback: true,
            usernameField: 'email',
            passwordField: 'password'
        }, (req, email, password, done) => {
            // check in mongo if a user with username exists or not
            User.findOne({'email': email}, (err, user) => {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err);
                    // Username does not exist, log the error and redirect back
                    if (!user) {
                        console.log('User Not Found with email ' + email);
                        return done(null, false, {message: 'Пользователь ' + email + ' не найден.'});
                    }
                    // User exists but wrong password, log the error
                    if (!isValidPassword(user, password)) {
                        console.log('Invalid Password');
                        return done(null, false, {message: 'Неправильный пароль'});
                    }

                    // which will be treated like success
                    return done(null, user);
                }
            );

        })
    );
};
