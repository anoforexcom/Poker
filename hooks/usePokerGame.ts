import { useState, useEffect, useCallback } from 'react';
import { Card, createDeck, shuffleDeck, dealCards, Suit, Rank } from '../utils/pokerLogic';

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
    isActive: boolean; // For visual positioning
    isDealer?: boolean;
}

export const usePokerGame = (initialUserBalance: number, updateGlobalBalance: (amount: number) => void) => {
    const [deck, setDeck] = useState<Card[]>([]);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('pre-flop');
    const [currentTurn, setCurrentTurn] = useState(0);
    const [minBet, setMinBet] = useState(20);
    const [winner, setWinner] = useState<Player | null>(null);

    // Initialize Players (1 Human + 4 Bots)
    const [players, setPlayers] = useState<Player[]>([
        { id: 'user', name: 'You', avatar: 'https://picsum.photos/seed/pokerhero/100/100', balance: initialUserBalance, hand: [], isFolded: false, currentBet: 0, isHuman: true, isActive: true },
        { id: 'bot1', name: 'Alex G.', avatar: 'https://picsum.photos/seed/Alex G./100/100', balance: 4230, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true },
        { id: 'bot2', name: 'Sarah L.', avatar: 'https://picsum.photos/seed/Sarah L./100/100', balance: 2800, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true },
        { id: 'bot3', name: 'Mike P.', avatar: 'https://picsum.photos/seed/Mike P./100/100', balance: 12450, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true, isDealer: true },
        { id: 'bot4', name: 'Chris T.', avatar: 'https://picsum.photos/seed/Chris T./100/100', balance: 5100, hand: [], isFolded: false, currentBet: 0, isHuman: false, isActive: true },
    ]);

    // Sync external user balance if it changes (e.g. from deposits), but only if not in a hand or match logic
    useEffect(() => {
        setPlayers(prev => prev.map(p => p.isHuman ? { ...p, balance: initialUserBalance } : p));
    }, [initialUserBalance]);

    // Start a new hand
    const startNewHand = useCallback(() => {
        const newDeck = shuffleDeck(createDeck());
        let currentDeck = newDeck;

        // Deal 2 cards to each player
        const updatedPlayers = players.map(p => {
            const { hand, remainingDeck } = dealCards(currentDeck, 2);
            currentDeck = remainingDeck;
            return { ...p, hand, isFolded: false, currentBet: 0 };
        });

        // Blinds (simplified: Player 1 and 2 pay blinds)
        // For now, let's just make everyone pay an ante to keep it simple, or stick to no blinds for MVP

        setDeck(currentDeck);
        setPlayers(updatedPlayers);
        setCommunityCards([]);
        setPot(0);
        setPhase('pre-flop');
        setCurrentTurn(0); // Starts with human for MVP simplicity
    }, []);

    // Proceed to next phase
    const nextPhase = () => {
        let dealCount = 0;
        if (phase === 'pre-flop') dealCount = 3; // Flop
        else if (phase === 'flop') dealCount = 1; // Turn
        else if (phase === 'turn') dealCount = 1; // River

        if (dealCount > 0) {
            const { hand, remainingDeck } = dealCards(deck, dealCount);
            setDeck(remainingDeck);
            setCommunityCards(prev => [...prev, ...hand]);
        }

        if (phase === 'pre-flop') setPhase('flop');
        else if (phase === 'flop') setPhase('turn');
        else if (phase === 'turn') setPhase('river');
        else if (phase === 'river') setPhase('showdown');

        // Reset bets for new round
        setCurrentTurn(0);
    };

    const currentPlayer = players[currentTurn];

    // Actions
    const handlePlayerAction = (action: 'fold' | 'call' | 'raise', amount: number = 0) => {
        if (currentPlayer.isHuman) {
            if (action === 'fold') {
                setPlayers(prev => prev.map((p, i) => i === currentTurn ? { ...p, isFolded: true } : p));
            } else if (action === 'call') {
                // Deduct from balance
                // For MVP, we assume call matches minBet
                if (currentPlayer.balance >= minBet) {
                    updateGlobalBalance(-minBet);
                    setPot(prev => prev + minBet);
                    setPlayers(prev => prev.map((p, i) => i === currentTurn ? { ...p, balance: p.balance - minBet, currentBet: p.currentBet + minBet } : p));
                }
            } else if (action === 'raise') {
                if (currentPlayer.balance >= amount) {
                    updateGlobalBalance(-amount);
                    setPot(prev => prev + amount);
                    setMinBet(amount); // Raise the stakes
                    setPlayers(prev => prev.map((p, i) => i === currentTurn ? { ...p, balance: p.balance - amount, currentBet: p.currentBet + amount } : p));
                }
            }
        }

        // Move to next player
        let nextTurn = (currentTurn + 1) % players.length;

        // Skip folded players (simple check)
        let loops = 0;
        while (players[nextTurn].isFolded && loops < players.length) {
            nextTurn = (nextTurn + 1) % players.length;
            loops++;
        }

        // If back to start or everyone acted (simplified round logic)
        if (nextTurn === 0) {
            nextPhase();
        } else {
            setCurrentTurn(nextTurn);
            // Trigger Bot Action here if needed
        }
    };

    // Bot Logic Effect
    // Bot Logic & Showdown Effect
    useEffect(() => {
        // Determine winner at showdown
        if (phase === 'showdown' && !winner) {
            // Simple Random Winner for MVP
            const activePlayers = players.filter(p => !p.isFolded);
            if (activePlayers.length > 0) {
                const randomWinner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
                setWinner(randomWinner);

                // Award pot
                if (randomWinner.isHuman) {
                    updateGlobalBalance(pot);
                } else {
                    // Update bot balance locally
                    setPlayers(prev => prev.map(p => p.id === randomWinner.id ? { ...p, balance: p.balance + pot } : p));
                }
            } else {
                startNewHand();
            }
        }

        if (!currentPlayer.isHuman && !currentPlayer.isFolded && phase !== 'showdown') {
            const timer = setTimeout(() => {
                // Simple Bot Logic: Random Call or Fold
                const decision = Math.random() > 0.3 ? 'call' : 'fold';

                setPlayers(prev => prev.map((p, i) => i === currentTurn ? {
                    ...p,
                    isFolded: decision === 'fold',
                    currentBet: decision === 'call' ? minBet : 0,
                    balance: decision === 'call' ? p.balance - minBet : p.balance
                } : p));

                if (decision === 'call') setPot(prev => prev + minBet);

                // Move turn
                let nextTurn = (currentTurn + 1) % players.length;
                let loops = 0;
                while (players[nextTurn].isFolded && loops < players.length) {
                    nextTurn = (nextTurn + 1) % players.length;
                    loops++;
                }

                if (nextTurn === 0) {
                    nextPhase();
                } else {
                    setCurrentTurn(nextTurn);
                }

            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentTurn, phase, players, winner, minBet, pot]);

    return {
        players,
        communityCards,
        pot,
        phase,
        currentTurn,
        startNewHand: () => {
            setWinner(null);
            startNewHand();
        },
        handlePlayerAction,
        winner
    };
};
