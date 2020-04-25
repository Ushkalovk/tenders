const logs = require('../logs/index');
const tender = require('../tenders/index');
const SSE = require('../tenders/sendMessageToClient');
const company = require('../company/index');
const express = require('express');
const token = require('../token/token');
const router = express.Router();

// const mailer = require('../nodemailer/sendMessage');
// const message = {
//     to: 'pleonidovich11@gmail.com',
//     subject: 'Привет ',
//     html: `
//         <h2>Поздравляем, Вы успешно зарегистрировались на нашем сайте!</h2>
//
//         <i>данные вашей учетной записи:</i>
//         <ul>
//             <li>login: vladislav</li>
//             <li>password: 338</li>
//         </ul>
//         <p>Данное письмо не требует ответа.<p>`
// };

// mailer(message);

module.exports = (passport) => {
    router.put('/getLogs', (req, res) => logs.getLogs(req, res));

    router.put('/toggleBot', (req, res) => logs.toggleBot(req, res));

    router.put('/makeABet', (req, res) => tender.makeABet(req, res));

    router.post('/login', (req, res, next) => {
        passport.authenticate('login', (error, user, info) => {
            if (error) {
                return res.status(500).json(error);
            }

            if (!user) {
                return res.json({error: info.message, status: false});
            }

            res.json({
                email: user.email,
                status: true,
                token: token.createToken(user),
                role: user.role
            });
        })(req, res, next);
    });

    router.post('/signup', (req, res, next) => {
        passport.authenticate('signup', (error, user, info) => {
            if (error) {
                return res.json(error);
            }

            if (!user) {
                return res.json({error: info.message, status: false});
            }

            res.json({
                email: user.email,
                status: true,
                token: token.createToken(user),
                role: user.role
            })
        })(req, res, next);
    });

    router.route('/tender')
        .get((req, res) => tender.getAllTenders(req, res))
        .post((req, res) => tender.createTender(req, res))
        .put((req, res) => tender.setNewTender(req, res))
        .delete((req, res) => tender.removeTender.find(req, res));

    router.route('/company')
        .get((req, res) => company.get(req, res))
        .post((req, res) => company.create(req, res))
        .put((req, res) => company.updateProxy(req, res));

    router.put('/stopTender', (req, res) => tender.stopTender(req, res));

    router.get('/logout', (req, res) => {
        req.logout();
        res.json({status: true});
    });

    return router;
};





