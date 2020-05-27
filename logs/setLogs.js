const Tender = require('../models/tender');
const sendMessageToClient = require("../tenders/sendMessageToClient");

module.exports = (object, blockLength) => {
    const {link, numberOfParticipants, logs} = object;

    return new Promise(resolve => {
        Tender.findOneAndUpdate(
            {'link': link}, {
                $push: {logs: logs},
                $set: {
                    numberOfParticipants: numberOfParticipants,
                    status: logs.currentMemberNumber === numberOfParticipants - 1 ? 'Закончен' : 'Начат',
                }
            }, {new: true}, (err, tender) => {
                if (err) return console.log(err);

                sendMessageToClient({...object, status: tender.status, blockLength});
                resolve();
            })
    })
};
