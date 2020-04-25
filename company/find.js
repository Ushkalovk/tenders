const Company = require('../models/company');

module.exports = async (name) => {
    return new Promise(resolve => {
        Company.findOne({'name': name}, (err, tender) => resolve(tender ? tender : false));
    })
};
