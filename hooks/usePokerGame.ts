import { useState, useEffect, useCallback } from 'react';
import { Card, createDeck, shuffleDeck, dealCards, evaluateHand, compareHands, HandRank } from '../utils/pokerLogic';
import { generateBotName } from '../utils/nameGenerator';

export type GamePhase = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface Player {
    id: string;
    name: string;
    avatar: string;
    balance: number;
    hand: Card[];
    isFolded: boolean;
    currentBet: number;
    isHuman: boolean;
    isActive: boolean;
    isDealer?: boolean;
    hasActed?: boolean; // Track if player has acted this round
}

const SMALL_BLIND = 10;
const BIG_BLIND = 20;

export const usePokerGame = (initialUserBalance: number, updateGlobalBalance: (amount: number) => void) => {
    const [deck, setDeck] = useState<Card[]>([]);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('pre-flop');
    const [currentTurn, setCurrentTurn] = useState(0);
    const [currentBet, setCurrentBet] = useState(BIG_BLIND); // Track current bet to match
    const [dealerPosition, setDealerPosition] = useState(3); // Dealer button position
    const [lastRaiser, setLastRaiser] = useState<number | null>(null); // Who raised last
    const [winner, setWinner] = useState<Player | null>(null);
    const [winningHand, setWinningHand] = useState<HandRank | null>(null);

    // Initialize Players (1 Human + 4 Bots)
    const [players, setPlayers] = useState<Player[]>([
        { id: 'user', name: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hero', balance: initialUserBalance, hand: [], isFolded: false, currentBet: 0, isHuman: true, isActive: true, hasActed: false },
        { id: 'bot1', name: generateBotName(), avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot1`, balance: 4230, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true, hasActed: false },
        { id: 'bot2', name: generateBotName(), avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot2`, balance: 2800, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true, hasActed: false },
        { id: 'bot3', name: generateBotName(), avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot3`, balance: 12450, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true, hasActed: false, isDealer: true },
        { id: 'bot4', name: generateBotName(), avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot4`, balance: 5100, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true, hasActed: false },
    ]);

    // Sync external user balance
    useEffect(() => {
        setPlayers(prev => prev.map(p => p.isHuman ? { ...p, balance: initialUserBalance } : p));
    }, [initialUserBalance]);

    // Start a new hand
    const startNewHand = useCallback(() => {
        const newDeck = shuffleDeck(createDeck());
        let currentDeck = newDeck;

        // Rotate dealer button
        const newDealerPos = (dealerPosition + 1) % players.length;
        setDealerPosition(newDealerPos);

        // Deal 2 cards to each player
        const updatedPlayers = players.map((p, index) => {
            const { hand, remainingDeck } = dealCards(currentDeck, 2);
            currentDeck = remainingDeck;
            return {
                ...p,
                hand,
                isFolded: false,
                currentBet: 0,
                isDealer: index === newDealerPos,
                hasActed: false
            };
        });

        // Post blinds
        const smallBlindPos = (newDealerPos + 1) % players.length;
        const bigBlindPos = (newDealerPos + 2) % players.length;

        updatedPlayers[smallBlindPos].currentBet = SMALL_BLIND;
        updatedPlayers[smallBlindPos].balance -= SMALL_BLIND;
        updatedPlayers[bigBlindPos].currentBet = BIG_BLIND;
        updatedPlayers[bigBlindPos].balance -= BIG_BLIND;

        // Update human balance if they posted blind
        if (updatedPlayers[smallBlindPos].isHuman) {
            updateGlobalBalance(-SMALL_BLIND);
        }
        if (updatedPlayers[bigBlindPos].isHuman) {
            updateGlobalBalance(-BIG_BLIND);
        }

        setDeck(currentDeck);
        setPlayers(updatedPlayers);
        setCommunityCards([]);
        setPot(SMALL_BLIND + BIG_BLIND);
        setPhase('pre-flop');
        setCurrentBet(BIG_BLIND);

        // Start action after big blind
        const firstToAct = (newDealerPos + 3) % players.length;
        setCurrentTurn(firstToAct);
        setLastRaiser(bigBlindPos); // Big blind is initial "raiser"
    }, [dealerPosition, players, updateGlobalBalance]);

    // Check if betting round is complete
    const isBettingRoundComplete = () => {
        const activePlayers = players.filter(p => !p.isFolded);

        // All players have acted and matched current bet
        return activePlayers.every(p =>
            p.hasActed && (p.currentBet === currentBet || p.balance === 0)
        );
    };

    // Proceed to next phase
    const nextPhase = () => {
        let dealCount = 0;
        let nextPhaseValue: GamePhase = phase;

        if (phase === 'pre-flop') {
            dealCount = 3; // Flop
            nextPhaseValue = 'flop';
        } else if (phase === 'flop') {
            dealCount = 1; // Turn
            nextPhaseValue = 'turn';
        } else if (phase === 'turn') {
            dealCount = 1; // River
            nextPhaseValue = 'river';
        } else if (phase === 'river') {
            nextPhaseValue = 'showdown';
        }

        if (dealCount > 0) {
            const { hand, remainingDeck } = dealCards(deck, dealCount);
            setDeck(remainingDeck);
            setCommunityCards(prev => [...prev, ...hand]);
        }

        setPhase(nextPhaseValue);

        // Reset for new betting round
        setPlayers(prev => prev.map(p => ({ ...p, hasActed: false })));
        setCurrentBet(0);
        setLastRaiser(null);

        // Start action after dealer
        const firstToAct = (dealerPosition + 1) % players.length;
        let nextPlayer = firstToAct;

        // Find first active player
        let loops = 0;
        while (players[nextPlayer].isFolded && loops < players.length) {
            nextPlayer = (nextPlayer + 1) % players.length;
            loops++;
        }

        setCurrentTurn(nextPlayer);
    };

    // Handle player action
    const handlePlayerAction = (action: 'fold' | 'call' | 'raise' | 'check', amount: number = 0) => {
        const currentPlayer = players[currentTurn];
        if (!currentPlayer || currentPlayer.isFolded) return;

        let updatedPlayers = [...players];
        let addToPot = 0;

        if (action === 'fold') {
            updatedPlayers[currentTurn] = { ...currentPlayer, isFolded: true, hasActed: true };
        } else if (action === 'check') {
            // Can only check if current bet is 0 or player has already matched
            if (currentBet === 0 || currentPlayer.currentBet === currentBet) {
                updatedPlayers[currentTurn] = { ...currentPlayer, hasActed: true };
            }
        } else if (action === 'call') {
            const amountToCall = currentBet - currentPlayer.currentBet;
            const actualCall = Math.min(amountToCall, currentPlayer.balance);

            updatedPlayers[currentTurn] = {
                ...currentPlayer,
                currentBet: currentPlayer.currentBet + actualCall,
                balance: currentPlayer.balance - actualCall,
                hasActed: true
            };

            addToPot = actualCall;

            if (currentPlayer.isHuman) {
                updateGlobalBalance(-actualCall);
            }
        } else if (action === 'raise') {
            const totalBet = Math.min(amount, currentPlayer.balance);
            const addAmount = totalBet - currentPlayer.currentBet;

            updatedPlayers[currentTurn] = {
                ...currentPlayer,
                currentBet: totalBet,
                balance: currentPlayer.balance - addAmount,
                hasActed: true
            };

            // Reset hasActed for all other players (they need to respond to raise)
            updatedPlayers = updatedPlayers.map((p, i) =>
                i === currentTurn ? p : { ...p, hasActed: false }
            );

            setCurrentBet(totalBet);
            setLastRaiser(currentTurn);
            addToPot = addAmount;

            if (currentPlayer.isHuman) {
                updateGlobalBalance(-addAmount);
            }
        }

        setPlayers(updatedPlayers);
        setPot(prev => prev + addToPot);

        // Check if only one player left
        const activePlayers = updatedPlayers.filter(p => !p.isFolded);
        if (activePlayers.length === 1) {
            setPhase('showdown');
            return;
        }

        // Move to next player
        let nextTurn = (currentTurn + 1) % players.length;
        let loops = 0;

        while (updatedPlayers[nextTurn].isFolded && loops < players.length) {
            nextTurn = (nextTurn + 1) % players.length;
            loops++;
        }

        setCurrentTurn(nextTurn);

        // Check if betting round complete
        setTimeout(() => {
            const allActed = updatedPlayers.filter(p => !p.isFolded).every(p =>
                p.hasActed && (p.currentBet === currentBet || p.balance === 0)
            );

            if (allActed) {
                if (phase === 'river') {
                    setPhase('showdown');
                } else {
                    nextPhase();
                }
            }
        }, 100);
    };

    // Bot Logic
    useEffect(() => {
        const currentPlayer = players[currentTurn];

        if (!currentPlayer || currentPlayer.isHuman || currentPlayer.isFolded || phase === 'showdown') {
            return;
        }

        const timer = setTimeout(() => {
            const amountToCall = currentBet - currentPlayer.currentBet;

            // Simple bot AI
            const random = Math.random();

            if (amountToCall === 0) {
                // Can check
                if (random > 0.3) {
                    handlePlayerAction('check');
                } else {
                    // Small raise
                    handlePlayerAction('raise', currentBet + BIG_BLIND);
                }
            } else if (amountToCall > currentPlayer.balance * 0.5) {
                // Too expensive, likely fold
                if (random > 0.7) {
                    handlePlayerAction('call');
                } else {
                    handlePlayerAction('fold');
                }
            } else {
                // Affordable
                if (random > 0.2) {
                    handlePlayerAction('call');
                } else {
                    handlePlayerAction('fold');
                }
            }
        }, 1000 + Math.random() * 1000);

        return () => clearTimeout(timer);
    }, [currentTurn, phase, players, currentBet]);

    // Showdown Logic
    useEffect(() => {
        if (phase === 'showdown' && !winner) {
            const activePlayers = players.filter(p => !p.isFolded);

            if (activePlayers.length === 1) {
                // Only one player left, they win
                const theWinner = activePlayers[0];
                setWinner(theWinner);

                if (theWinner.isHuman) {
                    updateGlobalBalance(pot);
                } else {
                    setPlayers(prev => prev.map(p =>
                        p.id === theWinner.id ? { ...p, balance: p.balance + pot } : p
                    ));
                }
            } else {
                // Evaluate hands
                const evaluations = activePlayers.map(p => ({
                    player: p,
                    hand: evaluateHand(p.hand, communityCards)
                }));

                let bestEval = evaluations[0];
                for (let i = 1; i < evaluations.length; i++) {
                    if (compareHands(evaluations[i].hand, bestEval.hand) > 0) {
                        bestEval = evaluations[i];
                    }
                }

                setWinner(bestEval.player);
                setWinningHand(bestEval.hand);

                if (bestEval.player.isHuman) {
                    updateGlobalBalance(pot);
                } else {
                    setPlayers(prev => prev.map(p =>
                        p.id === bestEval.player.id ? { ...p, balance: p.balance + pot } : p
                    ));
                }
            }
        }
    }, [phase, winner, players, communityCards, pot, updateGlobalBalance]);

    return {
        players,
        communityCards,
        pot,
        phase,
        currentTurn,
        currentBet,
        startNewHand: () => {
            setWinner(null);
            setWinningHand(null);
            startNewHand();
        },
        handlePlayerAction,
        winner,
        winningHand
    };
};
