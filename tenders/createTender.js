const Tender = require('../models/tender');
const selenium = require('../selenium/index');
const sendMessageToClient = require("./sendMessageToClient");
const find = require('../company/find');
const activeTenders = require('./activeTenders');

module.exports = (req, res) => {
    const {creationsTime, link, creator, status, timeForNextStep, company, minBet} = req.body;

    Tender.findOne({'link': link}, async (err, tender) => {
        const {login, password, proxyIP, proxyLogin, proxyPassword} = await find(company);

        if (!tender) {
            const newTender = new Tender();

            newTender.creationsTime = creationsTime;
            newTender.name = '';
            newTender.link = link;
            newTender.creator = creator;
            newTender.company = company;
            newTender.status = status;
            newTender.timeForNextStep = timeForNextStep;
            newTender.numberOfParticipants = 0;
            newTender.isBotOn = false;
            newTender.isWork = false;
            newTender.allowToDelete = true;
            newTender.panelBid = '';
            newTender.minBet = minBet;
            newTender.logs = [];

            activeTenders[link] = selenium({
                link,
                currentMemberNumber: 0,
                username: creator,
                login,
                password,
                proxyIP,
                proxyLogin,
                proxyPassword,
                minBet,
                company,
                isBotOn: false
            });

            newTender.save(err => {
                if (err) throw err;

                sendMessageToClient(req.body);
                res.json({status: true, message: 'Тендер создан'})
            });
        } else {
            await res.json({status: false, message: 'Уже существует тендер с идентичной ссылкой'})
        }
    });
};
