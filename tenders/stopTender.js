const Tender = require('../models/tender');
const activeTenders = require('./activeTenders');
const disableTender = require('./disableTender');

module.exports = async (req, res) => {
    const {email, role, link} = req.body;
    const tender = await Tender.findOne({'link': link});

    if (tender.creator === email || role === 'admin') {
        try {
            await activeTenders[link].stop();
            disableTender({link});

            await res.json({status: true})
        } catch (error) {
            await res.json({status: false})
        }
    }
};
