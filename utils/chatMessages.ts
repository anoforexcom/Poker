// Chat message templates for bot players
// Hundreds of realistic messages to make the game feel alive

export interface ChatMessage {
    id: string;
    playerId: string;
    playerName: string;
    message: string;
    timestamp: Date;
    type: 'chat' | 'system' | 'emote';
}

export type MessageCategory =
    | 'greeting'
    | 'goodbye'
    | 'reaction_win'
    | 'reaction_loss'
    | 'reaction_bad_beat'
    | 'strategy_comment'
    | 'banter'
    | 'encouragement'
    | 'complaint'
    | 'celebration'
    | 'question'
    | 'small_talk';

// Massive collection of chat messages organized by category
export const BOT_MESSAGES: Record<MessageCategory, string[]> = {
    greeting: [
        "gl everyone!",
        "Good luck all",
        "hey guys",
        "gl hf",
        "Let's gooo",
        "ready to play",
        "hi all",
        "sup everyone",
        "good luck folks",
        "here we go!",
        "let's do this",
        "gl gl",
        "hey hey",
        "what's up poker fam",
        "ready to rumble",
        "good vibes only",
        "let's get it",
        "morning everyone",
        "evening all",
        "back again lol",
        "another tournament, another chance",
        "feeling lucky today",
        "let's make some money",
        "who's ready?",
        "tournament time!",
    ],

    goodbye: [
        "gg all",
        "good game everyone",
        "gotta go, gg",
        "nice playing with you",
        "see ya",
        "later folks",
        "gg wp",
        "well played everyone",
        "that's it for me",
        "time to go",
        "catch you later",
        "good session",
        "til next time",
        "peace out",
        "gg guys",
        "fun game",
        "see you next tournament",
        "good luck rest of you",
        "I'm out, gl all",
        "busted, gg",
    ],

    reaction_win: [
        "YES!!!",
        "nice hand!",
        "let's go!",
        "boom!",
        "got there!",
        "ship it!",
        "finally!",
        "about time",
        "needed that",
        "phew",
        "clutch!",
        "ez",
        "too easy",
        "called it",
        "knew it",
        "yessir",
        "that's what I'm talking about",
        "let's goooo",
        "huge pot",
        "monster pot",
        "doubled up!",
        "back in it",
        "chip leader baby",
        "running hot",
        "can't stop won't stop",
    ],

    reaction_loss: [
        "wow",
        "unreal",
        "seriously?",
        "omg",
        "no way",
        "brutal",
        "sick",
        "of course",
        "typical",
        "rigged lol",
        "always happens",
        "can't catch a break",
        "unlucky",
        "so tilted",
        "this game man",
        "variance is real",
        "poker gods hate me",
        "why always me",
        "unbelievable",
        "had to happen",
        "knew it was coming",
        "story of my life",
        "classic",
        "nh I guess",
        "wp",
    ],

    reaction_bad_beat: [
        "ARE YOU KIDDING ME",
        "that's disgusting",
        "worst beat ever",
        "how is that possible",
        "I'm done",
        "this is insane",
        "unreal bad beat",
        "sick sick sick",
        "I hate poker",
        "never playing again",
        "absolutely disgusting",
        "that hurts",
        "brutal beat",
        "can't believe that",
        "poker is cruel",
        "why do I play this game",
        "tilted off the planet",
        "need a break after that",
        "speechless",
        "wow just wow",
        "that's poker I guess",
        "sick cooler",
        "nothing I could do",
        "played it perfect and still lost",
        "variance is a b****",
    ],

    strategy_comment: [
        "interesting play",
        "bold move",
        "didn't see that coming",
        "nice bluff",
        "good fold",
        "smart play",
        "risky",
        "aggressive",
        "tight play",
        "loose table",
        "gotta tighten up",
        "time to get aggressive",
        "playing too many hands",
        "good laydown",
        "hero call",
        "value bet",
        "thin value",
        "pot committed",
        "priced in",
        "had to call",
        "easy fold",
        "snap call",
        "snap fold",
        "tough spot",
        "close decision",
        "marginal",
        "standard",
        "by the book",
        "textbook play",
        "creative",
    ],

    banter: [
        "lol",
        "lmao",
        "haha",
        "nice try",
        "you wish",
        "in your dreams",
        "not today",
        "nope",
        "keep trying",
        "better luck next time",
        "almost",
        "close but no cigar",
        "not quite",
        "good effort",
        "A for effort",
        "you tried",
        "cute",
        "adorable",
        "that's funny",
        "hilarious",
        "comedy gold",
        "clown move",
        "what was that",
        "questionable",
        "interesting choice",
        "bold strategy cotton",
        "let's see if it pays off",
        "yikes",
        "oof",
        "big oof",
    ],

    encouragement: [
        "nice hand",
        "well played",
        "good call",
        "smart",
        "wp",
        "nh",
        "great read",
        "impressive",
        "solid play",
        "respect",
        "good game",
        "you got this",
        "keep it up",
        "playing well",
        "on fire",
        "crushing it",
        "nice run",
        "good luck",
        "rooting for you",
        "you deserve it",
        "earned that pot",
        "outplayed them",
        "too good",
        "skill",
        "pro move",
        "like a boss",
        "masterclass",
        "clinic",
    ],

    complaint: [
        "these cards man",
        "can't win a hand",
        "so card dead",
        "worst cards ever",
        "give me something",
        "anything please",
        "running bad",
        "can't catch",
        "ice cold",
        "dead money",
        "blinded out",
        "no playable hands",
        "fold fold fold",
        "boring",
        "wake me up when I get aces",
        "this is torture",
        "painful",
        "rough session",
        "not my day",
        "variance",
        "so unlucky",
        "can't buy a hand",
        "deck hates me",
        "shuffler is broken",
        "fix the RNG",
    ],

    celebration: [
        "LETS GOOOOO",
        "YESSSS",
        "BOOM BABY",
        "SHIP IT",
        "GET IN",
        "HUGE",
        "MASSIVE",
        "GIGANTIC POT",
        "TO THE MOON",
        "STONKS",
        "PROFIT",
        "MONEY MONEY MONEY",
        "JACKPOT",
        "BINGO",
        "WINNER WINNER",
        "CHICKEN DINNER",
        "CANT STOP WONT STOP",
        "ON A HEATER",
        "UNSTOPPABLE",
        "GOD MODE",
        "ACTIVATED",
        "LETS GOOOO",
        "IM BACK BABY",
        "COMEBACK SZNNNN",
        "NEVER IN DOUBT",
    ],

    question: [
        "what did you have?",
        "show?",
        "bluff?",
        "really?",
        "you called with that?",
        "how did you know?",
        "good read or lucky?",
        "what were you thinking?",
        "why fold?",
        "why call?",
        "what's the play here?",
        "thoughts?",
        "anyone else would have folded?",
        "bad call or good outcome?",
        "results oriented much?",
        "process over results right?",
        "what do you put me on?",
        "range?",
        "blockers?",
        "equity?",
        "pot odds?",
        "implied odds?",
        "reverse implied odds?",
        "am I crazy?",
        "talk me out of this",
    ],

    small_talk: [
        "how's everyone doing?",
        "good day?",
        "anyone else tired?",
        "coffee time",
        "need a break",
        "been playing all day",
        "first tournament today",
        "playing a lot lately",
        "haven't played in a while",
        "rusty",
        "getting back into it",
        "love this game",
        "hate this game lol",
        "so addicting",
        "one more tournament",
        "last one I swear",
        "should be sleeping",
        "work tomorrow ugh",
        "weekend vibes",
        "friday night poker",
        "nothing better",
        "beats watching tv",
        "more fun than netflix",
        "anyone else multi-tabling?",
        "how many tables you playing?",
        "focus mode activated",
        "trying to concentrate",
        "music on or off?",
        "what you listening to?",
        "good playlist recommendations?",
    ],
};

