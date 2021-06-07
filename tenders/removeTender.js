const Tender = require('../models/tender');
const sendMessageToClient = require("./sendMessageToClient");
const activeTenders = require('./activeTenders');
const timers = require('./timers');


module.exports = {
    find(req, res) {
        const {email, role, link} = req.body;

        Tender.findOne({'link': link}, (err, tender) => {
           tender && this.check({tender, res, email, role, err, link})
        });
    },

    async check({tender, res, email, role, link, err}) {
        if (!tender && res) {
            await res.json({status: false, message: err});

            return;
        }

        if (!tender.allowToDelete && role !== 'admin') {
            await res.json({status: false, message: 'После старта тендера удалить его может только админ'});

            return
        }

        if (tender.isWork && role === 'admin' && activeTenders[link]) {
            await activeTenders[link].stop({});
        }

        if (tender && (tender.creator === email || role === 'admin')) {
            this.remove({link, res})
        } else {
            await res.json({status: false, message: 'Удалять может только создатель или админ'})
        }
    },

    remove({link, res, message}) {
        Tender.findOneAndDelete({'link': link}, (err, result) => {
            if (err && res) res.json({status: false, message: 'Ошибка удаления'});

            sendMessageToClient({deleteTender: true, link, message});
            timers.isRemove = true;
            res && res.json({status: true, message: 'Удаление успешно завершено'})
        })
    }
};

