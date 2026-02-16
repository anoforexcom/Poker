import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Card, HandRank } from '../utils/pokerLogic';
import { BlindStructureType, TOURNAMENT_BLIND_STRUCTURES, getCurrentBlinds } from '../utils/blindStructure';

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
    hasActed?: boolean;
    totalContribution: number;
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
    startingStack: 1000,
    maxPlayers: 5,
    blindStructureType: 'regular'
};

// Helper to parse "Ah" -> { rank: "A", suit: "h" }
const parseCard = (cardStr: string): Card => {
    if (!cardStr || cardStr.length < 2) return { rank: '?', suit: '?' } as any;
    const rank = cardStr[0] as any;
    const suit = cardStr[1] as any;

    // Calculate numeric value based on rank
    const rankMap: Record<string, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    const value = rankMap[rank] || 0;

    return {
        rank,
        suit,
        value
    };
};

export const usePokerGame = (
    initialUserBalance: number,
    updateGlobalBalance: (amount: number) => void,
    config: GameConfig = DEFAULT_CONFIG,
    tournamentId?: string,
    currentUserId?: string
) => {
    // Game State from Backend
    const [gameState, setGameState] = useState<any>(null);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('pre-flop');
    const [currentTurn, setCurrentTurn] = useState<number>(-1); // Index
    const [lastRaiseAmount, setLastRaiseAmount] = useState(0); // Current Bet to call

    // Players State
    const [players, setPlayers] = useState<Player[]>([]);
    const [sidePots, setSidePots] = useState<SidePot[]>([]);
    const [winners, setWinners] = useState<Player[]>([]);
    const [winningHand, setWinningHand] = useState<HandRank | null>(null);

    // Turn Timer & Blinds (Visual/Estimates)
    const [turnTimeLeft, setTurnTimeLeft] = useState(30);
    const [totalTurnTime] = useState(30);
    const [blindLevel, setBlindLevel] = useState(1);
    const [timeToNextLevel, setTimeToNextLevel] = useState(0);

    // Fetch Participants & Sync Players
    const fetchParticipants = useCallback(async () => {
        if (!tournamentId) return;

        try {
            // Fetch Tournament Data for Blinds/Level
            const { data: tourney } = await supabase
                .from('tournaments')
                .select('current_blind_level, scheduled_start_time, type')
                .eq('id', tournamentId)
                .single();

            if (tourney) {
                setBlindLevel(tourney.current_blind_level || 1);
                setTimeToNextLevel(60000);
            }

            const { data: participants, error: pError } = await supabase
                .from('tournament_participants')
                .select('id, user_id, bot_id, status, stack')
                .eq('tournament_id', tournamentId)
                .eq('status', 'active');

            if (pError) throw pError;
            if (!participants) return;

            const botIds = participants.filter(p => p.bot_id).map(p => p.bot_id as string);
            const userIds = participants.filter(p => p.user_id).map(p => p.user_id as string);

            const { data: bots } = botIds.length > 0 ? await supabase.from('bots').select('id, name, avatar').in('id', botIds) : { data: [] };
            const { data: profiles } = userIds.length > 0 ? await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds) : { data: [] };

            const botMap = Object.fromEntries((bots || []).map(b => [b.id, b]));
            const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

            if (participants) {
                // Map to Player Interface
                let mappedPlayers: Player[] = participants.map((p: any) => {
                    const isBot = !!p.bot_id;
                    const rawProfile = isBot ? botMap[p.bot_id] : profileMap[p.user_id];
                    const pid = p.user_id || p.bot_id;
                    const isHero = pid === currentUserId;

                    // Get ephemeral state from gameState if available
                    const pState = gameState?.player_states?.[pid] || {};

                    // Parse Hole Cards (Only for Hero or Showdown)
                    let hand: Card[] = [];
                    if (isHero && pState.hole_cards && Array.isArray(pState.hole_cards)) {
                        hand = pState.hole_cards.map(parseCard);
                    } else if (gameState?.phase === 'showdown' && pState.hole_cards) {
                        // Show all cards in showdown if available
                        hand = pState.hole_cards.map(parseCard);
                    }

                    return {
                        id: pid,
                        name: isHero ? 'You' : (rawProfile?.name || 'Player'),
                        avatar: rawProfile?.avatar || rawProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}`,
                        balance: p.stack || 0,
                        hand: hand,
                        isFolded: !!pState.is_folded,
                        currentBet: pState.current_bet || 0,
                        isHuman: !isBot,
                        isActive: p.status === 'active',
                        hasActed: !!pState.has_acted,
                        totalContribution: 0
                    };
                });

                // Sort: Consistent order
                mappedPlayers.sort((a, b) => {
                    if (a.id === currentUserId) return -1;
                    if (b.id === currentUserId) return 1;
                    return a.id.localeCompare(b.id);
                });

                setPlayers(mappedPlayers);
            }
        } catch (err) {
            console.error('[POKER_GAME] Error fetching participants:', err);
        }
    }, [tournamentId, currentUserId, gameState]);

    // Initial Fetch
    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    // REALTIME SUBSCRIPTION to GAME STATE
    useEffect(() => {
        if (!tournamentId) return;

        const channel = supabase.channel(`game:${tournamentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'game_states',
                filter: `tournament_id=eq.${tournamentId}`
            }, (payload) => {
                const newState = payload.new as any;
                setGameState(newState);

                // Sync Community Cards
                if (newState.community_cards && Array.isArray(newState.community_cards)) {
                    setCommunityCards(newState.community_cards.map(parseCard));
                } else {
                    setCommunityCards([]);
                }

                setPot(newState.current_pot || 0);
                setPhase(newState.phase || 'pre-flop');
                setLastRaiseAmount(newState.last_raise_amount || 0);

                // If phase resets to pre-flop, clear winners
                if (newState.phase === 'pre-flop') {
                    setWinners([]);
                    setWinningHand(null);
                }
            })
            .subscribe();

        const pChannel = supabase.channel(`participants:${tournamentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournament_participants',
                filter: `tournament_id=eq.${tournamentId}`
            }, () => {
                fetchParticipants();
            })
            .subscribe();

        // Subscribe to Winner/Hand History
        const hChannel = supabase.channel(`history:${tournamentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'game_hand_history',
                filter: `tournament_id=eq.${tournamentId}`
            }, (payload) => {
                const result = (payload.new as any).results;
                if (result && result.winners && result.winners.length > 0) {
                    // Check if data is array
                    const winnerInfo = Array.isArray(result.winners) ? result.winners : [result.winners];

                    // Use current players state
                    setWinners(prev => {
                        const current = players.length ? players : prev;
                        return winnerInfo.map((w: any) => {
                            const p = current.find(pl => pl.id === w.id);
                            // If we have hand names, try to supply them
                            return {
                                ...p,
                                name: p?.name || 'Winner',
                                balance: p?.balance || 0,
                                hand: p?.hand || [], // Should use holes if available
                                // Schema might need "winning_hand" string 
                            } as Player;
                        });
                    });

                    if (winnerInfo[0]?.hand_name) {
                        setWinningHand({ name: winnerInfo[0].hand_name, ranking: 1 } as any);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(pChannel);
            supabase.removeChannel(hChannel);
        };
    }, [tournamentId, fetchParticipants]);

    // Calculate Current Turn Index
    useEffect(() => {
        if (!gameState || players.length === 0) return;
        const turnId = gameState.current_turn_user_id || gameState.current_turn_bot_id;
        if (turnId) {
            const idx = players.findIndex(p => p.id === turnId);
            setCurrentTurn(idx);
            // Reset timer on turn change
            setTurnTimeLeft(30);
        } else {
            setCurrentTurn(-1);
        }
    }, [gameState, players]);

    // Timer Countdown
    useEffect(() => {
        if (currentTurn === -1) return;
        const timer = setInterval(() => {
            setTurnTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [currentTurn]);

    // Send Player Action to Backend
    const handlePlayerAction = async (action: 'fold' | 'check' | 'call' | 'raise' | 'next_hand', amount: number = 0) => {
        if (!currentUserId || !tournamentId) return;

        try {
            const { data, error } = await supabase.functions.invoke('poker-simulator', {
                body: {
                    action: 'player_move',
                    tournament_id: tournamentId,
                    player_id: currentUserId,
                    move_type: action,
                    amount: amount
                }
            });

            if (error) throw error;
            if (!data.success) {
                console.warn('[ACTION] Rejected');
            }
        } catch (err) {
            console.error('[ACTION] Error:', err);
        }
    };

    const startNewHand = () => {
        handlePlayerAction('next_hand');
    };

    return {
        deck: [], // Deprecated
        players,
        communityCards,
        pot,
        sidePots, // TODO: derived from history?
        phase,
        currentTurn,
        dealerPosition: 0, // TODO: Sync from backend
        turnTimeLeft,
        timeToNextLevel,
        blindLevel,
        handlePlayerAction,
        isBettingRoundComplete: () => false, // Backend handled
        currentPlayer: players[currentTurn],
        maxPlayers: config.maxPlayers,
        startNewHand,
        currentBet: lastRaiseAmount, // Expose for UI
        winners,
        winningHand,
        isTournamentMode: config.mode !== 'cash',
        totalTurnTime
    };
};
