const sendMessageToClient = require("./sendMessageToClient");
const Tender = require('../models/tender');

module.exports = ({link}) => {
    Tender.findOne({'link': link}, (err, tender) => {
        if (tender) {
            tender.isWork = false;

            tender.save(err => {
                if (err) throw err;

                sendMessageToClient({toggleTender: true, isWork: tender.isWork, link});
            });
        } else {
           console.log('упс')
        }
    });
};
