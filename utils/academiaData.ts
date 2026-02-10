export interface Question {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
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
            expl: "Four of a Kind ranks higher than a Full House."
        },
        {
            text: "What is the 'Big Blind'?",
            options: ["The dealer button", "A forced bet", "The highest card", "A type of bluff"],
            correct: 1,
            expl: "The Big Blind is a mandatory bet posted by the player two positions to the left of the dealer."
        },
        {
            text: "How many betting rounds are there in Texas Hold'em?",
            options: ["2", "3", "4", "5"],
            correct: 2,
            expl: "There are 4 rounds: Pre-flop, Flop, Turn, and River."
        }
    ];
    return {
        id: `basics-${index}`,
        ...templates[index % templates.length],
        text: `${templates[index % templates.length].text} (Var ${index + 1})` // Adding variation suffix to simulate uniqueness
    };
};

const generatePreflopQuestion = (index: number): Question => {
    const pos = POSITIONS[index % POSITIONS.length];
    const hand = HANDS[index % HANDS.length];

    return {
        id: `pre-${index}`,
        text: `You are in ${pos} with ${hand}. It is folded to you. What is the standard GTO play?`,
        options: ["Fold", "Limp", "Raise 2.5bb", "Shove All-in"],
        correctIndex: (hand === '22' && pos === 'UTG') ? 0 : 2, // Simplified logic
        explanation: "Opening ranges generally dictate raising with strong premiums or folding weak pairs early."
    };
};

const generatePostflopQuestion = (index: number): Question => {
    const board = BOARDS[index % BOARDS.length];
    return {
        id: `post-${index}`,
        text: `Hero c-bets range on ${board}. Villain raises 3x. What is the plan?`,
        options: ["Fold range", "Call with top range only", "Re-raise all-in", "Click back min-raise"],
        correctIndex: 1,
        explanation: "Facing a check-raise on this texture usually requires continuing only with strong equity hands."
    };
};

const generateTournamentQuestion = (index: number): Question => {
    return {
        id: `mtt-${index}`,
        text: `You have ${(index + 1) * 5}bb on the Bubble. 5 players left to money. UTG shoves. You have AKo. call?`,
        options: ["Snap Call", "Fold (ICM Pressure)", "Tank Call", "Flip a coin"],
        correctIndex: index < 5 ? 1 : 0, // Fold if short stack logic (simplified)
        explanation: "On the bubble, preserving your stack is often more important than chips gained (ICM)."
    };
};

const generateMentalQuestion = (index: number): Question => {
    return {
        id: `mental-${index}`,
        text: "You lost 5 buy-ins in a row due to coolers. What do you do?",
        options: ["Play higher stakes to recover", "Quit and take a break", "Complain in chat", "Play looser"],
        correctIndex: 1,
        explanation: "Stop-loss and mental reset are crucial to avoiding tilt."
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
