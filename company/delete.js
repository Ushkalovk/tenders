const Company = require('../models/company');
const find = require('./find');

module.exports = async (req, res) => {
    const {name} = req.body;

    // const company = await find(name);

        Company.deleteOne({'name': name}, err => {
            if (err) throw err;

            res.json({status: true, message: 'Компания удалена'})
        });
};
