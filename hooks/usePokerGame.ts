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


    const [isInitializing, setIsInitializing] = useState(false);

    // Unified Subscription and Auto-Start
    useEffect(() => {
        if (!tableId) {
            console.error('[POKER_GAME] No tableId provided!');
            return;
        }

        console.log(`[POKER_GAME] Initializing subscription for: ${tableId} (User: ${currentUserId})`);

        const unsubscribe = onSnapshot(doc(db, 'tables', tableId), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                console.log(`[POKER_GAME] Snapshot received for ${tableId}. Phase: ${data.phase}, Players: ${data.players?.length || 0}`);

                setGameState(data);

                // Map Players from consolidated "players" array
                if (data.players && data.players.length > 0) {
                    const mappedPlayers: Player[] = data.players.map((p: any, i: number) => ({
                        id: p.id,
                        name: p.name || 'Player',
                        avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
                        balance: p.stack || 0,
                        hand: (p.cards || []).map(parseCard),
                        isFolded: p.hasFolded || false,
                        currentBet: p.currentBet || 0,
                        isHuman: !p.isBot,
                        isActive: true,
                        isDealer: i === data.dealerPosition,
                        totalContribution: p.totalHandBet || 0
                    }));
                    setPlayers(mappedPlayers);
                } else {
                    console.warn(`[POKER_GAME] Table has no players!`);
                    setPlayers([]);
                }

                setCommunityCards((data.communityCards || []).map(parseCard));
                setPot(data.pots ? data.pots.reduce((sum: number, p: any) => sum + p.amount, 0) : 0);
                setPhase(data.phase || 'waiting');
                setLastRaiseAmount(data.currentBet || 0);
                setCurrentTurn(data.activePlayerIndex !== undefined ? data.activePlayerIndex : -1);

                // More aggressive Auto-start
                const needsInitialStart = !data.players || data.players.length === 0;
                const isWaiting = data.phase === 'waiting';

                if ((needsInitialStart || isWaiting) && currentUserId && !data.isStarting && !isInitializing) {
                    console.log('[POKER_GAME] Triggering auto-start (Start action)...');
                    setIsInitializing(true);
                    handlePlayerAction('start').finally(() => {
                        // Keep initialized for a bit to avoid bounce
                        setTimeout(() => setIsInitializing(false), 3000);
                    });
                }
            } else {
                console.warn(`[POKER_GAME] Table document ${tableId} not found. Triggering initialization...`);
                if (currentUserId && !isInitializing) {
                    setIsInitializing(true);
                    handlePlayerAction('start').finally(() => {
                        setTimeout(() => setIsInitializing(false), 3000);
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [tableId, currentUserId, isInitializing]);

    // Handle Player Action via Cloud Function
    const handlePlayerAction = async (action: string, amount: number = 0) => {
        if (!currentUserId) {
            console.error('[POKER_GAME] Cannot call action without currentUserId');
            return;
        }

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
                const error = (result.data as any).error;
                console.error('[ACTION] Server Error:', error);
                // Notification handled by UI if needed
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
