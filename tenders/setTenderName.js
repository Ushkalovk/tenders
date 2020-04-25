const Tender = require('../models/tender');
const sendMessageToClient = require("./sendMessageToClient");

module.exports = ({tenderName, link}) => {
    Tender.findOneAndUpdate({'link': link}, {name: tenderName}, (err, tender) => {
        if (err) return console.log(err);

        sendMessageToClient({tenderName, link});
    })
};
