function botDecision(bot, table) {

    if (bot.hasFolded || bot.isAllIn) return null;

    const toCall = table.currentBet - bot.currentBet;

    // pré-flop simples
    const strongHands = ["AA", "KK", "QQ", "AK"];

    const cardRank = bot.cards[0][0] + bot.cards[1][0];

    if (strongHands.includes(cardRank)) {
        return { action: "raise", amount: table.bigBlind * 3 };
    }

    if (toCall === 0) {
        return { action: "check" };
    }

    if (toCall < bot.stack * 0.1) {
        return { action: "call" };
    }

    return { action: "fold" };
}

module.exports = { botDecision };
