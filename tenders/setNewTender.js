const find = require('../company/find');
const sendMessageToClient = require('./sendMessageToClient');
const activeTenders = require('./activeTenders');
const Tender = require('../models/tender');
const selenium = require('../selenium/index.js');

module.exports = async(req, res) => {
    const {email, role, link} = req.body;
    const tender = await Tender.findOne({'link': link});

    if (tender.creator === email || role === 'admin') {
        const {login, password, proxyIP} = await find(tender.company);

        try {
            const currentMemberNumber = tender.logs.length > 0 ? tender.logs[tender.logs.length - 1].currentMemberNumber + 1 : 0;

            activeTenders[link] = selenium({link, currentMemberNumber, username: email, login, password, proxyIP});
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
        res.json({status: false, message: 'Запускать может только создатель или админ'})
    }
};


