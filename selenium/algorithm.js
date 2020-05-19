module.exports = {
    myName: ['Ви'],
    minBet: 0,
    bet: 0,
    step: 0,
    roundsCount: 4,
    participants: {},

    parse(bet) {
        return parseInt(bet.split(' ').join(''));
    },

    setUser(participant, betText, round) {
        if (!this.participants[round]) {
            this.participants[round] = {};
        }

        const isMyName = this.myName.find(name => name.toLowerCase() === participant.toLowerCase());

        isMyName ? this.bet = this.parse(betText) : this.participants[round][participant] = this.parse(betText);
    },

    getBet(data, round) {
        this.bet = this.comparison(data, round);

        return this.bet;
    },

    getDifference(enemyMinBet, round) {
        return +((enemyMinBet - this.minBet) / (this.roundsCount - round)).toFixed(1);
    },

    getMinBet(bets) {
        return Math.min(...bets);
    },

    comparison(data, round) {
        const {participants, rowsCount} = data;
        const filterParticipants = participants.filter(i => i);

        const isEvery = filterParticipants.every(item => this.participants[round - 1][item.participant] === this.parse(item.betText));
        const bets = Array.from(filterParticipants, item => this.parse(item.betText));
        const betBelowOurs = Object.values(this.participants).filter(bet => bet < this.bet && bet > this.minBet);
        const filterBets = [...bets.filter(bet => bet > this.minBet), ...betBelowOurs];

        if (isEvery && bets.length + 1 === rowsCount) {
            return this.bet;
        }

        if (round < 3) {
            if ((bets.length && bets.length + 1 !== rowsCount && betBelowOurs.length) || !bets.length) {
                const minBet = this.getMinBet(filterBets);
                const myBet = minBet - this.getDifference(minBet, round);

                return myBet > this.minBet ? myBet : this.minBet;
            }

            if (bets.length && (bets.length + 1 === rowsCount || !betBelowOurs.length)) {
                const myBet = this.getMinBet(filterBets) - this.bet * (this.step / 100);
                // если конкуренты поставили стаки, а наша оказалась всё ещё ниже - оставляем ту же
                return  myBet > this.minBet ? myBet : this.minBet;
            }
        } else {
            return betBelowOurs.length ? this.minBet : this.getMinBet(filterBets) - this.bet * (this.step / 100);
        }
    }
};
