const find = require('./find');

module.exports = async (req, res) => {
    const {name, proxy} = req.body;
    const company = await find(name);

    if (company) {
        company.proxy = proxy;
        console.log(proxy)

        company.save(err => {
            if (err) throw err;

            res.json({status: true, message: 'Прокси успешно изменён'})
        });
    } else {
        await res.json({status: false, message: 'Компания с таким именем не найдена'})
    }
};
