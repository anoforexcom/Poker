const PokerEvaluator = require("poker-evaluator");

function evaluate(cards) {
    return PokerEvaluator.evalHand(cards);
}

module.exports = { evaluate };
