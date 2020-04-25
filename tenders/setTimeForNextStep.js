const Tender = require('../models/tender');
const sendMessageToClient = require("./sendMessageToClient");

module.exports = ({timer, link}) => {
    Tender.findOneAndUpdate({'link': link}, {timeForNextStep: timer}, (err, tender) => {
        if (err) return console.log(err);

        sendMessageToClient({timer, link});
    })
};
