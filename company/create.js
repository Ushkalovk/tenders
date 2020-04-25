const Company = require('../models/company');
const find = require('./find');

module.exports = async (req, res) => {
    const {name, login, password, proxy, proxyLogin, proxyPassword} = req.body;

    const company = await find(name);

    if (!company) {
        const newCompany = new Company();

        newCompany.name = name;
        newCompany.login = login;
        newCompany.password = password;
        newCompany.proxyIP = proxy !== '' ? proxy : 'Отсутсвует';
        newCompany.proxyLogin = proxyLogin;
        newCompany.proxyPassword = proxyPassword;

        newCompany.save(err => {
            if (err) throw err;

            res.json({status: true, message: 'Компания создана'})
        });
    } else {
        await res.json({status: false, message: 'Уже существует компания с идентичным названием'})
    }
};
