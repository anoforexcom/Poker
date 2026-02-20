import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Card, createDeck, shuffleDeck, dealCards,
    evaluateHand, compareHands, HandRank, HandRanking
} from '../utils/pokerLogic';
import { BlindStructureType } from '../utils/blindStructure';

export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

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
    hasActed?: boolean;
    totalContribution: number;
    isAllIn?: boolean;
}

export interface SidePot {
    amount: number;
    eligiblePlayers: string[];
}

export interface GameConfig {
    mode: 'cash' | 'tournament' | 'sitgo' | 'spingo';
    smallBlind: number;
    bigBlind: number;
    ante: number;
    startingStack: number;
    maxPlayers: number;
    blindStructureType?: BlindStructureType;
    isObserver?: boolean;
    status?: string;
}

const DEFAULT_CONFIG: GameConfig = {
    mode: 'cash',
    smallBlind: 10,
    bigBlind: 20,
    ante: 0,
    startingStack: 10000,
    maxPlayers: 6,
    blindStructureType: 'regular'
};

const BOT_NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
const BOT_AVATARS = BOT_NAMES.map((_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=bot_${i + 1}`);

// ─── Bot Decision AI ───────────────────────────────────────────────
function botDecision(bot: Player, communityCards: Card[], currentBet: number, pot: number, bigBlind: number): { action: string; amount: number } {
    if (bot.isFolded || bot.isAllIn) return { action: 'check', amount: 0 };

    const toCall = currentBet - bot.currentBet;
    const stack = bot.balance;

    // Pre-flop
    if (communityCards.length === 0) {
        const r1 = bot.hand[0]?.value || 0;
        const r2 = bot.hand[1]?.value || 0;
        const isPair = r1 === r2;
        const isHigh = r1 >= 10 || r2 >= 10;

        if (isPair && r1 >= 12) return { action: 'raise', amount: bigBlind * 3 };
        if (isPair || isHigh) {
            if (toCall === 0) return { action: 'check', amount: 0 };
            return { action: 'call', amount: 0 };
        }
        if (toCall === 0) return { action: 'check', amount: 0 };
        if (toCall > bigBlind * 3) return { action: 'fold', amount: 0 };
        return { action: 'call', amount: 0 };
    }

    // Post-flop — evaluate hand strength
    const handResult = evaluateHand(bot.hand, communityCards);

    if (handResult.ranking >= HandRanking.THREE_OF_KIND) {
        // Strong hand: raise
        if (Math.random() > 0.3) {
            return { action: 'raise', amount: Math.max(bigBlind, Math.floor(pot * 0.5)) };
        }
        if (toCall === 0) return { action: 'check', amount: 0 };
        return { action: 'call', amount: 0 };
    }

    if (handResult.ranking >= HandRanking.ONE_PAIR) {
        // Medium hand: call or check
        if (toCall > stack * 0.3) return { action: 'fold', amount: 0 };
        if (toCall === 0) return { action: 'check', amount: 0 };
        return { action: 'call', amount: 0 };
    }

    // Weak hand
    if (toCall === 0) {
        if (Math.random() < 0.1) return { action: 'raise', amount: bigBlind };
        return { action: 'check', amount: 0 };
    }
    if (toCall < pot * 0.15 && Math.random() < 0.25) return { action: 'call', amount: 0 };
    return { action: 'fold', amount: 0 };
}

// ─── Main Hook ─────────────────────────────────────────────────────
export const usePokerGame = (
    initialUserBalance: number,
    updateGlobalBalance: (amount: number) => void,
    config: GameConfig = DEFAULT_CONFIG,
    tableId: string = 'main_table',
    currentUserId?: string
) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('waiting');
    const [currentTurn, setCurrentTurn] = useState<number>(-1);
    const [currentBetState, setCurrentBetState] = useState(0);
    const [sidePots, setSidePots] = useState<SidePot[]>([]);
    const [winners, setWinners] = useState<Player[]>([]);
    const [winningHand, setWinningHand] = useState<HandRank | null>(null);
    const [turnTimeLeft, setTurnTimeLeft] = useState(30);
    const [totalTurnTime] = useState(30);
    const [blindLevel, setBlindLevel] = useState(1);
    const [timeToNextLevel, setTimeToNextLevel] = useState(0);
    const [dealerPosition, setDealerPosition] = useState(0);

    const deckRef = useRef<Card[]>([]);
    const isInitialized = useRef(false);
    const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const sb = config.smallBlind || 10;
    const bb = config.bigBlind || 20;
    const startStack = config.startingStack || 10000;

    // ─── Turn Timer with Auto-Fold ──────────────────────────────
    useEffect(() => {
        // Clear previous timer
        if (turnTimerRef.current) {
            clearInterval(turnTimerRef.current);
            turnTimerRef.current = null;
        }

        // Only start timer when it's human's turn
        const isHumanTurn = currentTurn >= 0 && players[currentTurn]?.isHuman && phase !== 'showdown' && phase !== 'waiting';
        if (!isHumanTurn) {
            setTurnTimeLeft(30);
            return;
        }

        setTurnTimeLeft(30);
        turnTimerRef.current = setInterval(() => {
            setTurnTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up — auto-fold (or check if no bet to call)
                    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
                    turnTimerRef.current = null;
                    console.log('[POKER_CLIENT] Time expired! Auto-folding.');
                    setTimeout(() => {
                        if (currentBetState === 0) {
                            handlePlayerAction('check');
                        } else {
                            handlePlayerAction('fold');
                        }
                    }, 100);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (turnTimerRef.current) {
                clearInterval(turnTimerRef.current);
                turnTimerRef.current = null;
            }
        };
    }, [currentTurn, phase]);

    // ─── Initialize Table with Bots ─────────────────────────────
    useEffect(() => {
        if (isInitialized.current || !currentUserId) return;
        isInitialized.current = true;

        console.log('[POKER_CLIENT] Initializing table with bots for user:', currentUserId);

        const initialPlayers: Player[] = [
            {
                id: currentUserId,
                name: 'You',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`,
                balance: startStack,
                hand: [],
                isFolded: false,
                currentBet: 0,
                isHuman: true,
                isActive: true,
                isDealer: false,
                hasActed: false,
                totalContribution: 0,
                isAllIn: false,
            },
            ...BOT_NAMES.map((name, i) => ({
                id: `bot_${i + 1}`,
                name,
                avatar: BOT_AVATARS[i],
                balance: startStack,
                hand: [] as Card[],
                isFolded: false,
                currentBet: 0,
                isHuman: false,
                isActive: true,
                isDealer: false,
                hasActed: false,
                totalContribution: 0,
                isAllIn: false,
            }))
        ];

        setPlayers(initialPlayers);

        // Auto-start first hand after a short delay
        setTimeout(() => {
            startHandWithPlayers(initialPlayers, 0);
        }, 500);
    }, [currentUserId]);

    // ─── Start a New Hand ───────────────────────────────────────
    const startHandWithPlayers = useCallback((currentPlayers: Player[], dealer: number) => {
        console.log('[POKER_CLIENT] Starting new hand. Dealer:', dealer);

        // Create and shuffle deck
        const deck = shuffleDeck(createDeck());
        deckRef.current = deck;

        // Deal 2 cards to each player
        let deckIdx = 0;
        const updatedPlayers = currentPlayers.map((p, i) => ({
            ...p,
            hand: [deck[deckIdx++], deck[deckIdx++]],
            isFolded: false,
            currentBet: 0,
            hasActed: false,
            totalContribution: 0,
            isAllIn: false,
            isDealer: i === dealer,
            isActive: p.balance > 0,
        }));

        // Remove used cards from deck
        deckRef.current = deck.slice(deckIdx);

        // Post blinds
        const sbIdx = (dealer + 1) % updatedPlayers.length;
        const bbIdx = (dealer + 2) % updatedPlayers.length;

        const sbAmount = Math.min(sb, updatedPlayers[sbIdx].balance);
        updatedPlayers[sbIdx].balance -= sbAmount;
        updatedPlayers[sbIdx].currentBet = sbAmount;
        updatedPlayers[sbIdx].totalContribution = sbAmount;

        const bbAmount = Math.min(bb, updatedPlayers[bbIdx].balance);
        updatedPlayers[bbIdx].balance -= bbAmount;
        updatedPlayers[bbIdx].currentBet = bbAmount;
        updatedPlayers[bbIdx].totalContribution = bbAmount;

        const initialPot = sbAmount + bbAmount;

        // UTG is dealer + 3
        const utgIdx = (dealer + 3) % updatedPlayers.length;

        setPlayers(updatedPlayers);
        setCommunityCards([]);
        setPot(initialPot);
        setPhase('pre-flop');
        setCurrentBetState(bb);
        setCurrentTurn(utgIdx);
        setWinners([]);
        setWinningHand(null);
        setSidePots([]);
        setDealerPosition(dealer);

        console.log(`[POKER_CLIENT] Hand started. SB: ${updatedPlayers[sbIdx].name}, BB: ${updatedPlayers[bbIdx].name}, UTG: ${updatedPlayers[utgIdx].name}`);

        // If UTG is a bot, schedule bot actions
        if (!updatedPlayers[utgIdx].isHuman) {
            setTimeout(() => {
                processBotTurns(updatedPlayers, [], initialPot, bb, utgIdx, 'pre-flop', dealer);
            }, 800);
        }
    }, [sb, bb]);

    // ─── Process Bot Turns Sequentially ─────────────────────────
    const processBotTurns = useCallback((
        currentPlayers: Player[],
        currentCommunity: Card[],
        currentPot: number,
        bet: number,
        turnIdx: number,
        currentPhase: GamePhase,
        dealer: number
    ) => {
        let pArr = [...currentPlayers.map(p => ({ ...p }))];
        let potAcc = currentPot;
        let betAcc = bet;
        let idx = turnIdx;
        let phaseAcc = currentPhase;
        let community = [...currentCommunity];
        let botActionsCount = 0;

        const processNext = () => {
            // Safety limit
            if (botActionsCount > 30) {
                console.warn('[POKER_CLIENT] Bot loop limit reached');
                setPlayers(pArr);
                setPot(potAcc);
                setCurrentBetState(betAcc);
                setCurrentTurn(idx);
                setPhase(phaseAcc);
                setCommunityCards(community);
                return;
            }

            // Check if hand is over (only 1 player left)
            const activePlayers = pArr.filter(p => !p.isFolded && p.isActive);
            if (activePlayers.length <= 1) {
                // Last man standing wins
                const winner = activePlayers[0];
                if (winner) {
                    winner.balance += potAcc;
                    setPlayers([...pArr]);
                    setPot(0);
                    setWinners([winner]);
                    setPhase('showdown');
                    setCommunityCards(community);
                    setCurrentTurn(-1);
                }
                return;
            }

            const player = pArr[idx];

            // Skip folded/inactive/all-in players
            if (!player || player.isFolded || !player.isActive || player.isAllIn) {
                idx = (idx + 1) % pArr.length;
                botActionsCount++;
                processNext();
                return;
            }

            // If it's a human player, stop and let them act
            if (player.isHuman) {
                setPlayers([...pArr]);
                setPot(potAcc);
                setCurrentBetState(betAcc);
                setCurrentTurn(idx);
                setPhase(phaseAcc);
                setCommunityCards(community);
                return;
            }

            // Bot decision
            const decision = botDecision(player, community, betAcc, potAcc, bb);
            console.log(`[POKER_CLIENT] Bot ${player.name}: ${decision.action}${decision.amount ? ` $${decision.amount}` : ''}`);

            if (decision.action === 'fold') {
                player.isFolded = true;
                player.hasActed = true;
            } else if (decision.action === 'call') {
                const toCall = Math.min(betAcc - player.currentBet, player.balance);
                player.balance -= toCall;
                player.currentBet += toCall;
                player.totalContribution += toCall;
                potAcc += toCall;
                player.hasActed = true;
                if (player.balance === 0) player.isAllIn = true;
            } else if (decision.action === 'raise') {
                const raiseAmt = decision.amount;
                const newBet = betAcc + raiseAmt;
                const toCall = Math.min(newBet - player.currentBet, player.balance);
                player.balance -= toCall;
                player.currentBet += toCall;
                player.totalContribution += toCall;
                potAcc += toCall;
                betAcc = newBet;
                player.hasActed = true;
                if (player.balance === 0) player.isAllIn = true;
                // Reset hasActed for others since bet changed
                pArr.forEach(p => {
                    if (p.id !== player.id && !p.isFolded && !p.isAllIn) p.hasActed = false;
                });
            } else {
                // check
                player.hasActed = true;
            }

            // Update UI periodically
            setPlayers([...pArr]);
            setPot(potAcc);
            setCurrentBetState(betAcc);

            // Check if betting round is over
            const stillActive = pArr.filter(p => !p.isFolded && p.isActive && !p.isAllIn);
            const allActed = stillActive.every(p => p.hasActed && p.currentBet === betAcc);

            if (allActed || stillActive.length <= 1) {
                // Advance phase
                const result = advancePhase(pArr, community, potAcc, phaseAcc, dealer);
                pArr = result.players;
                community = result.community;
                potAcc = result.pot;
                phaseAcc = result.phase;
                betAcc = 0;
                idx = result.nextTurn;

                setPlayers([...pArr]);
                setCommunityCards([...community]);
                setPot(potAcc);
                setPhase(phaseAcc);
                setCurrentBetState(0);
                setCurrentTurn(idx);

                if (phaseAcc === 'showdown' || phaseAcc === 'waiting') {
                    return; // Hand is done
                }

                // Continue processing if next player is a bot
                if (idx >= 0 && !pArr[idx].isHuman && !pArr[idx].isFolded) {
                    botActionsCount++;
                    setTimeout(processNext, 600);
                    return;
                }
                return;
            }

            // Move to next player
            idx = (idx + 1) % pArr.length;
            botActionsCount++;
            setTimeout(processNext, 600);
        };

        processNext();
    }, [bb]);

    // ─── Advance Phase (flop / turn / river / showdown) ─────────
    const advancePhase = useCallback((
        currentPlayers: Player[],
        currentCommunity: Card[],
        currentPot: number,
        currentPhase: GamePhase,
        dealer: number
    ): { players: Player[], community: Card[], pot: number, phase: GamePhase, nextTurn: number } => {

        const pArr = currentPlayers.map(p => ({
            ...p,
            currentBet: 0,
            hasActed: false,
        }));

        let community = [...currentCommunity];
        let newPhase: GamePhase;

        if (currentPhase === 'pre-flop') {
            community = [deckRef.current.shift()!, deckRef.current.shift()!, deckRef.current.shift()!];
            newPhase = 'flop';
        } else if (currentPhase === 'flop') {
            community.push(deckRef.current.shift()!);
            newPhase = 'turn';
        } else if (currentPhase === 'turn') {
            community.push(deckRef.current.shift()!);
            newPhase = 'river';
        } else {
            // Showdown
            newPhase = 'showdown';
            return handleShowdown(pArr, community, currentPot, dealer);
        }

        // Find first active player after dealer
        let nextTurn = (dealer + 1) % pArr.length;
        let safety = 0;
        while ((pArr[nextTurn].isFolded || pArr[nextTurn].isAllIn || !pArr[nextTurn].isActive) && safety < pArr.length) {
            nextTurn = (nextTurn + 1) % pArr.length;
            safety++;
        }

        return { players: pArr, community, pot: currentPot, phase: newPhase, nextTurn };
    }, []);

    // ─── Handle Showdown ────────────────────────────────────────
    const handleShowdown = useCallback((
        currentPlayers: Player[],
        community: Card[],
        currentPot: number,
        dealer: number
    ): { players: Player[], community: Card[], pot: number, phase: GamePhase, nextTurn: number } => {

        const activePlayers = currentPlayers.filter(p => !p.isFolded && p.isActive);

        if (activePlayers.length === 0) {
            return { players: currentPlayers, community, pot: currentPot, phase: 'showdown' as GamePhase, nextTurn: -1 };
        }

        // Evaluate hands
        let bestHand: HandRank | null = null;
        let winnerList: Player[] = [];

        activePlayers.forEach(p => {
            if (p.hand.length >= 2 && community.length >= 3) {
                const handRank = evaluateHand(p.hand, community);
                if (!bestHand || compareHands(handRank, bestHand) > 0) {
                    bestHand = handRank;
                    winnerList = [p];
                } else if (bestHand && compareHands(handRank, bestHand) === 0) {
                    winnerList.push(p);
                }
            }
        });

        // Award pot
        if (winnerList.length > 0) {
            const share = Math.floor(currentPot / winnerList.length);
            winnerList.forEach(w => {
                const idx = currentPlayers.findIndex(p => p.id === w.id);
                if (idx >= 0) currentPlayers[idx].balance += share;
            });
        }

        setWinners(winnerList);
        setWinningHand(bestHand);

        console.log(`[POKER_CLIENT] Showdown! Winners: ${winnerList.map(w => w.name).join(', ')} | Hand: ${bestHand?.name}`);

        return { players: currentPlayers, community, pot: 0, phase: 'showdown' as GamePhase, nextTurn: -1 };
    }, []);

    // ─── Human Player Action ────────────────────────────────────
    const handlePlayerAction = useCallback(async (action: string, amount: number = 0) => {
        if (!currentUserId) return;

        console.log(`[POKER_CLIENT] Human action: ${action} (${amount})`);

        setPlayers(prevPlayers => {
            const pArr = prevPlayers.map(p => ({ ...p }));
            const playerIdx = pArr.findIndex(p => p.id === currentUserId);
            if (playerIdx < 0) return prevPlayers;

            const player = pArr[playerIdx];

            if (action === 'fold') {
                player.isFolded = true;
                player.hasActed = true;
            } else if (action === 'call') {
                const toCall = Math.min(currentBetState - player.currentBet, player.balance);
                player.balance -= toCall;
                player.currentBet += toCall;
                player.totalContribution += toCall;
                setPot(prev => prev + toCall);
                player.hasActed = true;
                if (player.balance === 0) player.isAllIn = true;
            } else if (action === 'raise') {
                const raiseAmt = amount || bb;
                const newBet = currentBetState + raiseAmt;
                const toCall = Math.min(newBet - player.currentBet, player.balance);
                player.balance -= toCall;
                player.currentBet += toCall;
                player.totalContribution += toCall;
                setPot(prev => prev + toCall);
                setCurrentBetState(newBet);
                player.hasActed = true;
                if (player.balance === 0) player.isAllIn = true;
                // Reset hasActed for others
                pArr.forEach(p => {
                    if (p.id !== player.id && !p.isFolded && !p.isAllIn) p.hasActed = false;
                });
            } else if (action === 'check') {
                player.hasActed = true;
            }

            // After human action, continue with bots
            setTimeout(() => {
                // Get latest state
                setPlayers(latestPlayers => {
                    setPot(latestPot => {
                        setCurrentBetState(latestBet => {
                            setPhase(latestPhase => {
                                setCommunityCards(latestCommunity => {
                                    const nextIdx = (playerIdx + 1) % latestPlayers.length;

                                    // Check if round is over
                                    const stillActive = latestPlayers.filter(p => !p.isFolded && p.isActive && !p.isAllIn);
                                    const allActed = stillActive.every(p => p.hasActed && p.currentBet === latestBet);

                                    if (allActed || stillActive.length <= 1) {
                                        const result = advancePhase(latestPlayers, latestCommunity, latestPot, latestPhase, dealerPosition);
                                        setPlayers([...result.players]);
                                        setCommunityCards([...result.community]);
                                        setPot(result.pot);
                                        setPhase(result.phase);
                                        setCurrentBetState(0);
                                        setCurrentTurn(result.nextTurn);

                                        if (result.phase !== 'showdown' && result.phase !== 'waiting' && result.nextTurn >= 0) {
                                            const nextP = result.players[result.nextTurn];
                                            if (nextP && !nextP.isHuman && !nextP.isFolded) {
                                                setTimeout(() => {
                                                    processBotTurns(result.players, result.community, result.pot, 0, result.nextTurn, result.phase, dealerPosition);
                                                }, 600);
                                            }
                                        }
                                    } else {
                                        // Continue to next player
                                        processBotTurns(latestPlayers, latestCommunity, latestPot, latestBet, nextIdx, latestPhase, dealerPosition);
                                    }

                                    return latestCommunity;
                                });
                                return latestPhase;
                            });
                            return latestBet;
                        });
                        return latestPot;
                    });
                    return latestPlayers;
                });
            }, 300);

            return pArr;
        });
    }, [currentUserId, currentBetState, bb, dealerPosition, advancePhase, processBotTurns]);

    // ─── Start New Hand ─────────────────────────────────────────
    const startNewHand = useCallback(() => {
        setPlayers(prevPlayers => {
            const newDealer = (dealerPosition + 1) % prevPlayers.length;
            setDealerPosition(newDealer);
            setTimeout(() => {
                startHandWithPlayers(prevPlayers, newDealer);
            }, 100);
            return prevPlayers;
        });
    }, [dealerPosition, startHandWithPlayers]);

    // ─── Return API ─────────────────────────────────────────────
    return {
        players,
        communityCards,
        pot,
        sidePots,
        phase,
        currentTurn,
        dealerPosition,
        turnTimeLeft,
        timeToNextLevel,
        blindLevel,
        handlePlayerAction,
        currentPlayer: currentTurn >= 0 ? players[currentTurn] : undefined,
        maxPlayers: config.maxPlayers,
        startNewHand,
        currentBet: currentBetState,
        winners,
        winningHand,
        isTournamentMode: config.mode !== 'cash',
        totalTurnTime
    };
};
