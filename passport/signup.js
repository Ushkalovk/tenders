const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bCrypt = require('bcrypt-nodejs');

module.exports = function (passport) {
    const createHash = (password) => {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };

    passport.use('signup', new LocalStrategy({
            passReqToCallback: true,
            usernameField: 'email',
            passwordField: 'password'
        }, (req, email, password, done) => {
            const findOrCreateUser = () => {
                User.findOne({'email': email}, (err, user) => {
                    if (err) {
                        console.log('Error in SignUp: ' + err);
                        return done(err);
                    }

                    if (user) {
                        return done(null, false, {message: 'Пользователь с таким email уже существует'});
                    } else {
                        const newUser = new User();

                        newUser.password = createHash(password);
                        newUser.email = req.param('email');
                        newUser.role = 'user';

                        newUser.save(function (err) {
                            if (err) {
                                console.log('Error in Saving user: ' + err);
                                throw err;
                            }
                            console.log('User Registration succesful');

                            return done(null, newUser);
                        });
                    }
                });
            };

            process.nextTick(findOrCreateUser);
        })
    );
};
