export interface Explanation {
    text: string;
    tip?: string;
    visual?: string;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: Explanation;
}

export interface Module {
    id: string;
    title: string;
    description: string;
    icon: string;
    questions: Question[];
}

const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
const HANDS = ['AA', 'KK', 'QQ', 'AKs', 'JTs', '76s', '22'];
const BOARDS = ['A-K-7 rainbow', 'J-T-9 flush draw', '2-2-5 dry', 'Q-7-2 rainbow'];

// Helper to generate random questions based on templates
const generateQuestions = (moduleId: string, count: number): Question[] => {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        let q: Question;

        // Procedural generation based on module
        switch (moduleId) {
            case 'basics':
                q = generateBasicQuestion(i);
                break;
            case 'preflop':
                q = generatePreflopQuestion(i);
                break;
            case 'postflop':
                q = generatePostflopQuestion(i);
                break;
            case 'mtt':
                q = generateTournamentQuestion(i);
                break;
            case 'mental':
                q = generateMentalQuestion(i);
                break;
            default:
                q = generateBasicQuestion(i);
        }
        questions.push(q);
    }
    return questions;
};

// --- Generators for each module type ---

const generateBasicQuestion = (index: number): Question => {
    const templates = [
        {
            text: "Which hand beats a Full House?",
            options: ["Flush", "Straight", "Four of a Kind", "Three of a Kind"],
            correct: 2,
            expl: {
                text: "Four of a Kind ranks higher than a Full House. The only hand stronger than Four of a Kind is a Straight Flush (or Royal Flush).",
                tip: "Remember: 'Four beats Full'. It's rare but powerful."
            }
        },
        {
            text: "What is the 'Big Blind'?",
            options: ["The dealer button", "A forced bet", "The highest card", "A type of bluff"],
            correct: 1,
            expl: {
                text: "The Big Blind is a mandatory bet posted by the player two positions to the left of the dealer to stimulate action.",
                tip: "The Big Blind defines the stakes of the game (e.g., $1/$2 means the Big Blind is $2)."
            }
        },
        {
            text: "How many betting rounds are there in Texas Hold'em?",
            options: ["2", "3", "4", "5"],
            correct: 2,
            expl: {
                text: "There are 4 rounds: Pre-flop, Flop, Turn, and River.",
                visual: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Poker_Holdem_Preflop.jpg/320px-Poker_Holdem_Preflop.jpg"
            }
        }
    ];
    return {
        id: `basics-${index}`,
        text: `${templates[index % templates.length].text} (Var ${index + 1})`,
        options: templates[index % templates.length].options,
        correctIndex: templates[index % templates.length].correct,
        explanation: templates[index % templates.length].expl
    };
};

const generatePreflopQuestion = (index: number): Question => {
    const pos = POSITIONS[index % POSITIONS.length];
    const hand = HANDS[index % HANDS.length];

    const isEarlyPos = pos === 'UTG' || pos === 'MP';
    const isSmallPair = hand === '22' || hand === '76s'; // Simplified logic

    return {
        id: `pre-${index}`,
        text: `You are in ${pos} with ${hand}. It is folded to you. What is the standard GTO play?`,
        options: ["Fold", "Limp", "Raise 2.5bb", "Shove All-in"],
        correctIndex: (isSmallPair && isEarlyPos) ? 0 : 2, // Simplified logic
        explanation: {
            text: `In ${pos} position, your opening range should be tighter. ${hand} is ${isSmallPair && isEarlyPos ? 'too loose to open' : 'a standard open'} from here.`,
            tip: "Position is power. Play tighter in early position (UTG/MP) and looser in late position (BTN/CO).",
            visual: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Poker_Holdem_Starting_Hands.jpg/320px-Poker_Holdem_Starting_Hands.jpg"
        }
    };
};

const generatePostflopQuestion = (index: number): Question => {
    const board = BOARDS[index % BOARDS.length];
    return {
        id: `post-${index}`,
        text: `Hero c-bets range on ${board}. Villain raises 3x. What is the plan?`,
        options: ["Fold range", "Call with top range only", "Re-raise all-in", "Click back min-raise"],
        correctIndex: 1,
        explanation: {
            text: `Facing a check-raise on a board like ${board} represents strength. You should defend only with your strongest hands and high-equity draws.`,
            tip: "Don't over-fold, but don't call with marginal hands out of position."
        }
    };
};

const generateTournamentQuestion = (index: number): Question => {
    return {
        id: `mtt-${index}`,
        text: `You have ${(index + 1) * 5}bb on the Bubble. 5 players left to money. UTG shoves. You have AKo. call?`,
        options: ["Snap Call", "Fold (ICM Pressure)", "Tank Call", "Flip a coin"],
        correctIndex: index < 5 ? 1 : 0, // Fold if short stack logic (simplified)
        explanation: {
            text: "On the bubble, the value of survival (ICM) is massive. Calling an all-in puts your tournament life at risk.",
            tip: "There is no 'Chip EV' on the bubble. Survival is key."
        }
    };
};

const generateMentalQuestion = (index: number): Question => {
    return {
        id: `mental-${index}`,
        text: "You lost 5 buy-ins in a row due to coolers. What do you do?",
        options: ["Play higher stakes to recover", "Quit and take a break", "Complain in chat", "Play looser"],
        correctIndex: 1,
        explanation: {
            text: "Chasing losses is the quickest way to destroy a bankroll. A strict Stop-Loss rule helps preserve your capital and mental state.",
            tip: "Set a 'Stop Loss' of 3-5 buy-ins per session. If you hit it, quit immediately."
        }
    };
};


export const getModules = (): Module[] => [
    {
        id: 'basics',
        title: 'Poker Basics',
        description: 'Learn hand rankings, rules, and basic terminology.',
        icon: 'school',
        questions: generateQuestions('basics', 20)
    },
    {
        id: 'preflop',
        title: 'Pre-Flop Strategy',
        description: 'Master opening ranges, 3-betting, and position.',
        icon: 'login',
        questions: generateQuestions('preflop', 20)
    },
    {
        id: 'postflop',
        title: 'Post-Flop Strategy',
        description: 'C-betting, check-raising, and playing turns/rivers.',
        icon: 'science',
        questions: generateQuestions('postflop', 20)
    },
    {
        id: 'mtt',
        title: 'Tournament Strategy',
        description: 'ICM, bubble play, and final table dynamics.',
        icon: 'emoji_events',
        questions: generateQuestions('mtt', 20)
    },
    {
        id: 'mental',
        title: 'Psychology & Bankroll',
        description: 'Tilt control, variance, and money management.',
        icon: 'psychology',
        questions: generateQuestions('mental', 20)
    }
];
