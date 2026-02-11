import { useState, useEffect, useCallback } from 'react';
import { Card, createDeck, shuffleDeck, dealCards, evaluateHand, compareHands, HandRank } from '../utils/pokerLogic';
import { generateBotName } from '../utils/nameGenerator';
import { BlindLevel, BlindStructureType, TOURNAMENT_BLIND_STRUCTURES, getCurrentBlinds } from '../utils/blindStructure';

export type GamePhase = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface SidePot {
    amount: number;
    eligiblePlayers: string[]; // player IDs who can win this pot
}

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
    const [sidePots, setSidePots] = useState<SidePot[]>([]);
    const [phase, setPhase] = useState<GamePhase>('pre-flop');
    const [currentTurn, setCurrentTurn] = useState(0);
    const [currentBet, setCurrentBet] = useState(BIG_BLIND); // Track current bet to match
    const [dealerPosition, setDealerPosition] = useState(3); // Dealer button position
    const [lastRaiser, setLastRaiser] = useState<number | null>(null); // Who raised last
    const [lastRaiseAmount, setLastRaiseAmount] = useState(BIG_BLIND); // Track last raise amount for minimum raise
    const [winner, setWinner] = useState<Player | null>(null);
    const [winningHand, setWinningHand] = useState<HandRank | null>(null);

    // Blind level system for tournaments
    const [blindStructureType] = useState<BlindStructureType>('regular'); // Can be made configurable
    const [blindLevel, setBlindLevel] = useState(1);
    const [levelStartTime, setLevelStartTime] = useState(Date.now());
    const [timeToNextLevel, setTimeToNextLevel] = useState(0);
    const [isTournamentMode] = useState(false); // Set to true for tournaments

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

    // Blind level timer (for tournament mode)
    useEffect(() => {
        if (!isTournamentMode) return;

        const blindStructure = TOURNAMENT_BLIND_STRUCTURES[blindStructureType];
        const currentLevel = blindStructure[blindLevel - 1];

        if (!currentLevel) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - levelStartTime;
            const levelDuration = currentLevel.duration * 60 * 1000; // Convert minutes to ms
            const remaining = levelDuration - elapsed;

            setTimeToNextLevel(Math.max(0, remaining));

            // Auto-increment blind level when time expires
            if (remaining <= 0 && blindLevel < blindStructure.length) {
                setBlindLevel(prev => prev + 1);
                setLevelStartTime(Date.now());
            }
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, [isTournamentMode, blindLevel, levelStartTime, blindStructureType]);

    // Get current blinds (dynamic based on tournament level or fixed for cash games)
    const getCurrentBlindValues = useCallback(() => {
        if (isTournamentMode) {
            const blindStructure = TOURNAMENT_BLIND_STRUCTURES[blindStructureType];
            const level = getCurrentBlinds(blindStructure, blindLevel);
            return {
                smallBlind: level.smallBlind,
                bigBlind: level.bigBlind,
                ante: level.ante
            };
        }
        return {
            smallBlind: SMALL_BLIND,
            bigBlind: BIG_BLIND,
            ante: 0
        };
    }, [isTournamentMode, blindStructureType, blindLevel]);

    // Start a new hand
    const startNewHand = useCallback(() => {
        const newDeck = shuffleDeck(createDeck());
        let currentDeck = newDeck;

        // Rotate dealer button
        const newDealerPos = (dealerPosition + 1) % players.length;
        setDealerPosition(newDealerPos);

        // Get current blind values (includes ante)
        const { smallBlind, bigBlind, ante } = getCurrentBlindValues();
        let totalAntes = 0;

        // Deal 2 cards to each player WHO HAS BALANCE
        const updatedPlayers = players.map((p, index) => {
            // Check if player has enough for at least big blind + ante
            const canPlay = p.balance >= bigBlind + ante;

            if (!canPlay) {
                // Player is broke, mark as inactive and don't deal cards
                return {
                    ...p,
                    hand: [],
                    isFolded: true, // Automatically folded
                    currentBet: 0,
                    isDealer: index === newDealerPos,
                    hasActed: true,
                    isActive: false // Mark as inactive
                };
            }

            // Charge ante from active players
            let playerBalance = p.balance;
            if (ante > 0) {
                const anteAmount = Math.min(ante, playerBalance);
                playerBalance -= anteAmount;
                totalAntes += anteAmount;

                if (p.isHuman) {
                    updateGlobalBalance(-anteAmount);
                }
            }

            const { hand, remainingDeck } = dealCards(currentDeck, 2);
            currentDeck = remainingDeck;
            return {
                ...p,
                hand,
                isFolded: false,
                currentBet: 0,
                balance: playerBalance,
                isDealer: index === newDealerPos,
                hasActed: false,
                isActive: true
            };
        });

        // Post blinds (only if players have balance)
        const smallBlindPos = (newDealerPos + 1) % players.length;
        const bigBlindPos = (newDealerPos + 2) % players.length;

        // Find next active player for small blind
        let actualSmallBlindPos = smallBlindPos;
        let loops = 0;
        while (!updatedPlayers[actualSmallBlindPos].isActive && loops < players.length) {
            actualSmallBlindPos = (actualSmallBlindPos + 1) % players.length;
            loops++;
        }

        // Find next active player for big blind
        let actualBigBlindPos = bigBlindPos;
        loops = 0;
        while (!updatedPlayers[actualBigBlindPos].isActive && loops < players.length) {
            actualBigBlindPos = (actualBigBlindPos + 1) % players.length;
            loops++;
        }

        if (updatedPlayers[actualSmallBlindPos].isActive) {
            updatedPlayers[actualSmallBlindPos].currentBet = smallBlind;
            updatedPlayers[actualSmallBlindPos].balance -= smallBlind;

            if (updatedPlayers[actualSmallBlindPos].isHuman) {
                updateGlobalBalance(-smallBlind);
            }
        }

        if (updatedPlayers[actualBigBlindPos].isActive) {
            updatedPlayers[actualBigBlindPos].currentBet = bigBlind;
            updatedPlayers[actualBigBlindPos].balance -= bigBlind;

            if (updatedPlayers[actualBigBlindPos].isHuman) {
                updateGlobalBalance(-bigBlind);
            }
        }

        setDeck(currentDeck);
        setPlayers(updatedPlayers);

        // Explicit reset of all game state
        setPot(0);
        setSidePots([]);
        setCommunityCards([]);
        setWinner(null);
        setWinningHand(null);
        setLastRaiseAmount(bigBlind);

        // Now set pot with blinds + antes
        setPot(smallBlind + bigBlind + totalAntes);
        setPhase('pre-flop');
        setCurrentBet(bigBlind);

        // Start action after big blind (find first active player)
        let firstToAct = (actualBigBlindPos + 1) % players.length;
        loops = 0;
        while ((!updatedPlayers[firstToAct].isActive || updatedPlayers[firstToAct].isFolded) && loops < players.length) {
            firstToAct = (firstToAct + 1) % players.length;
            loops++;
        }

        setCurrentTurn(firstToAct);
        setLastRaiser(actualBigBlindPos); // Big blind is initial "raiser"
    }, [dealerPosition, players, updateGlobalBalance]);

    // Calculate side pots for all-in scenarios
    const calculateSidePots = useCallback((playersInHand: Player[]): SidePot[] => {
        const activePlayers = playersInHand.filter(p => !p.isFolded && p.currentBet > 0);

        if (activePlayers.length === 0) return [];

        const pots: SidePot[] = [];

        // Sort players by their current bet (ascending)
        const sorted = [...activePlayers].sort((a, b) => a.currentBet - b.currentBet);

        let remainingPlayers = [...sorted];
        let previousBet = 0;

        while (remainingPlayers.length > 0) {
            const lowestBet = remainingPlayers[0].currentBet;
            const betDiff = lowestBet - previousBet;

            if (betDiff > 0) {
                // Calculate pot amount for this level
                const potAmount = betDiff * remainingPlayers.length;

                pots.push({
                    amount: potAmount,
                    eligiblePlayers: remainingPlayers.map(p => p.id)
                });
            }

            previousBet = lowestBet;
            // Remove players who are all-in at this level
            remainingPlayers = remainingPlayers.filter(p => p.currentBet > lowestBet);
        }

        return pots;
    }, []);

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
            const callAmount = currentBet - currentPlayer.currentBet;
            const raiseAmount = amount - currentBet;
            const minimumRaise = currentBet + lastRaiseAmount;

            // Validate minimum raise (must be at least the size of the last raise)
            // Exception: all-in is always allowed
            const totalBetWithBalance = Math.min(amount, currentPlayer.balance + currentPlayer.currentBet);
            const isAllIn = totalBetWithBalance >= currentPlayer.balance + currentPlayer.currentBet;

            if (!isAllIn && amount < minimumRaise) {
                console.warn(`Minimum raise is ${minimumRaise}. You tried to raise to ${amount}.`);
                return; // Reject invalid raise
            }

            const totalBet = Math.min(amount, currentPlayer.balance + currentPlayer.currentBet);
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

            addToPot = addAmount;

            // Update last raise amount for minimum raise validation
            const actualRaiseAmount = totalBet - currentBet;
            setLastRaiseAmount(actualRaiseAmount);
            setCurrentBet(totalBet);
            setLastRaiser(currentTurn);

            if (currentPlayer.isHuman) {
                updateGlobalBalance(-addAmount);
            }
        }

        setPlayers(updatedPlayers);
        setPot(prev => prev + addToPot);

        // Check if only one player left (active and not folded)
        const activePlayers = updatedPlayers.filter(p => !p.isFolded && p.isActive);
        if (activePlayers.length === 1) {
            setPhase('showdown');
            return;
        }

        // Move to next player (skip folded and inactive)
        let nextTurn = (currentTurn + 1) % players.length;
        let loops = 0;

        while ((updatedPlayers[nextTurn].isFolded || !updatedPlayers[nextTurn].isActive) && loops < players.length) {
            nextTurn = (nextTurn + 1) % players.length;
            loops++;
        }

        setCurrentTurn(nextTurn);

        // Betting round completion is now handled by useEffect
    };

    // Check betting round completion (replaces setTimeout to avoid race conditions)
    useEffect(() => {
        if (phase === 'showdown') return;

        const activePlayers = players.filter(p => !p.isFolded && p.isActive);

        if (activePlayers.length === 0) return;

        // Check if all active players have acted and matched the current bet
        const allActed = activePlayers.every(p =>
            p.hasActed && (p.currentBet === currentBet || p.balance === 0)
        );

        if (allActed && activePlayers.length > 0) {
            // Reset hasActed for next round
            setPlayers(prev => prev.map(p => ({ ...p, hasActed: false, currentBet: 0 })));

            // Move to next phase
            if (phase === 'river') {
                setPhase('showdown');
            } else {
                nextPhase();
            }
        }
    }, [players, currentBet, phase]);

    // Bot Logic
    useEffect(() => {
        const currentPlayer = players[currentTurn];

        if (!currentPlayer || currentPlayer.isHuman || currentPlayer.isFolded || !currentPlayer.isActive || phase === 'showdown') {
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

    // Showdown Logic with Side Pots
    useEffect(() => {
        if (phase === 'showdown' && !winner) {
            const activePlayers = players.filter(p => !p.isFolded && p.isActive);

            if (activePlayers.length === 1) {
                // Only one player left, they win entire pot
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
                // Multiple players - calculate side pots
                const pots = calculateSidePots(players);

                // If no side pots calculated, use main pot
                const potsToDistribute = pots.length > 0 ? pots : [{ amount: pot, eligiblePlayers: activePlayers.map(p => p.id) }];

                // Distribute each pot separately
                let totalWinnings = 0;
                let mainWinner: Player | null = null;
                let mainWinningHand: HandRank | null = null;

                potsToDistribute.forEach(sidePot => {
                    // Get eligible players for this pot
                    const eligiblePlayers = activePlayers.filter(p =>
                        sidePot.eligiblePlayers.includes(p.id)
                    );

                    if (eligiblePlayers.length === 0) return;

                    // Evaluate hands of eligible players
                    const evaluations = eligiblePlayers.map(p => ({
                        player: p,
                        hand: evaluateHand(p.hand, communityCards)
                    }));

                    // Find ALL winners (detect ties/split pots)
                    const winners: typeof evaluations = [];
                    let bestHand = evaluations[0].hand;

                    evaluations.forEach(evaluation => {
                        const comparison = compareHands(evaluation.hand, bestHand);
                        if (comparison > 0) {
                            // New best hand found - reset winners
                            winners.length = 0;
                            winners.push(evaluation);
                            bestHand = evaluation.hand;
                        } else if (comparison === 0) {
                            // Tie - add to winners
                            winners.push(evaluation);
                        }
                    });

                    // Split pot equally among all winners
                    const splitAmount = sidePot.amount / winners.length;

                    winners.forEach(winnerEval => {
                        if (winnerEval.player.isHuman) {
                            totalWinnings += splitAmount;
                        } else {
                            setPlayers(prev => prev.map(p =>
                                p.id === winnerEval.player.id ? { ...p, balance: p.balance + splitAmount } : p
                            ));
                        }
                    });

                    // Track main winner (for display - use first winner)
                    if (!mainWinner && winners.length > 0) {
                        mainWinner = winners[0].player;
                        mainWinningHand = winners[0].hand;
                    }
                });

                // Update human player balance if they won any pots
                if (totalWinnings > 0) {
                    updateGlobalBalance(totalWinnings);
                }

                // Set winner for display
                if (mainWinner) {
                    setWinner(mainWinner);
                    setWinningHand(mainWinningHand);
                }
            }
        }
    }, [phase, winner, players, communityCards, pot, updateGlobalBalance, calculateSidePots]);

    return {
        players,
        communityCards,
        pot,
        sidePots,
        phase,
        currentTurn,
        currentBet,
        lastRaiseAmount,
        blindLevel,
        timeToNextLevel,
        blindStructureType,
        isTournamentMode,
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
