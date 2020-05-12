const find = require('../company/find');
const sendMessageToClient = require('./sendMessageToClient');
const activeTenders = require('./activeTenders');
const Tender = require('../models/tender');
const selenium = require('../selenium/index.js');

module.exports = {
    find(req, res) {
        const {email, role, link, companyName} = req.body;

        Tender.findOne({'link': link}, (err, tender) => {
            tender && this.check({tender, res, email, role, err, link, companyName})
        });
    },

    async check({tender, res, email, role, link, err, companyName}) {
        if (tender.creator === email || role === 'admin') {
            const {login, password, proxyIP, proxyLogin, proxyPassword} = await find(companyName);

            try {
                this.run({link, login, password, proxyIP, proxyLogin, proxyPassword, email, companyName});

                tender.isWork = true;
                sendMessageToClient({toggleTender: true, isWork: tender.isWork, link});

                tender.save(err => {
                    if (err) throw err;
                });

                await res.json({status: true})
            } catch (error) {
                console.log(error);
                await res.json({status: false})
            }
        } else {
            await res.json({status: false, message: 'Запускать может только создатель или админ'})
        }
    },

    run({link, login, password, proxyIP, proxyLogin, proxyPassword, email, companyName}) {
        Tender.findOne({'link': link}, (err, tender) => {
            if (tender) {
                const currentMemberNumber = tender.logs.length > 0 ? tender.logs[tender.logs.length - 1].currentMemberNumber + 1 : 0;

                activeTenders[link] = selenium({
                    link,
                    currentMemberNumber,
                    username: email,
                    login,
                    password,
                    proxyIP,
                    proxyLogin,
                    proxyPassword,
                    company: companyName
                });
            }
        });

    }
};


