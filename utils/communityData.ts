import { generateBotName } from './nameGenerator';

export interface Comment {
    id: string;
    author: string;
    avatar: string;
    content: string;
    timestamp: string;
    likes: number;
}

export interface ForumTopic {
    id: string;
    title: string;
    author: string;
    authorAvatar: string;
    category: 'Strategy' | 'General' | 'News' | 'Off-topic' | 'Hand Analysis';
    replies: number;
    views: number;
    lastActive: string;
    votes: number;
    content: string; // The main post body
    thread: Comment[]; // The actual comments
}

const TITLES = {
    Strategy: [
        "How to play AKs out of position?",
        "3-betting ranges from the cutoff",
        "Defending the Big Blind against min-raises",
        "GTO vs Exploit: When to switch?",
        "Is check-raising the flop too aggressive here?",
        "River bluffing frequencies in low stakes",
        "Adjusting to nit-heavy tables",
        "C-bet sizing on wet textures",
        "Fold equity in multi-way pots",
        "ICM pressure in final tables"
    ],
    General: [
        "Best poker room in Vegas?",
        "Online poker is rigged? (Discussion)",
        "My journey from $10 to $10k",
        "Looking for a study group",
        "Favorite poker books of all time",
        "Setup configurations for multi-tabling",
        "Managing bankroll swings",
        "Poker mindset and tilting",
        "Live vs Online: valid transitions?",
        "Funny stories from the felt"
    ],
    "Hand Analysis": [
        "Hand Analysis: JJ facing 4-bet shove",
        "Hand Analysis: River call with bottom pair?",
        "Hand Analysis: Set over set deep stack",
        "Hand Analysis: Missed value on the river?",
        "Hand Analysis: Hero fold with Kings?",
        "Hand Analysis: Bluffing the scare card",
        "Hand Analysis: 22 in a 3-bet pot",
        "Hand Analysis: AQs missed flush draw line",
        "Hand Analysis: Managing TPTK on scary boards",
        "Hand Analysis: Bubbling the Sunday Million"
    ]
};

const BODY_TEMPLATES = [
    "I was playing 100NL yesterday and this spot came up. Villain is a reg, stats 24/18. I open UTG, he 3-bets from BTN. what's the plan?",
    "Been struggling with this lately. Does anyone have a good chart or heuristic for this situation? I feel like I'm burning money.",
    "Just wanted to share this graph. It's been a grind but finally breaking even after a tough downswing. Keep fighting!",
    "Serious question: specific tell that someone is weak when they tank for exactly 5 seconds? I've noticed this pattern.",
    "Here is the hand history:\nHero (UTG): AsKs\nVillain (BB): 80bb stack\n\nFlop comes 7s 8s 2d. I c-bet 1/3 pot, he raises..."
];

const COMMENT_TEMPLATES = [
    "Standard fold pre-flop IMO.",
    "I actually like the raise here, puts pressure on their mid-range hands.",
    "Have you run this in a solver? Pretty sure it's a mix.",
    "Villain dependant. If he's a nit, fold. If aggro, snap call.",
    "Nice graph man! Keep it up.",
    "This is why I love this game, so many layers.",
    "Don't be results oriented. You played it fine.",
    "Calculated risk. Unlucky this time.",
    "Following this, interesting spot.",
    "Lol typical variance."
];

export const generateTopics = (count: number): ForumTopic[] => {
    const topics: ForumTopic[] = [];

    for (let i = 0; i < count; i++) {
        const categoryKeys = Object.keys(TITLES) as (keyof typeof TITLES)[];
        // weighting: make Strategy/Hand Analysis more common
        const category = Math.random() > 0.3
            ? (Math.random() > 0.5 ? 'Strategy' : 'Hand Analysis')
            : 'General';

        const titleList = TITLES[category as keyof typeof TITLES] || TITLES['General'];
        const titleBase = titleList[Math.floor(Math.random() * titleList.length)];
        // Add unique variation to title
        const title = `${titleBase} ${Math.floor(Math.random() * 999)}`;

        const author = generateBotName();
        const commentCount = Math.floor(Math.random() * 45) + 2; // Ensure at least 2 comments
        const timeAgo = Math.floor(Math.random() * 24) + 1;

        // Generate Comments
        const thread: Comment[] = Array.from({ length: commentCount }).map((_, idx) => ({
            id: `c-${i}-${idx}`,
            author: generateBotName(),
            avatar: `https://picsum.photos/seed/${Math.random()}/50/50`,
            content: COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)],
            timestamp: `${Math.max(1, timeAgo - Math.floor(idx / 2))}h ago`,
            likes: Math.floor(Math.random() * 20)
        }));

        topics.push({
            id: `topic-${i}`,
            title: title,
            author: author,
            authorAvatar: `https://picsum.photos/seed/${author}/50/50`,
            category: category,
            replies: commentCount, // MUST MATCH thread.length
            views: commentCount * (Math.floor(Math.random() * 10) + 5),
            lastActive: `${Math.floor(Math.random() * 59) + 1}m`,
            votes: Math.floor(Math.random() * 100) + (category === 'Hand Analysis' ? 20 : 0), // Boost Hand Analysis votes for "Trending" simulation
            content: BODY_TEMPLATES[Math.floor(Math.random() * BODY_TEMPLATES.length)],
            thread: thread
        });
    }

    return topics.sort((a, b) => parseInt(a.lastActive) - parseInt(b.lastActive));
};
