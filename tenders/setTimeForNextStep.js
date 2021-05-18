const Tender = require('../models/tender');
const sendMessageToClient = require("./sendMessageToClient");


module.exports = ({timer, ms, link}) => {
    Tender.findOne({'link': link}, async (err, tender) => {
        if (err) console.log(err);

        tender.timeForNextStep = timer;
        tender.timeForNextStepMs = ms;

        tender.save(err => {
            if (err) throw err;

            sendMessageToClient({timer, ms, link});
        });
    })
};
