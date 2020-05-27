const CronJob = require('cron').CronJob;
const setTimeForNextStep = require('./setTimeForNextStep');
const activeTenders = require('./activeTenders');
const selenium = require('../selenium/index');

const parseTime = (string) => {
    let betText = string.trim();
    let hoursMs = 0;
    let minMs = 0;

    if (betText.includes('год')) {
        const index = betText.indexOf('год');
        hoursMs = Math.max(+betText.slice(0, index), 1) * 60 * 60 * 1000;

        betText = betText.slice(index + 4);
    }

    if (betText.includes('хв')) {
        minMs = Math.max(+betText.slice(0, betText.indexOf('хв')), 1) * 60 * 1000;
    }

    return hoursMs + minMs;
};

const formatTime = (date) => {
    return date.getHours() - 3 > 0 ?
        `${date.getHours() - 3}ч. ${date.getMinutes()}мин. до начала` :
        `${date.getMinutes()}мин. ${date.getSeconds()}сек. до начала`;
};


module.exports = {
    createTimer({timer, link, data}) {
        const futureTime = Date.now() + parseTime(timer);

        const updateEverySec = new CronJob('* * * * * *', function () {
            const ms = futureTime - Date.now();
            const countdown = new Date(ms);

            setTimeForNextStep({timer: formatTime(countdown), link});

            if (!Math.max(ms - 10 * 60 * 1000, 0)) {
                activeTenders[link] = selenium(data);
                setTimeForNextStep({timer: 'Запуск тендера...', link});
                updateEverySec.stop();
            }
        });

        updateEverySec.start();
    }
};
