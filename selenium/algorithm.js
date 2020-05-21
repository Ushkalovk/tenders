class Algorithm {
    constructor(minBet) {
        this.myName = ['ООО Промэлектроника'];
        this.roundsCount = 4;
        this.minBet = minBet;
        this.bet = 0;
        this.step = 0;
        this.participants = {};
    }

    setStep(step) {
        this.step = step;
    }

    parse(bet) {
        return parseInt(bet.split(' ').join(''));
    }

    setUser(participant, betText, round) {
        if (!this.participants[round]) {
            this.participants[round] = {};
        }

        const isMyName = this.myName.find(name => name.toLowerCase() === participant.toLowerCase());

        isMyName ? this.bet = this.parse(betText) : this.participants[round][participant] = this.parse(betText);
    }

    getBet(data, round) {
        this.bet = this.comparison(data, round);

        return this.bet;
    }

    getDifference(enemyMinBet, round) {
        return +((enemyMinBet - this.minBet) / (this.roundsCount - round)).toFixed(1);
    }

    getMinBet(bets) {
        return Math.min(...bets);
    }

    comparison(participants, round) {
        const filterParticipants = participants.filter(i => i);

        const isEveryUnderOurs = filterParticipants.every(item => this.parse(item.betText) > this.bet);
        const bets = Array.from(filterParticipants, item => this.parse(item.betText));
        const betBelowOurs = Object.values(this.participants[round - 1]).filter(bet => bet < this.bet && bet > this.minBet);
        const filterBets = [...bets.filter(bet => bet > this.minBet), ...betBelowOurs];

        if (!betBelowOurs.length && isEveryUnderOurs) {
            console.log(betBelowOurs, isEveryUnderOurs, filterParticipants, '3')
            return this.bet;
        }

        if (round < 3) {
            if ((bets.length && bets.length + 1 !== participants.length && betBelowOurs.length) || !bets.length) {
                console.log(filterBets, betBelowOurs, bets, '1');
                const minBet = this.getMinBet(filterBets);
                const myBet = minBet - this.getDifference(minBet, round);

                return myBet > this.minBet ? myBet : this.minBet;
            }

            if (bets.length && (bets.length + 1 === participants.length || !betBelowOurs.length)) {
                console.log(filterBets, betBelowOurs, bets, '2');
                const myBet = this.getMinBet(filterBets) - this.step;
                // если конкуренты поставили стаки, а наша оказалась всё ещё ниже - оставляем ту же
                return myBet > this.minBet ? myBet : this.minBet;
            }
        } else {
            return betBelowOurs.length ? this.minBet : this.getMinBet(filterBets) - this.step;
        }
    }
}

module.exports = Algorithm;
