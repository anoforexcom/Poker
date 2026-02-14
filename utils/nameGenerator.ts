const adjectives = ['Quick', 'Smart', 'Lucky', 'Brave', 'Clever', 'Fierce'];
const nouns = ['Tiger', 'Eagle', 'Shark', 'Wolf', 'Dragon', 'Phoenix'];

export const generateBotName = (): string => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${number}`;
};
