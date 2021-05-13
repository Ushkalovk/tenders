class Algorithm {
    constructor(minBet) {
        this.myName = ['Ви', 'ООО Промэлектроника'];
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
        const bets = this.comparison(data, round);
        this.bet = bets.bet;

        return bets;
    }

    getDifference(enemyMinBet, round) {
        console.log(enemyMinBet, ' Min bet')
        console.log(round, ' Round')

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
        console.log(bets, "  Bets 000");
        console.log(filterBets, "  FilterBets 000");



        if (!betBelowOurs.length && isEveryUnderOurs) {
            console.log(betBelowOurs, isEveryUnderOurs, filterParticipants, '3')

            return {bet: this.bet, allow: false};
        }

        console.log(filterParticipants, isEveryUnderOurs, this.bet, ': filterParticipants, isEveryUnderOurs', 'myBet')


        if (round < 3) {
            console.log(bets, "  Bets");
            if ((bets.length && bets.length + 1 !== participants.length && betBelowOurs.length) || !bets.length) {
                console.log(filterBets, betBelowOurs, bets, '1');
                const minBet = this.getMinBet(filterBets);
                const myBet = minBet - this.getDifference(minBet, round);
                console.log(this.getDifference(minBet, round), '  Difference')
                console.log(myBet, 'myBet')

                return {bet: Math.max(Math.min(myBet, this.bet - this.step - 5), this.minBet), allow: true};
            }

            if (bets.length && (bets.length + 1 === participants.length || !betBelowOurs.length)) {
                console.log(filterBets, betBelowOurs, bets, '2');
                const myBet = this.getMinBet(filterBets) - this.step;
                console.log(myBet, 'myBet')
                // если конкуренты поставили стаки, а наша оказалась всё ещё ниже - оставляем ту же
                return {bet: Math.max(Math.min(myBet, this.bet - this.step - 5), this.minBet), allow: true};
            }
        } else {
            return betBelowOurs.length ?
                {bet: this.minBet, allow: true} :
                {
                    bet: this.getMinBet(filterBets) - this.step,
                    allow: true
                };
        }
    }
}

module.exports = Algorithm;
