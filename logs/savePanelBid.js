const Tender = require('../models/tender');
const sendMessageToClient = require("../tenders/sendMessageToClient");

module.exports = ({bet, link}) => {
    Tender.findOneAndUpdate({'link': link}, {
        $set: {
            panelBid: bet,
        }
    }, {new: true}, err => {
        if (err) return console.log(err);

        sendMessageToClient({bet, link, isModalBets: true});
    })
};
