const CronJob = require('cron').CronJob;
const Tender = require('../models/tender');
const setTimeForNextStep = require('./setTimeForNextStep');
const activeTenders = require('./activeTenders');
const selenium = require('../selenium/index');

const runTender = data => {
    Tender.findOne({'link': data.link}, (err, tender) => {
        if (tender && !activeTenders[data.link]) {
            activeTenders[data.link] = selenium({...data, isBotOn: tender.isBotOn});
        }
    });
};

const formatTime = (ms) => {
    const date = new Date(ms);

    return date.getHours() - 3 > 0 ?
        `${date.getHours() - 3}ч. ${date.getMinutes()}мин. до начала` :
        `${date.getMinutes()}мин. ${date.getSeconds()}сек. до начала`;
};

module.exports = {
    createTimer({ms, link, data}) {
        const futureTime = Date.now() + ms;
        
        const updateEverySec = new CronJob('* * * * * *', () => {
            const msLeft = futureTime - Date.now();

                setTimeForNextStep({timer: formatTime(msLeft), ms: msLeft, link});


            !Math.max(msLeft - 10000, 0) && updateEverySec.stop();
        }, () => {
            delete activeTenders[link];
            runTender(data);
            console.log('Запуск тендера...');

            setTimeout(() => setTimeForNextStep({timer: 'Запуск тендера...', link}), 1000);
        });

        updateEverySec.start();
    }
};
