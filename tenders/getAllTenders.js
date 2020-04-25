const Tender = require('../models/tender');

module.exports = (req, res) => {
    Tender.find({}, (err, tenders) => res.json(tenders));
};
