export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number; // For comparison (2-14)
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const createDeck = (): Card[] => {
    const deck: Card[] = [];
    RANKS.forEach((rank, index) => {
        SUITS.forEach(suit => {
            deck.push({
                suit,
                rank,
                value: index + 2 // 2=2, ..., A=14
            });
        });
    });
    return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

export const dealCards = (deck: Card[], count: number): { hand: Card[], remainingDeck: Card[] } => {
    const hand = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return { hand, remainingDeck };
};

// Hand ranking types
export enum HandRanking {
    HIGH_CARD = 1,
    ONE_PAIR = 2,
    TWO_PAIR = 3,
    THREE_OF_KIND = 4,
    STRAIGHT = 5,
    FLUSH = 6,
    FULL_HOUSE = 7,
    FOUR_OF_KIND = 8,
    STRAIGHT_FLUSH = 9,
    ROYAL_FLUSH = 10
}

export interface HandRank {
    ranking: HandRanking;
    values: number[]; // For tie-breaking (e.g., [14, 13, 12] for A-K-Q high card)
    name: string;
}

// Helper: Count card values
const countValues = (cards: Card[]): Map<number, number> => {
    const counts = new Map<number, number>();
    cards.forEach(card => {
        counts.set(card.value, (counts.get(card.value) || 0) + 1);
    });
    return counts;
};

// Helper: Check if flush
const isFlush = (cards: Card[]): boolean => {
    const suits = new Set(cards.map(c => c.suit));
    return suits.size === 1;
};

// Helper: Check if straight
const isStraight = (cards: Card[]): boolean => {
    const values = cards.map(c => c.value).sort((a, b) => a - b);

    // Check regular straight
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i + 1] - values[i] !== 1) {
            // Check for A-2-3-4-5 (wheel)
            if (values[0] === 2 && values[values.length - 1] === 14) {
                const wheelValues = [2, 3, 4, 5, 14];
                return wheelValues.every(v => values.includes(v));
            }
            return false;
        }
    }
    return true;
};

// Evaluate best 5-card hand from 7 cards
export const evaluateHand = (holeCards: Card[], communityCards: Card[]): HandRank => {
    const allCards = [...holeCards, ...communityCards];

    // Generate all 5-card combinations
    const combinations: Card[][] = [];
    for (let i = 0; i < allCards.length; i++) {
        for (let j = i + 1; j < allCards.length; j++) {
            for (let k = j + 1; k < allCards.length; k++) {
                for (let l = k + 1; l < allCards.length; l++) {
                    for (let m = l + 1; m < allCards.length; m++) {
                        combinations.push([allCards[i], allCards[j], allCards[k], allCards[l], allCards[m]]);
                    }
                }
            }
        }
    }

    // Evaluate each combination and find best
    let bestHand: HandRank = { ranking: HandRanking.HIGH_CARD, values: [0], name: 'High Card' };

    combinations.forEach(combo => {
        const hand = evaluateFiveCards(combo);
        if (compareHands(hand, bestHand) > 0) {
            bestHand = hand;
        }
    });

    return bestHand;
};

// Evaluate a specific 5-card hand
const evaluateFiveCards = (cards: Card[]): HandRank => {
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const values = sorted.map(c => c.value);
    const counts = countValues(cards);
    const countArray = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0]);

    const flush = isFlush(cards);
    const straight = isStraight(cards);

    // Royal Flush: A-K-Q-J-10 same suit
    if (flush && straight && values.includes(14) && values.includes(13)) {
        return { ranking: HandRanking.ROYAL_FLUSH, values: [14], name: 'Royal Flush' };
    }

    // Straight Flush
    if (flush && straight) {
        return { ranking: HandRanking.STRAIGHT_FLUSH, values: [Math.max(...values)], name: 'Straight Flush' };
    }

    // Four of a Kind
    if (countArray[0][1] === 4) {
        return {
            ranking: HandRanking.FOUR_OF_KIND,
            values: [countArray[0][0], countArray[1][0]],
            name: 'Four of a Kind'
        };
    }

    // Full House
    if (countArray[0][1] === 3 && countArray[1][1] === 2) {
        return {
            ranking: HandRanking.FULL_HOUSE,
            values: [countArray[0][0], countArray[1][0]],
            name: 'Full House'
        };
    }

    // Flush
    if (flush) {
        return { ranking: HandRanking.FLUSH, values, name: 'Flush' };
    }

    // Straight
    if (straight) {
        // Handle A-2-3-4-5 (wheel) - Ace is low
        if (values.includes(14) && values.includes(2)) {
            return { ranking: HandRanking.STRAIGHT, values: [5], name: 'Straight' };
        }
        return { ranking: HandRanking.STRAIGHT, values: [Math.max(...values)], name: 'Straight' };
    }

    // Three of a Kind
    if (countArray[0][1] === 3) {
        return {
            ranking: HandRanking.THREE_OF_KIND,
            values: [countArray[0][0], countArray[1][0], countArray[2][0]],
            name: 'Three of a Kind'
        };
    }

    // Two Pair
    if (countArray[0][1] === 2 && countArray[1][1] === 2) {
        return {
            ranking: HandRanking.TWO_PAIR,
            values: [countArray[0][0], countArray[1][0], countArray[2][0]],
            name: 'Two Pair'
        };
    }

    // One Pair
    if (countArray[0][1] === 2) {
        return {
            ranking: HandRanking.ONE_PAIR,
            values: [countArray[0][0], countArray[1][0], countArray[2][0], countArray[3][0]],
            name: 'One Pair'
        };
    }

    // High Card
    return { ranking: HandRanking.HIGH_CARD, values, name: 'High Card' };
};

// Compare two hands: returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
export const compareHands = (hand1: HandRank, hand2: HandRank): number => {
    if (hand1.ranking > hand2.ranking) return 1;
    if (hand1.ranking < hand2.ranking) return -1;

    // Same ranking, compare kickers
    for (let i = 0; i < Math.min(hand1.values.length, hand2.values.length); i++) {
        if (hand1.values[i] > hand2.values[i]) return 1;
        if (hand1.values[i] < hand2.values[i]) return -1;
    }

    return 0; // Perfect tie
};

// Find winners among multiple players (supports ties)
export const findWinners = (players: { hand: Card[], communityCards: Card[] }[]): number[] => {
    if (players.length === 0) return [];

    const evaluations = players.map(p => evaluateHand(p.hand, p.communityCards));

    let winnersIndices: number[] = [0];
    let bestHand = evaluations[0];

    for (let i = 1; i < evaluations.length; i++) {
        const comparison = compareHands(evaluations[i], bestHand);
        if (comparison > 0) {
            winnersIndices = [i];
            bestHand = evaluations[i];
        } else if (comparison === 0) {
            winnersIndices.push(i);
        }
    }

    return winnersIndices;
};