// Emotes/reactions
export const EMOTES = [
    "😂", "😎", "🔥", "💪", "👍", "👎", "😭", "😤", "🤔", "😱",
    "🎉", "💰", "🃏", "♠️", "♥️", "♦️", "♣️", "🎯", "⚡", "💀",
    "🤡", "👑", "🦈", "🐟", "🚀", "📈", "📉", "💎", "🙏", "😈"
];

// Context-aware message generation
export const getContextMessage = (context: {
    event: 'big_pot' | 'all_in' | 'fold' | 'river_card' | 'tournament_start' | 'bubble' | 'final_table';
    playerCount?: number;
}): string => {
    const messages: Record<string, string[]> = {
        big_pot: [
            "huge pot!",
            "monster pot",
            "biggest pot of the tournament",
            "all the chips",
            "pot of the day",
            "massive",
        ],
        all_in: [
            "all in!",
            "someone's going home",
            "tournament life on the line",
            "do or die",
            "this is it",
            "moment of truth",
            "showdown time",
        ],
        fold: [
            "good fold",
            "smart laydown",
            "live to fight another day",
            "patience",
            "disciplined",
        ],
        river_card: [
            "river card!",
            "one more card",
            "here we go",
            "sweat the river",
            "please please please",
            "don't pair the board",
        ],
        tournament_start: [
            "let's get this started",
            "tournament is live!",
            "here we go!",
            "good luck everyone",
            "may the best player win",
            "let the games begin",
        ],
        bubble: [
            "bubble time",
            "don't be the bubble",
            "so close to the money",
            "play tight now",
            "pressure is on",
            "nervous",
        ],
        final_table: [
            "FINAL TABLE!!!",
            "we made it!",
            "final table baby",
            "this is where it counts",
            "big money time",
            "let's win this thing",
        ],
    };

    const options = messages[context.event] || ["..."];
    return options[Math.floor(Math.random() * options.length)];
};

// Generate random message from category
export const getRandomMessage = (category: MessageCategory): string => {
    const messages = BOT_MESSAGES[category];
    return messages[Math.floor(Math.random() * messages.length)];
};

// Generate random emote
export const getRandomEmote = (): string => {
    return EMOTES[Math.floor(Math.random() * EMOTES.length)];
};

// Bot personality types affect message frequency and style
export type BotPersonality = 'chatty' | 'quiet' | 'toxic' | 'friendly' | 'professional';

export const getBotMessageFrequency = (personality: BotPersonality): number => {
    // Returns probability (0-1) of sending a message per minute
    switch (personality) {
        case 'chatty': return 0.8;
        case 'quiet': return 0.1;
        case 'toxic': return 0.6;
        case 'friendly': return 0.5;
        case 'professional': return 0.2;
        default: return 0.3;
    }
};

export const getPersonalityCategories = (personality: BotPersonality): MessageCategory[] => {
    switch (personality) {
        case 'chatty':
            return ['greeting', 'small_talk', 'question', 'banter', 'reaction_win', 'reaction_loss'];
        case 'quiet':
            return ['greeting', 'goodbye'];
        case 'toxic':
            return ['banter', 'complaint', 'reaction_loss', 'reaction_bad_beat', 'celebration'];
        case 'friendly':
            return ['greeting', 'encouragement', 'small_talk', 'celebration', 'goodbye'];
        case 'professional':
            return ['strategy_comment', 'greeting', 'goodbye'];
        default:
            return ['greeting', 'reaction_win', 'reaction_loss', 'goodbye'];
    }
};
