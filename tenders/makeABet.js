const Tender = require('../models/tender');
const activeTenders = require('./activeTenders');

module.exports = async (req, res) => {
    const {link, bet, email, role} = req.body;
    const tender = await Tender.findOne({'link': link});

    if (tender.creator === email || role === 'admin') {
        try {
            activeTenders[link].enterBet(bet, email);

            await res.json({status: true, message: 'Ставка принята'})
        } catch (e) {
            await res.json({status: false, message: 'Ставку не удалось поставить'})
        }
    } else {
        await res.json({status: false, message: 'Делать ставку может только создатель или админ'})
    }
};
