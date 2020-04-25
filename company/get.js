const Company = require('../models/company');

module.exports = (req, res) => {
    Company.find({}, (err, companies) => res.json(companies));
};
