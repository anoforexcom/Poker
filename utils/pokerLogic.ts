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

// Simplified Hand Ranking Logic (Placeholder for full evaluator)
// Returns a numeric score for comparison
export const evaluateHandStrength = (holeCards: Card[], communityCards: Card[]): number => {
    // This is a dummy implementation. 
    // In a real app, this would detect pairs, straights, flush, etc.
    const allCards = [...holeCards, ...communityCards];
    const highCard = Math.max(...allCards.map(c => c.value));
    return highCard;
};
