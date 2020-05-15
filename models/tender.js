const mongoose = require('mongoose');

module.exports = mongoose.model('Tender', {
    creationsTime: String,
    name: String,
    link: String,
    creator: String,
    company: String,
    status: String,
    timeForNextStep: String,
    numberOfParticipants: Number,
    isBotOn: Boolean,
    isWork: Boolean,
    allowToDelete: Boolean,
    panelBid: String,
    minBet: Number,
    logs: [
        {
            participant: String,
            bet: String,
            currentMemberNumber: Number,
            bitTime: Date,
            round: Number
        }
    ]
});


