const { evaluate } = require("./handEvaluator");

function botDecision(bot, table) {
    if (bot.hasFolded || bot.isAllIn) return null;

    const toCall = table.currentBet - bot.currentBet;
    const pot = table.pot;
    const stack = bot.stack;

    // Evaluation
    const handResult = evaluate([...bot.cards, ...table.communityCards]);
    const handStrength = handResult.value; // Higher is better

    // Basic Strategy
    // preflop: handResult.value depends on 2 cards (handEvaluator might need 5+, 
    // but poker-evaluator usually handles it)

    // Low strength threshold (e.g., High Card with bad kickers)
    const IS_WEAK = handResult.handName === "high card";
    const IS_MEDIUM = ["one pair", "two pair"].includes(handResult.handName);
    const IS_STRONG = !IS_WEAK && !IS_MEDIUM;

    // Pre-flop specific (simplified)
    if (table.communityCards.length === 0) {
        const cardRank1 = bot.cards[0][0];
        const cardRank2 = bot.cards[1][0];
        const isPair = cardRank1 === cardRank2;
        const isHigh = ["A", "K", "Q", "J", "T"].includes(cardRank1) || ["A", "K", "Q", "J", "T"].includes(cardRank2);

        if (isPair || (isHigh && toCall < stack * 0.2)) {
            if (isPair && ["A", "K", "Q"].includes(cardRank1)) {
                return { action: "raise", amount: table.bigBlind * 2 };
            }
            return { action: "call" };
        }

        if (toCall === 0) return { action: "check" };
        if (toCall > table.bigBlind * 2) return { action: "fold" };
        return { action: "call" };
    }

    // Post-flop logic
    if (IS_STRONG) {
        // Very strong hand: Raise or Call
        if (Math.random() > 0.3) {
            return { action: "raise", amount: Math.max(table.bigBlind, Math.floor(pot * 0.5)) };
        }
        return { action: "call" };
    }

    if (IS_MEDIUM) {
        // Mid hand: Call or Check
        if (toCall > stack * 0.3) return { action: "fold" };
        if (toCall === 0) return { action: "check" };
        return { action: "call" };
    }

    // Weak hand: Fold or Check (maybe bluff?)
    if (toCall === 0) {
        // Rare bluff on check
        if (Math.random() < 0.1) return { action: "raise", amount: table.bigBlind };
        return { action: "check" };
    }

    // Semi-bluff/Draw chasing (simplified)
    if (toCall < pot * 0.1 && Math.random() < 0.2) {
        return { action: "call" };
    }

    return { action: "fold" };
}

module.exports = { botDecision };
