const Tender = require('../models/tender');
const sendMessageToClient = require("./sendMessageToClient");


module.exports = ({timer, ms, link}) => {
    Tender.findOne({'link': link}, async (err, tender) => {
        // if (err)
        //     console.log(err);
        console.log("Error outside")
        tender.timeForNextStep = timer;
        tender.timeForNextStepMs = ms;

        tender.save(err => {
            // if (err) throw err;
            console.log("Error inside")

            sendMessageToClient({timer, ms, link});
        });
    })
};
