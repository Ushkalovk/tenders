const Tender = require('../models/tender');

module.exports = (req, res) => {
    const {link} = req.body;

    Tender.findOne({'link': link}, (err, tender) => {
        try {
            const {logs, numberOfParticipants, isBotOn, timeForNextStep, panelBid, botSuggest} = tender;

            res.json(
                {
                    status: true,
                    object: {
                        logs,
                        numberOfParticipants
                    },
                    isBotOn,
                    timer: timeForNextStep,
                    panelBid,
                    botSuggest
                }
            )
        } catch (error) {
            if (err) res.json({status: false, message: 'Упс. Что-то пошло не так'});
        }
    });
};
