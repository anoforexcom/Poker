import { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    doc,
    onSnapshot,
    collection,
    query,
    where,
    getDocs,
    getDoc
} from 'firebase/firestore';
import { Card, HandRank } from '../utils/pokerLogic';
import { BlindStructureType } from '../utils/blindStructure';

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
    tableId: string = 'main_table', // Default to main_table used in function
    currentUserId?: string
) => {
    const [gameState, setGameState] = useState<any>(null);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('pre-flop');
    const [currentTurn, setCurrentTurn] = useState<number>(-1);
    const [lastRaiseAmount, setLastRaiseAmount] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [sidePots, setSidePots] = useState<SidePot[]>([]);
    const [winners, setWinners] = useState<Player[]>([]);
    const [winningHand, setWinningHand] = useState<HandRank | null>(null);
    const [turnTimeLeft, setTurnTimeLeft] = useState(30);
    const [totalTurnTime] = useState(30);
    const [blindLevel, setBlindLevel] = useState(1);
    const [timeToNextLevel, setTimeToNextLevel] = useState(0);

    // Sync Players from Table Participants
    const fetchParticipants = useCallback(async () => {
        if (!tableId) return;

        try {
            // Get table info
            const tableSnap = await getDoc(doc(db, 'tables', tableId));
            if (tableSnap.exists()) {
                const data = tableSnap.data();
                setBlindLevel(data.currentBlindLevel || 1);
            }

            // Get participants
            const q = query(collection(db, 'table_participants'), where('table_id', '==', tableId), where('status', '==', 'active'));
            const snapshot = await getDocs(q);

            const participants: any[] = [];
            snapshot.forEach(doc => participants.push({ id: doc.id, ...doc.data() }));

            // For now, if no participants in DB, we'll use a placeholder hero
            if (participants.length === 0 && currentUserId) {
                const hero: Player = {
                    id: currentUserId,
                    name: 'You',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`,
                    balance: initialUserBalance,
                    hand: [],
                    isFolded: false,
                    currentBet: 0,
                    isHuman: true,
                    isActive: true,
                    totalContribution: 0
                };
                setPlayers([hero]);
                return;
            }

            // Map and Set Players (Similar logic as before but with Firestore data)
            // ... (rest of mapping logic)
            setPlayers(participants.map(p => ({
                id: p.user_id || p.bot_id,
                name: p.name || 'Player',
                avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
                balance: p.stack || 0,
                hand: [], // Hidden unless showdown
                isFolded: false,
                currentBet: 0,
                isHuman: !p.bot_id,
                isActive: true,
                totalContribution: 0
            })));

        } catch (err) {
            console.error('[POKER_GAME] Error fetching participants:', err);
        }
    }, [tableId, currentUserId]);

    // Firestore Realtime Subscription
    useEffect(() => {
        if (!tableId) return;

        const unsubscribeGame = onSnapshot(doc(db, 'game_states', tableId), (snapshot) => {
            if (snapshot.exists()) {
                const newState = snapshot.data();
                console.log(`[POKER_GAME] Game state updated for ${tableId}:`, newState.phase);
                setGameState(newState);
                setCommunityCards((newState.community_cards || []).map(parseCard));
                setPot(newState.current_pot || 0);
                setPhase(newState.phase || 'pre-flop');
                setLastRaiseAmount(newState.last_raise_amount || 0);

                if (newState.phase === 'pre-flop') {
                    setWinners([]);
                    setWinningHand(null);
                }
            } else {
                console.warn(`[POKER_GAME] No game state found for ${tableId}`);
            }
        });

        const unsubscribeHistory = onSnapshot(query(collection(db, 'game_history'), where('table_id', '==', tableId)), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const result = change.doc.data().results;
                    // Handle winners display...
                }
            });
        });

        return () => {
            unsubscribeGame();
            unsubscribeHistory();
        };
    }, [tableId]);

    // Handle Player Action via Cloud Function
    const handlePlayerAction = async (action: string, amount: number = 0) => {
        if (!currentUserId) return;

        const functions = getFunctions();
        const pokerGame = httpsCallable(functions, 'pokerGame');

        try {
            console.log(`[ACTION] Calling Cloud Function: ${action} (${amount})`);
            const result = await pokerGame({
                action,
                amount,
                playerId: currentUserId,
                tableId
            });

            if (result.data && (result.data as any).success) {
                console.log('[ACTION] Success:', (result.data as any).tableState);
            } else {
                console.error('[ACTION] Error:', (result.data as any).error);
            }
        } catch (err) {
            console.error('[ACTION] Call failed:', err);
        }
    };

    return {
        players,
        communityCards,
        pot,
        sidePots,
        phase,
        currentTurn,
        dealerPosition: 0,
        turnTimeLeft,
        timeToNextLevel,
        blindLevel,
        handlePlayerAction,
        currentPlayer: players[currentTurn],
        maxPlayers: config.maxPlayers,
        startNewHand: () => handlePlayerAction('next_hand'),
        currentBet: lastRaiseAmount,
        winners,
        winningHand,
        isTournamentMode: false, // Always cash now
        totalTurnTime
    };
};
