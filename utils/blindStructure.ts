export interface BlindLevel {
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    duration: number; // minutes
}

export type BlindStructureType = 'turbo' | 'regular' | 'deep';

export const TOURNAMENT_BLIND_STRUCTURES: Record<BlindStructureType, BlindLevel[]> = {
    turbo: [
        { level: 1, smallBlind: 10, bigBlind: 20, ante: 0, duration: 3 },
        { level: 2, smallBlind: 15, bigBlind: 30, ante: 0, duration: 3 },
        { level: 3, smallBlind: 25, bigBlind: 50, ante: 0, duration: 3 },
        { level: 4, smallBlind: 50, bigBlind: 100, ante: 10, duration: 3 },
        { level: 5, smallBlind: 75, bigBlind: 150, ante: 15, duration: 3 },
        { level: 6, smallBlind: 100, bigBlind: 200, ante: 20, duration: 3 },
        { level: 7, smallBlind: 150, bigBlind: 300, ante: 30, duration: 3 },
        { level: 8, smallBlind: 200, bigBlind: 400, ante: 40, duration: 3 },
        { level: 9, smallBlind: 300, bigBlind: 600, ante: 60, duration: 3 },
        { level: 10, smallBlind: 400, bigBlind: 800, ante: 80, duration: 3 },
        { level: 11, smallBlind: 600, bigBlind: 1200, ante: 120, duration: 3 },
        { level: 12, smallBlind: 800, bigBlind: 1600, ante: 160, duration: 3 },
        { level: 13, smallBlind: 1000, bigBlind: 2000, ante: 200, duration: 3 },
        { level: 14, smallBlind: 1500, bigBlind: 3000, ante: 300, duration: 3 },
        { level: 15, smallBlind: 2000, bigBlind: 4000, ante: 400, duration: 3 },
    ],
    regular: [
        { level: 1, smallBlind: 10, bigBlind: 20, ante: 0, duration: 10 },
        { level: 2, smallBlind: 15, bigBlind: 30, ante: 0, duration: 10 },
        { level: 3, smallBlind: 25, bigBlind: 50, ante: 0, duration: 10 },
        { level: 4, smallBlind: 50, bigBlind: 100, ante: 10, duration: 10 },
        { level: 5, smallBlind: 75, bigBlind: 150, ante: 15, duration: 10 },
        { level: 6, smallBlind: 100, bigBlind: 200, ante: 20, duration: 10 },
        { level: 7, smallBlind: 150, bigBlind: 300, ante: 30, duration: 10 },
        { level: 8, smallBlind: 200, bigBlind: 400, ante: 40, duration: 10 },
        { level: 9, smallBlind: 300, bigBlind: 600, ante: 60, duration: 10 },
        { level: 10, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 10 },
        { level: 11, smallBlind: 750, bigBlind: 1500, ante: 150, duration: 10 },
        { level: 12, smallBlind: 1000, bigBlind: 2000, ante: 200, duration: 10 },
        { level: 13, smallBlind: 1500, bigBlind: 3000, ante: 300, duration: 10 },
        { level: 14, smallBlind: 2000, bigBlind: 4000, ante: 400, duration: 10 },
        { level: 15, smallBlind: 3000, bigBlind: 6000, ante: 600, duration: 10 },
    ],
    deep: [
        { level: 1, smallBlind: 10, bigBlind: 20, ante: 0, duration: 15 },
        { level: 2, smallBlind: 15, bigBlind: 30, ante: 0, duration: 15 },
        { level: 3, smallBlind: 20, bigBlind: 40, ante: 0, duration: 15 },
        { level: 4, smallBlind: 25, bigBlind: 50, ante: 0, duration: 15 },
        { level: 5, smallBlind: 30, bigBlind: 60, ante: 5, duration: 15 },
        { level: 6, smallBlind: 40, bigBlind: 80, ante: 10, duration: 15 },
        { level: 7, smallBlind: 50, bigBlind: 100, ante: 10, duration: 15 },
        { level: 8, smallBlind: 75, bigBlind: 150, ante: 15, duration: 15 },
        { level: 9, smallBlind: 100, bigBlind: 200, ante: 20, duration: 15 },
        { level: 10, smallBlind: 150, bigBlind: 300, ante: 30, duration: 15 },
        { level: 11, smallBlind: 200, bigBlind: 400, ante: 40, duration: 15 },
        { level: 12, smallBlind: 300, bigBlind: 600, ante: 60, duration: 15 },
        { level: 13, smallBlind: 400, bigBlind: 800, ante: 80, duration: 15 },
        { level: 14, smallBlind: 600, bigBlind: 1200, ante: 120, duration: 15 },
        { level: 15, smallBlind: 800, bigBlind: 1600, ante: 160, duration: 15 },
    ]
};

// Helper function to get current blinds
export const getCurrentBlinds = (structure: BlindLevel[], level: number): BlindLevel => {
    const blindLevel = structure[level - 1];
    return blindLevel || structure[structure.length - 1]; // Return last level if exceeded
};

// Helper function to format time remaining
export const formatTimeRemaining = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
