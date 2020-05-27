const Tender = require('../models/tender');
const sendMessageToClient = require("../tenders/sendMessageToClient");

module.exports = ({botSuggest, link}) => {
    Tender.findOneAndUpdate({'link': link}, {
        $set: {
            botSuggest,
        }
    }, {new: true}, err => {
        if (err) return console.log(err);

        sendMessageToClient({botSuggest, link});
    })
};
