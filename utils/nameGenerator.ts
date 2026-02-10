
const PREFIXES = [
    'River', 'Pot', 'All-in', 'Big', 'Blind', 'Check', 'Fold', 'Royal', 'Flush', 'Straight',
    'Pocket', 'Hero', 'Villain', 'Shark', 'Fish', 'Nut', 'Tilt', 'Value', 'Bluff', 'Slow',
    'Dr.', 'Mr.', 'Mrs.', 'Pro', 'Ace', 'King', 'Queen', 'Jack', 'Suited', 'Offsuit',
    'Limit', 'NoLimit', 'Short', 'Deep', 'Stack', 'Chip', 'Table', 'Seat', 'Dealer', 'Bet'
];

const SUFFIXES = [
    'Rat', 'King', 'Master', 'Pro', 'Bot', 'Slayer', 'Hunter', 'Fisher', 'Shark', 'Whale',
    'Donkey', 'Maniac', 'Nit', 'Grinder', 'Crusher', 'Stacker', 'Chaser', 'Caller', 'Folder',
    'Raiser', 'Better', 'Gambler', 'Player', 'User', 'Winner', 'Loser', 'Champ', 'Legend',
    'God', 'Boss', 'Leader', 'Star', 'Hero', 'Villian', 'Joker', 'Wizard', 'Ninja', 'Samurai'
];

export const generateBotName = (): string => {
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    const number = Math.floor(Math.random() * 1000);

    // 30% chance of just PrefixSuffix, 70% PrefixSuffixNumber
    if (Math.random() > 0.7) {
        return `${prefix}${suffix}`;
    } else {
        return `${prefix}${suffix}${number}`;
    }
};

export const generateBotAvatar = (seed: string): string => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};
