const createTender = require('./createTender');
const removeTender = require('./removeTender');
const getAllTenders = require('./getAllTenders');
const disableTender = require('./disableTender');
const setNewTender = require('./setNewTender');
const stopTender = require('./stopTender');
const makeABet = require('./makeABet');
const setTenderName = require('./setTenderName');
const setTimeForNextStep = require('./setTimeForNextStep');
const sendMessageToClient = require('./sendMessageToClient');

module.exports = {
    createTender,
    removeTender,
    getAllTenders,
    disableTender,
    setNewTender,
    stopTender,
    makeABet,
    setTenderName,
    setTimeForNextStep,
    sendMessageToClient
};

