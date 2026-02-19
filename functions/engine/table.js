const { createDeck } = require("./deck");
const { evaluate } = require("./handEvaluator");
const { botDecision } = require("./bots");

class Table {

    constructor(initialState = null) {
        if (initialState) {
            this.fromState(initialState);
        } else {
            this.players = [];
            this.deck = [];
            this.pot = 0;
            this.currentBet = 0;
            this.communityCards = [];
            this.phase = "waiting";
            this.dealerPosition = 0;
            this.smallBlind = 10;
            this.bigBlind = 20;
        }
    }

    fromState(state) {
        this.players = state.players || [];
        this.deck = state.deck || [];
        this.pot = state.pot || 0;
        this.currentBet = state.currentBet || 0;
        this.communityCards = state.communityCards || [];
        this.phase = state.phase || "waiting";
        this.dealerPosition = state.dealerPosition || 0;
        this.smallBlind = state.smallBlind || 10;
        this.bigBlind = state.bigBlind || 20;
    }

    toState() {
        return {
            players: this.players,
            deck: this.deck,
            pot: this.pot,
            currentBet: this.currentBet,
            communityCards: this.communityCards,
            phase: this.phase,
            dealerPosition: this.dealerPosition,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind
        };
    }

    addPlayer(player) {
        this.players.push(player);
    }

    startHand() {

        this.deck = createDeck();
        this.pot = 0;
        this.communityCards = [];
        this.currentBet = 0;
        this.phase = "preflop";

        this.players.forEach(p => {
            p.cards = [this.deck.pop(), this.deck.pop()];
            p.currentBet = 0;
            p.hasFolded = false;
            p.isAllIn = false;
        });

        this.postBlinds();
    }

    postBlinds() {

        const sbIndex = (this.dealerPosition + 1) % this.players.length;
        const bbIndex = (this.dealerPosition + 2) % this.players.length;

        this.bet(this.players[sbIndex], this.smallBlind);
        this.bet(this.players[bbIndex], this.bigBlind);

        this.currentBet = this.bigBlind;
    }

    bet(player, amount) {

        const betAmount = Math.min(amount, player.stack);

        player.stack -= betAmount;
        player.currentBet += betAmount;
        this.pot += betAmount;

        if (player.stack === 0) {
            player.isAllIn = true;
        }
    }

    playerAction(player, action, amount = 0) {

        if (action === "fold") {
            player.hasFolded = true;
        }

        if (action === "call") {
            const diff = this.currentBet - player.currentBet;
            this.bet(player, diff);
        }

        if (action === "raise") {
            const diff = this.currentBet - player.currentBet + amount;
            this.currentBet += amount;
            this.bet(player, diff);
        }

        if (action === "check") {
            // nada
        }
    }

    nextPhase() {

        this.players.forEach(p => p.currentBet = 0);
        this.currentBet = 0;

        if (this.phase === "preflop") {
            this.communityCards = [
                this.deck.pop(),
                this.deck.pop(),
                this.deck.pop()
            ];
            this.phase = "flop";
        }
        else if (this.phase === "flop") {
            this.communityCards.push(this.deck.pop());
            this.phase = "turn";
        }
        else if (this.phase === "turn") {
            this.communityCards.push(this.deck.pop());
            this.phase = "river";
        }
        else if (this.phase === "river") {
            this.phase = "showdown";
            this.handleShowdown();
        }
    }

    handleShowdown() {

        const activePlayers = this.players.filter(p => !p.hasFolded);

        let best = null;
        let winner = null;

        activePlayers.forEach(p => {
            const result = evaluate([...p.cards, ...this.communityCards]);

            if (!best || result.value > best.value) {
                best = result;
                winner = p;
            }
        });

        if (winner) {
            winner.stack += this.pot;
        }
        this.pot = 0;
    }

}

module.exports = { Table };
