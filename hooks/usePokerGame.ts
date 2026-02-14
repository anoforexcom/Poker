import { useState, useEffect, useCallback } from 'react';
import { Card, createDeck, shuffleDeck, dealCards, evaluateHand, compareHands, HandRank } from '../utils/pokerLogic';
import { generateBotName } from '../utils/nameGenerator';
import { BlindLevel, BlindStructureType, TOURNAMENT_BLIND_STRUCTURES, getCurrentBlinds } from '../utils/blindStructure';
import { supabase } from '../utils/supabase';

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
    totalContribution: number; // For side pot calculation
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
    status?: string; // To detect if tournament is running for late reg logic
}

const DEFAULT_CONFIG: GameConfig = {
    mode: 'cash',
    smallBlind: 10,
    bigBlind: 20,
    ante: 0,
    startingStack: 1000,
    maxPlayers: 5,
    blindStructureType: 'regular'
};

export const usePokerGame = (
    initialUserBalance: number,
    updateGlobalBalance: (amount: number) => void,
    config: GameConfig = DEFAULT_CONFIG,
    tournamentId?: string,
    currentUserId?: string
) => {
    const { mode, smallBlind: initialSB, bigBlind: initialBB, ante: initialAnte, maxPlayers, blindStructureType: initialBlindStructure, isObserver = false } = config;

    const [deck, setDeck] = useState<Card[]>([]);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [sidePots, setSidePots] = useState<SidePot[]>([]);
    const [phase, setPhase] = useState<GamePhase>('pre-flop');
    const [currentTurn, setCurrentTurn] = useState(0);
    const [currentBet, setCurrentBet] = useState(initialBB); // Track current bet to match
    const [dealerPosition, setDealerPosition] = useState(maxPlayers - 1); // Dealer button position
    const [lastRaiser, setLastRaiser] = useState<number | null>(null); // Who raised last
    const [lastRaiseAmount, setLastRaiseAmount] = useState(initialBB); // Track last raise amount for minimum raise
    const [winners, setWinners] = useState<Player[]>([]);
    const [winningHand, setWinningHand] = useState<HandRank | null>(null);

    // Blind level system for tournaments
    const [blindStructureType] = useState<BlindStructureType>(initialBlindStructure || 'regular');
    const [blindLevel, setBlindLevel] = useState(1);
    const [levelStartTime, setLevelStartTime] = useState(Date.now());
    const [timeToNextLevel, setTimeToNextLevel] = useState(0);
    const [isTournamentMode] = useState(mode !== 'cash'); // Set to true for tournaments

    // Turn Timer system
    const [turnTimeLeft, setTurnTimeLeft] = useState(30);
    const [totalTurnTime] = useState(30);

    // Initialize Players (Start with empty, then sync with DB)
    const [players, setPlayers] = useState<Player[]>([]);

    // Adaptive AI: Human Player Profiling
    const [humanStats, setHumanStats] = useState({
        raises: 0,
        calls: 0,
        folds: 0,
        totalHands: 0
    });

    const fetchParticipants = useCallback(async () => {
        if (!tournamentId) return;

        try {
            console.log('[POKER_GAME] Syncing participants for Tournament:', tournamentId);
            const { data: participants, error: pError } = await supabase
                .from('tournament_participants')
                .select(`
                    id,
                    user_id,
                    bot_id,
                    status,
                    bots (id, name, avatar, balance),
                    profiles:user_id (id, name, avatar_url, balance)
                `)
                .eq('tournament_id', tournamentId)
                .eq('status', 'active');

            if (pError) throw pError;

            if (participants) {
                const mappedPlayers: Player[] = participants.map((p, index) => {
                    const isBot = !!p.bot_id;
                    // Supabase joins can return arrays even for 1:1, handle both cases
                    const rawProfile = isBot ? p.bots : p.profiles;
                    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

                    const isHero = p.user_id === currentUserId;

                    const mappedPlayer: Player = {
                        id: p.bot_id || p.user_id || `player-${index}`,
                        name: isHero ? 'You' : (profile?.name || (isBot ? 'Bot' : 'Player')),
                        avatar: (profile as any)?.avatar || (profile as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${index}`,
                        // REALSIM FIX: For Tournaments, always start with config.startingStack (10k), ignoring wallet balance.
                        // For Cash games, use the profile balance.
                        balance: (mode === 'cash')
                            ? (Number((profile as any)?.balance) || config.startingStack)
                            : config.startingStack,
                        hand: [],
                        isFolded: false,
                        currentBet: 0,
                        isHuman: !isBot,
                        isActive: true,
                        totalContribution: 0
                    };

                    // REALISM: If joining a running tournament (Late Reg), randomize bot stacks 
                    // to simulate action that has already happened.
                    if (isBot && (config.status === 'Running' || config.status === 'Late Reg') && mappedPlayer.balance === config.startingStack) {
                        const randomFactor = 0.5 + Math.random() * 2.5; // 0.5x to 3.0x stack
                        mappedPlayer.balance = Math.floor(config.startingStack * randomFactor);
                    }

                    return mappedPlayer;
                });

                // Sort so Hero is always at index 0 for consistent UI control/seating
                let finalPlayers = [...mappedPlayers].sort((a, b) => {
                    if (a.id === currentUserId) return -1;
                    if (b.id === currentUserId) return 1;
                    return 0;
                });

                // --- LOCAL HERO INJECTION ---
                // If current user is registered but not in the sync list yet, inject locally 
                // to prevent "Waiting for Players" flicker.
                const isHeroPresent = finalPlayers.some(p => p.id === currentUserId);
                if (!isHeroPresent && currentUserId) {
                    finalPlayers.unshift({
                        id: currentUserId,
                        name: 'You',
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`,
                        balance: config.startingStack,
                        hand: [],
                        isFolded: false,
                        currentBet: 0,
                        isHuman: true,
                        isActive: true,
                        totalContribution: 0
                    });
                }

                setPlayers(finalPlayers);
            }
        } catch (err) {
            console.error('[POKER_GAME] Error fetching participants:', err);
        }
    }, [tournamentId, currentUserId, config.startingStack]);

    // RESILIENCE: 24/7 Bot Autoplay Enforcement
    // If it's a bot's turn, force them to move even if normal triggers missed
    useEffect(() => {
        if (players.length > 0 && currentTurn >= 0 && currentTurn < players.length && phase !== 'showdown') {
            const currentPlayer = players[currentTurn];
            if (!currentPlayer.isHuman && !currentPlayer.isFolded && currentPlayer.isActive) {
                const timer = setTimeout(() => {
                    console.log('[AUTOPLAY] Forcing missing bot move for:', currentPlayer.name);
                    makeBotMove();
                }, 3000); // 3s fallback
                return () => clearTimeout(timer);
            }
        }
    }, [currentTurn, players, phase]);

    // Force Start / Auto-Fill Logic
    useEffect(() => {
        if (tournamentId && players.length < 2 && config.status !== 'Finished') {
            const timer = setTimeout(async () => {
                console.log('[POKER_GAME] Force-filling table with bots...');
                // 1. Fetch 5 random bots from DB
                let { data: bots } = await supabase.from('bots').select('*').limit(5);

                // FALLBACK: If no bots exist in DB, create temporary ones
                if (!bots || bots.length === 0) {
                    console.warn('[POKER_GAME] No bots found in DB. Generating temporary bots...');
                    const generatedBots = Array.from({ length: 5 }).map((_, i) => ({
                        id: `gen-bot-${Date.now()}-${i}`,
                        name: `Bot ${generateBotName()}`,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=gen${i}`,
                        balance: 10000,
                        skill: 50
                    }));

                    // Try to insert them for future use (optional, purely for resilience)
                    const { error: genError } = await supabase.from('bots').upsert(generatedBots);
                    if (genError) console.error('Bot gen error', genError);
                    bots = generatedBots as any;
                }

                if (bots && bots.length > 0) {
                    const newParticipants = bots.map(bot => ({
                        tournament_id: tournamentId,
                        bot_id: bot.id,
                        status: 'active'
                    }));

                    // 2. Insert into tournament_participants (upsert to avoid dupes)
                    await supabase.from('tournament_participants').upsert(newParticipants, { onConflict: 'tournament_id, bot_id' });

                    // 3. Update tournament player count
                    const { error } = await supabase.rpc('increment_tournament_players', {
                        tournament_id_param: tournamentId,
                        count_param: bots.length
                    });

                    if (error) {
                        // Fallback manual update if RPC missing
                        await supabase.from('tournaments')
                            .update({ players_count: bots.length + 1, status: 'running' }) // +1 for hero
                            .eq('id', tournamentId);
                    }

                    fetchParticipants();
                }
            }, 5000); // Wait 5s before forcing

            return () => clearTimeout(timer);
        }
    }, [tournamentId, players.length, config.status]);

    useEffect(() => {
        if (tournamentId) {
            fetchParticipants();

            const subscription = supabase
                .channel(`participants:${tournamentId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'tournament_participants',
                    filter: `tournament_id=eq.${tournamentId}`
                }, () => {
                    console.log('[POKER_GAME] Participant change detected, re-syncing...');
                    fetchParticipants();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [tournamentId, fetchParticipants]);

    // Smart sync external user balance
    // Only updates if the human player has 0 chips and the game is at the very start
    // This allows Demo/Guest balances to load without resetting mid-hand stacks.
    useEffect(() => {
        if (initialUserBalance > 0 && phase === 'pre-flop' && pot === 0) {
            setPlayers(prev => {
                const needsBalance = prev.some(p => p.isHuman && p.balance === 0);
                if (needsBalance) {
                    return prev.map(p => p.isHuman ? { ...p, balance: initialUserBalance, isActive: true } : p);
                }
                return prev;
            });
        }
    }, [initialUserBalance, phase, pot]);

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
            smallBlind: initialSB,
            bigBlind: initialBB,
            ante: initialAnte
        };
    }, [isTournamentMode, blindStructureType, blindLevel, initialSB, initialBB, initialAnte]);

    // Start a new hand
    const startNewHand = useCallback(() => {
        if (players.length < 2) {
            console.log('[POKER_GAME] Not enough players to start a hand (min 2)');
            return;
        }

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

                if (p.isHuman && !isObserver) {
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
                isActive: true,
                totalContribution: 0
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

        // --- FIXED HEADS-UP BLIND LOGIC ---
        // In Heads-up (2 players), Dealer (Button) is Small Blind
        const activeCount = updatedPlayers.filter(p => p.isActive).length;
        if (activeCount === 2) {
            actualSmallBlindPos = newDealerPos;
            actualBigBlindPos = (newDealerPos + 1) % players.length;
            // Ensure big blind is an active player
            if (!updatedPlayers[actualBigBlindPos].isActive) {
                actualBigBlindPos = actualSmallBlindPos === 0 ? 1 : 0;
            }
        }

        if (updatedPlayers[actualSmallBlindPos].isActive) {
            const sbAmount = Math.min(smallBlind, updatedPlayers[actualSmallBlindPos].balance);
            updatedPlayers[actualSmallBlindPos].currentBet = sbAmount;
            updatedPlayers[actualSmallBlindPos].balance -= sbAmount;
            updatedPlayers[actualSmallBlindPos].totalContribution = sbAmount;

            if (updatedPlayers[actualSmallBlindPos].isHuman && !isObserver) {
                updateGlobalBalance(-sbAmount);
            }
        }

        if (updatedPlayers[actualBigBlindPos].isActive) {
            const bbAmount = Math.min(bigBlind, updatedPlayers[actualBigBlindPos].balance);
            updatedPlayers[actualBigBlindPos].currentBet = bbAmount;
            updatedPlayers[actualBigBlindPos].balance -= bbAmount;
            updatedPlayers[actualBigBlindPos].totalContribution += bbAmount;

            if (updatedPlayers[actualBigBlindPos].isHuman && !isObserver) {
                updateGlobalBalance(-bbAmount);
            }
        }

        setDeck(currentDeck);
        setPlayers(updatedPlayers);

        // Explicit reset of all game state
        setPot(0);
        setSidePots([]);
        setCommunityCards([]);
        setWinners([]);
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
        setCurrentBet(bigBlind);
    }, [dealerPosition, players, updateGlobalBalance, getCurrentBlindValues]);

    // Calculate side pots for all-in scenarios
    const calculateSidePots = useCallback((allPlayers: Player[]): SidePot[] => {
        // Only consider players who have contributed SOMETHING
        const contributors = allPlayers.filter(p => !p.isActive || p.isFolded || p.totalContribution > 0);

        if (contributors.length === 0) return [];

        const pots: SidePot[] = [];

        // Use totalContribution as it's the only reliable source across rounds
        const contributions = contributors.map(p => ({
            id: p.id,
            amount: p.totalContribution,
            canWin: !p.isFolded && p.isActive
        }));

        // Sort contributions (ascending)
        const sorted = contributions
            .filter(c => c.amount > 0)
            .sort((a, b) => a.amount - b.amount);

        let previousLevel = 0;
        let remaining = [...sorted];

        while (remaining.length > 0) {
            const currentLevel = remaining[0].amount;
            const levelDiff = currentLevel - previousLevel;

            if (levelDiff > 0) {
                // Players eligible for THIS slice of the pot
                const eligible = contributors
                    .filter(p => p.totalContribution >= currentLevel && !p.isFolded && p.isActive)
                    .map(p => p.id);

                if (eligible.length > 0) {
                    pots.push({
                        amount: levelDiff * remaining.length,
                        eligiblePlayers: eligible
                    });
                } else {
                    // If no one is eligible to win this slice (e.g. everyone folded)
                    // It goes to the next available winner or back to the last player
                    // In real poker, the last folder wins, but here we just add it to the previous pot
                    if (pots.length > 0) {
                        pots[pots.length - 1].amount += levelDiff * remaining.length;
                    }
                }
            }

            previousLevel = currentLevel;
            remaining = remaining.filter(c => c.amount > currentLevel);
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
        const { bigBlind } = getCurrentBlindValues();

        // Reset for new betting round
        setPlayers(prev => prev.map(p => ({ ...p, hasActed: false })));
        setCurrentBet(0);
        setLastRaiser(null);
        setLastRaiseAmount(bigBlind); // Reset minimum raise to big blind

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
                totalContribution: currentPlayer.totalContribution + actualCall,
                hasActed: true
            };

            addToPot = actualCall;

            if (currentPlayer.isHuman && !isObserver) {
                updateGlobalBalance(-actualCall);
            }
        } else if (action === 'raise') {
            const totalBet = Math.min(amount, currentPlayer.balance + currentPlayer.currentBet);
            const raiseAmountRequested = totalBet - currentBet;

            // Validate minimum raise (must be at least the size of the last raise)
            // Exception: all-in is always allowed
            const isAllIn = totalBet >= currentPlayer.balance + currentPlayer.currentBet;
            const isFullRaise = raiseAmountRequested >= lastRaiseAmount;

            if (!isAllIn && totalBet < currentBet + lastRaiseAmount) {
                console.warn(`Minimum raise is ${currentBet + lastRaiseAmount}. You tried to raise to ${amount}.`);
                return; // Reject invalid raise
            }

            const addAmount = totalBet - currentPlayer.currentBet;

            updatedPlayers[currentTurn] = {
                ...currentPlayer,
                currentBet: totalBet,
                balance: currentPlayer.balance - addAmount,
                totalContribution: currentPlayer.totalContribution + addAmount,
                hasActed: true
            };

            // Re-open betting ONLY if it's a full raise
            if (isFullRaise) {
                updatedPlayers = updatedPlayers.map((p, i) =>
                    i === currentTurn ? p : { ...p, hasActed: false }
                );
            }

            addToPot = addAmount;

            // Update last raise amount for minimum raise validation
            if (raiseAmountRequested > 0) {
                setLastRaiseAmount(Math.max(lastRaiseAmount, raiseAmountRequested));
                setCurrentBet(totalBet);
                setLastRaiser(currentTurn);

                if (currentPlayer.isHuman && !isObserver) {
                    updateGlobalBalance(-addAmount);
                }
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

        // Track human stats for Adaptive AI
        if (currentPlayer.isHuman) {
            setHumanStats(prev => ({
                ...prev,
                raises: action === 'raise' ? prev.raises + 1 : prev.raises,
                calls: action === 'call' ? prev.calls + 1 : prev.calls,
                folds: action === 'fold' ? prev.folds + 1 : prev.folds,
                totalHands: action === 'fold' ? prev.totalHands + 1 : prev.totalHands // Hand ends for them if fold
            }));
        }

        setPlayers(updatedPlayers);
        setPot(prev => prev + addToPot);

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

    // Bot Decision Logic (Extracted for resilience)
    const makeBotMove = () => {
        const currentPlayer = players[currentTurn];
        if (!currentPlayer || currentPlayer.isHuman || currentPlayer.isFolded || !currentPlayer.isActive) return;

        const amountToCall = currentBet - currentPlayer.currentBet;
        const potOdds = amountToCall / (pot + amountToCall);

        // 1. Evaluate Hand Strength (0 to 1 scale roughly)
        const evaluation = evaluateHand(currentPlayer.hand, communityCards);
        const handStrength = evaluation.ranking / 10; // Simple normalize 1-10 to 0.1-1.0

        // 2. Factor in Human Aggression (0.5 = normal, >0.5 = human is a bluffer)
        const humanAggression = humanStats.raises / (humanStats.calls + humanStats.folds + 1);
        // If human is aggressive, bot calls easier
        const callThreshold = 0.3 - (humanAggression * 0.1);

        const random = Math.random();

        if (amountToCall === 0) {
            // Choice: Check or Raise
            if (handStrength > 0.7 || (handStrength > 0.4 && random > 0.7)) {
                // Strong hand or semi-bluff
                const raiseAmount = Math.max(initialBB * 3, Math.floor(pot * 0.5));
                handlePlayerAction('raise', currentBet + raiseAmount);
            } else {
                handlePlayerAction('check');
            }
        } else {
            // Choice: Call, Raise, or Fold
            const winProbability = handStrength; // Simplified

            if (winProbability > 0.8) {
                // Monster hand: Raise/All-in
                handlePlayerAction('raise', currentBet + Math.max(pot, initialBB * 10));
            } else if (winProbability > potOdds || random < 0.1) {
                // Positive expected value OR occasional bluff-call
                if (winProbability > 0.6 && random > 0.8) {
                    handlePlayerAction('raise', currentBet + Math.floor(pot * 0.5));
                } else {
                    handlePlayerAction('call');
                }
            } else {
                handlePlayerAction('fold');
            }
        }
    };

    // Adaptive Bot AI Logic (Main Trigger)
    useEffect(() => {
        const currentPlayer = players[currentTurn];

        if (!currentPlayer || currentPlayer.isHuman || currentPlayer.isFolded || !currentPlayer.isActive || phase === 'showdown') {
            return;
        }

        const timer = setTimeout(() => {
            makeBotMove();
        }, 1500 + Math.random() * 1500); // 1.5s - 3s "thinking" time

        return () => clearTimeout(timer);
    }, [currentTurn, phase, players, currentBet, pot, communityCards, humanStats]);

    // Showdown Logic with Side Pots and Odd Chip rule
    useEffect(() => {
        if (phase === 'showdown' && winners.length === 0) {
            const activePlayers = players.filter(p => !p.isFolded && p.isActive);

            if (activePlayers.length === 1) {
                // Only one player left, they win entire pot
                const theWinner = activePlayers[0];
                setWinners([theWinner]);

                if (theWinner.isHuman && !isObserver) {
                    updateGlobalBalance(pot);
                } else {
                    setPlayers(prev => prev.map(p =>
                        p.id === theWinner.id ? { ...p, balance: p.balance + pot } : p
                    ));
                }
            } else if (activePlayers.length > 1) {
                // Multiple players - calculate side pots
                // Use totalContribution for calculation
                const pots = calculateSidePots(players);

                // If no side pots calculated, use main pot
                const potsToDistribute = pots.length > 0 ? pots : [{ amount: pot, eligiblePlayers: activePlayers.map(p => p.id) }];

                // Distribute each pot separately
                let totalHumanWinnings = 0;
                const finalWinners: Player[] = [];
                let mainWinningHand: HandRank | null = null;

                // Players to update in state
                const playersBalances: Record<string, number> = {};

                potsToDistribute.forEach(sidePot => {
                    // Get eligible players for this pot
                    const eligibleForPot = activePlayers.filter(p =>
                        sidePot.eligiblePlayers.includes(p.id)
                    );

                    if (eligibleForPot.length === 0) return;

                    // Evaluate hands of eligible players
                    const evaluations = eligibleForPot.map(p => ({
                        player: p,
                        hand: evaluateHand(p.hand, communityCards)
                    }));

                    // Find ALL winners (detect ties/split pots)
                    let currentPotWinners: typeof evaluations = [];
                    let bestHand = evaluations[0].hand;

                    evaluations.forEach(evaluation => {
                        const comparison = compareHands(evaluation.hand, bestHand);
                        if (comparison > 0) {
                            currentPotWinners = [evaluation];
                            bestHand = evaluation.hand;
                        } else if (comparison === 0) {
                            currentPotWinners.push(evaluation);
                        }
                    });

                    // Split pot - Odd Chip Rule: handle remainders
                    const amountPerWinner = Math.floor(sidePot.amount / currentPotWinners.length);
                    let remainder = sidePot.amount % currentPotWinners.length;

                    // Distribute odd chips to players starting from left of button
                    // Sort winners by table position starting from (Dealer + 1)
                    const sortedWinners = [...currentPotWinners].sort((a, b) => {
                        const idxA = (players.findIndex(p => p.id === a.player.id) - dealerPosition + players.length) % players.length;
                        const idxB = (players.findIndex(p => p.id === b.player.id) - dealerPosition + players.length) % players.length;
                        return idxA - idxB;
                    });

                    sortedWinners.forEach((evalItem, i) => {
                        let winAmount = amountPerWinner;
                        if (remainder > 0) {
                            winAmount += 1; // Distribute 1 remainder unit
                            remainder--;
                        }

                        if (evalItem.player.isHuman && !isObserver) {
                            totalHumanWinnings += winAmount;
                        }

                        playersBalances[evalItem.player.id] = (playersBalances[evalItem.player.id] || 0) + winAmount;

                        // Track unique winners for display
                        if (!finalWinners.find(w => w.id === evalItem.player.id)) {
                            finalWinners.push(evalItem.player);
                        }
                        if (!mainWinningHand) mainWinningHand = evalItem.hand;
                    });
                });

                // Batch update bot balances (including human UI stack)
                setPlayers(prev => prev.map(p => {
                    const bonus = playersBalances[p.id] || 0;
                    // Note: Human player balance is synced separately, but update it here too for UI consistency
                    return bonus > 0 ? { ...p, balance: p.balance + bonus } : p;
                }));

                // Set winners for display
                setWinners(finalWinners);
                setWinningHand(mainWinningHand);
            }
        }
    }, [phase, winners, players, communityCards, pot, dealerPosition, updateGlobalBalance, calculateSidePots]);

    // Turn Timer countdown
    useEffect(() => {
        if (phase === 'showdown' || winners.length > 0) return;

        const interval = setInterval(() => {
            setTurnTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up! Auto-action
                    const activePlayer = players[currentTurn];
                    if (activePlayer && activePlayer.isActive && !activePlayer.isFolded) {
                        // If human or bot, trigger fallback action
                        const amountToCall = currentBet - activePlayer.currentBet;
                        if (amountToCall === 0) {
                            handlePlayerAction('check');
                        } else {
                            handlePlayerAction('fold');
                        }
                    }
                    return totalTurnTime;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentTurn, phase, players, currentBet, handlePlayerAction, totalTurnTime, winners]);

    // Reset turn timer when turn changes
    useEffect(() => {
        setTurnTimeLeft(totalTurnTime);
    }, [currentTurn, phase, totalTurnTime]);

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
            setWinners([]);
            setWinningHand(null);
            startNewHand();
        },
        handlePlayerAction,
        winners,
        winningHand,
        turnTimeLeft,
        totalTurnTime
    };
};
