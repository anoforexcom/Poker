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
            this.pots = [{ amount: 0, eligiblePlayers: [] }];
            this.currentBet = 0;
            this.communityCards = [];
            this.phase = "waiting";
            this.dealerPosition = 0;
            this.smallBlind = 10;
            this.bigBlind = 20;
            this.minRaise = 20;
        }
    }

    fromState(state) {
        this.players = state.players || [];
        this.deck = state.deck || [];
        this.pots = state.pots || [{ amount: 0, eligiblePlayers: [] }];
        this.currentBet = state.currentBet || 0;
        this.communityCards = state.communityCards || [];
        this.phase = state.phase || "waiting";
        this.dealerPosition = state.dealerPosition || 0;
        this.smallBlind = state.smallBlind || 10;
        this.bigBlind = state.bigBlind || 20;
        this.minRaise = state.minRaise || 20;
    }

    toState() {
        return {
            players: this.players,
            deck: this.deck,
            pots: this.pots,
            currentBet: this.currentBet,
            communityCards: this.communityCards,
            phase: this.phase,
            dealerPosition: this.dealerPosition,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind,
            minRaise: this.minRaise
        };
    }

    get pot() {
        return this.pots.reduce((sum, p) => sum + p.amount, 0);
    }

    addPlayer(player) {
        this.players.push({
            ...player,
            currentBet: 0,
            totalHandBet: 0,
            hasFolded: false,
            isAllIn: false,
            acted: false
        });
    }

    startHand() {
        this.deck = createDeck();
        this.pots = [{ amount: 0, eligiblePlayers: this.players.map(p => p.id) }];
        this.communityCards = [];
        this.currentBet = 0;
        this.minRaise = this.bigBlind;
        this.phase = "preflop";

        this.players.forEach(p => {
            p.cards = [this.deck.pop(), this.deck.pop()];
            p.currentBet = 0;
            p.totalHandBet = 0;
            p.hasFolded = false;
            p.isAllIn = false;
            p.acted = false;
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
        player.totalHandBet += betAmount;

        // Add to main pot (side pots handled at end of round or when all-in happens)
        this.pots[0].amount += betAmount;

        if (player.stack === 0) {
            player.isAllIn = true;
        }
    }

    playerAction(player, action, amount = 0) {
        player.acted = true;

        if (action === "fold") {
            player.hasFolded = true;
            // Remove from all pots
            this.pots.forEach(pot => {
                pot.eligiblePlayers = pot.eligiblePlayers.filter(id => id !== player.id);
            });
        }

        if (action === "call") {
            const diff = this.currentBet - player.currentBet;
            this.bet(player, diff);
        }

        if (action === "raise") {
            const raiseAmount = amount;
            const totalBet = this.currentBet + raiseAmount;
            const diff = totalBet - player.currentBet;

            this.currentBet = totalBet;
            this.minRaise = Math.max(this.bigBlind, raiseAmount);
            this.bet(player, diff);

            // Reset "acted" for other players since bet increased
            this.players.forEach(p => {
                if (p.id !== player.id && !p.hasFolded && !p.isAllIn) {
                    p.acted = false;
                }
            });
        }

        if (action === "check") {
            // nada
        }
    }

    // Side pot calculation logic
    calculateSidePots() {
        // Collect all chips from current round into pots
        // This is a simplified version: in a full engine, we'd do this carefully
        // For now, let's just handle the all-in case at end of round
        const activePlayers = this.players.filter(p => !p.hasFolded);
        const allInPlayers = activePlayers.filter(p => p.isAllIn).sort((a, b) => a.totalHandBet - b.totalHandBet);

        if (allInPlayers.length === 0) return;

        // Reset pots and recalculate based on totalHandBet
        const newPots = [];
        let processedBet = 0;

        const sortedPlayers = [...activePlayers].sort((a, b) => a.totalHandBet - b.totalHandBet);

        sortedPlayers.forEach((p, i) => {
            if (p.totalHandBet > processedBet) {
                const potAmount = (p.totalHandBet - processedBet) * (sortedPlayers.length - i);
                const eligible = sortedPlayers.slice(i).map(pl => pl.id);
                newPots.push({ amount: potAmount, eligiblePlayers: eligible });
                processedBet = p.totalHandBet;
            }
        });

        if (newPots.length > 0) {
            this.pots = newPots;
        }
    }

    nextPhase() {
        this.calculateSidePots();

        this.players.forEach(p => {
            p.currentBet = 0;
            p.acted = false;
        });
        this.currentBet = 0;

        if (this.phase === "preflop") {
            this.communityCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
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
        // Process each pot from side pots to main pot
        this.pots.forEach(pot => {
            if (pot.amount <= 0) return;

            const eligiblePlayers = this.players.filter(p => pot.eligiblePlayers.includes(p.id) && !p.hasFolded);

            if (eligiblePlayers.length === 0) return;

            let bestValue = -1;
            let winners = [];

            eligiblePlayers.forEach(p => {
                const result = evaluate([...p.cards, ...this.communityCards]);
                if (result.value > bestValue) {
                    bestValue = result.value;
                    winners = [p];
                } else if (result.value === bestValue) {
                    winners.push(p);
                }
            });

            if (winners.length > 0) {
                const winPerPlayer = Math.floor(pot.amount / winners.length);
                winners.forEach(w => w.stack += winPerPlayer);

                // Handle remainder
                const remainder = pot.amount % winners.length;
                if (remainder > 0) {
                    winners[0].stack += remainder;
                }
            }
        });

        this.pots = [{ amount: 0, eligiblePlayers: [] }];
        this.phase = "waiting";
    }

}

module.exports = { Table };
