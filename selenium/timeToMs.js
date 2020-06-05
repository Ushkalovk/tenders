module.exports = string => {
    let betText = string.trim();
    let hoursMs = 0;
    let minMs = 0;
    let secMs = 0;

    if (betText.includes('год')) {
        const index = betText.indexOf('год');
        hoursMs = Math.max(+betText.slice(0, index), 1) * 60 * 60 * 1000;

        betText = betText.slice(index + 4);
    }

    if (betText.includes('хв')) {
        const index = betText.indexOf('хв');
        minMs = Math.max(+betText.slice(0, index), 1) * 60 * 1000;

        betText = betText.slice(index + 3);
    }

    if (betText.includes('сек')) {
        secMs = Math.max(+betText.slice(0, betText.indexOf('сек')), 1) * 1000;
    }

    return hoursMs + minMs + secMs;
};
