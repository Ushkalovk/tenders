const find = require('./find');

module.exports = async (req, res) => {
    const {name, text, proxyField} = req.body;
    const company = await find(name);

    if (company) {
        company[proxyField] = text;
        console.log(text, proxyField)

        company.save(err => {
            if (err) throw err;

            res.json({status: true, message: 'Прокси успешно изменён'})
        });
    } else {
        await res.json({status: false, message: 'Компания с таким именем не найдена'})
    }
};
