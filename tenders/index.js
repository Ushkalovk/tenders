const createTender = require('./createTender');
const removeTender = require('./removeTender');
const getAllTenders = require('./getAllTenders');
const disableTender = require('./disableTender');
const stopTender = require('./stopTender');
const makeABet = require('./makeABet');
const setTenderName = require('./setTenderName');
const setTimeForNextStep = require('./setTimeForNextStep');
const sendMessageToClient = require('./sendMessageToClient');
const timers = require('./timers');

module.exports = {
    createTender,
    removeTender,
    getAllTenders,
    disableTender,
    stopTender,
    makeABet,
    setTenderName,
    setTimeForNextStep,
    sendMessageToClient,
    timers
};

