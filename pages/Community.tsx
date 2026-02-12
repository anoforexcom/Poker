import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { generateBotName } from '../utils/nameGenerator';

const Community: React.FC = () => {
  const { user } = useGame();

  // --- MOCK DATA GENERATION ---
  const INITIAL_TOPICS = [
    {
      id: 1, pinned: true, author: "Admin_Renan", title: "Analysis: 3-Bet Pot OOP in Dynamic Boards",
      votes: 242, comments: 4, time: "3h ago", tag: "Pinned",
      body: "Here is a deep dive into how to construct your checking ranges when out of position on boards like T-9-7 rainbow or J-8-6 with a flush draw. The key is to protect your checking range with some strong hands while realizing that your overall equity is lower...",
      thread: [
        { id: 101, author: generateBotName(), text: "Great analysis! Helped my game a lot. I always struggled with deciding which overpairs to check.", time: "2h ago" },
        { id: 102, author: generateBotName(), text: "I disagree with the river bluff frequency here. Against a typical reg, this is over-bluffing.", time: "1h ago" },
        { id: 103, author: generateBotName(), text: "Can you explain why we don't lead the turn on a blank?", time: "45m ago" },
        { id: 104, author: "Admin_Renan", text: "Because leading creates a capped range for our check, making us easy to exploit on the river.", time: "10m ago" }
      ]
    },
    {
      id: 2, pinned: false, author: generateBotName(), title: "How to deal with aggressive limpers in Micro Stakes?",
      votes: 56, comments: 2, time: "1h ago", tag: "Question",
      body: "I'm struggling against players who limp-raise every hand in NL5. It feels like they always have it or they're just clicking buttons. Any tips?",
      thread: [
        { id: 201, author: generateBotName(), text: "In micro stakes, limp-raise is usually AA/KK. Just fold unless you have a set mine opportunity.", time: "30m ago" },
        { id: 202, author: generateBotName(), text: "Actually, some whales do it with air. Check their VPIP.", time: "5m ago" }
      ]
    },
    {
      id: 3, pinned: false, author: generateBotName(), title: "My journey from NL2 to NL25 in 3 months",
      votes: 128, comments: 3, time: "5h ago", tag: "Success",
      body: "It wasn't easy, but strict bankroll management (50 buy-ins) was key to surviving the variance. I also used the Academia section here daily!",
      thread: [
        { id: 301, author: generateBotName(), text: "Congrats! That's a huge step. NL25 is where the real game starts.", time: "4h ago" },
        { id: 302, author: generateBotName(), text: "What was your winrate at NL10?", time: "2h ago" },
        { id: 303, author: generateBotName(), text: "Nice work. Are you planning to move to NL50 soon?", time: "1h ago" }
      ]
    }
  ];

  // Generate 47 more posts to reach 50
  const tags = ["Strategy", "Hand Analysis", "General", "Question", "Success", "Tilt", "Bad Beat"];
  const titles = [
    "Folded KK pre-flop. Did I overthink it?",
    "Best hours to play on BestPoker.Cash?",
    "Is it worth it to buy a HUD in 2026?",
    "Tournament bubble strategy: Tight or Aggressive?",
    "Dealing with 4-bets from the blinds",
    "Finally hit my first Royal Flush!",
    "Bankroll management for MTTs vs Cash",
    "How to spot a bot in 2026?",
    "Psychology of a Downswing",
    "GTO vs Exploit: Which is better for Micro?",
    "Bounty tournaments: How to value a head?",
    "PLO is the future of poker. Change my mind.",
    "Streamers, why do you show your hole cards?",
    "Poker in Brazil: The community is growing!",
    "Best snacks for a 12-hour session?",
    "How to read live tells on a digital table?",
    "Small blind vs Big blind: The ultimate war.",
    "The math of calling a shove on the flop.",
    "Winning a tournament on mobile: Possible?",
    "Short Deck strategy for beginners",
    "My setup: 4 monitors for maximum grinding",
    "Is coffee better than tea for focus?",
    "Reading the board: Avoiding the obvious flush",
    "Check-raising the dry flop",
    "Donk betting: Is it ever correct?",
    "Stacking off with top pair: Good or Bad?",
    "Variance in Spin & Go is insane.",
    "Looking for a study group (Gold rank only)",
    "The importance of sleep for high stakes",
    "Hero call of the century! Check the video.",
    "Why I quit poker and why I'm back.",
    "Bluffing the river when the flush hits.",
    "Pocket Aces: My 10th loss in a row.",
    "Spin and Go strategy for multipliers.",
    "The 2-7 Triple Draw challenge.",
    "Mental game coaching: Is it worth $500?",
    "Streaming my climb to NL100 tonight.",
    "Poker software recommendations?",
    "Adapting to the new blind structure.",
    "The state of the community in 2026.",
    "Funny hand: We both had the same flush.",
    "Double or Nothing: The safest grind?",
    "Improving post-flop play with 40BB.",
    "Satellite strategy for the Sunday Million.",
    "What's your biggest win ever?",
    "Poker and Fitness: Stay healthy, play better.",
    "Reviewing my stats after 100k hands."
  ];

  for (let i = 0; i < titles.length; i++) {
    const commentCount = Math.floor(Math.random() * 8);
    const mockThread = Array.from({ length: commentCount }).map((_, j) => ({
      id: (i + 4) * 100 + j,
      author: generateBotName(),
      text: [
        "I agree with this.", "Nice post!", "Interesting perspective.",
        "I need to try this.", "How do you handle the variance?",
        "GTO says we should fold here.", "LOL what a whale.",
        "Nice win man!", "This helped me a lot.", "What was the pot size?"
      ][Math.floor(Math.random() * 10)],
      time: `${Math.floor(Math.random() * 20) + 1}h ago`
    }));

    INITIAL_TOPICS.push({
      id: i + 4,
      pinned: false,
      author: generateBotName(),
      title: titles[i],
      votes: Math.floor(Math.random() * 150),
      comments: commentCount,
      time: `${Math.floor(Math.random() * 24)}h ago`,
      tag: tags[Math.floor(Math.random() * tags.length)],
      body: `This is a long and detailed post about ${titles[i]}. I have been playing poker for years and I think that the most important thing is...`,
      thread: mockThread
    });
  }

  // --- STATE ---
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [topics, setTopics] = useState(INITIAL_TOPICS);

  // Side Chat Data
  const [chatMessage, setChatMessage] = useState('');
  const [globalChat, setGlobalChat] = useState([
    { author: generateBotName(), time: "14:02", message: "Did anyone see the Sunday Million field? It's soft.", color: "text-primary" },
    { author: generateBotName(), time: "14:03", message: "Soft for you, I got 3 bad beats in 10 mins... 😭", color: "text-slate-400" },
    { author: "Coach_Matheus", time: "14:05", message: "Ranges class starting in 15 mins in Room 2!", color: "text-gold", staff: true },
    { author: generateBotName(), time: "14:07", message: "I'll be there! Need to adjust my 3-bets.", color: "text-slate-400" }
  ]);
  // New Topic Inputs
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  // ID Counter
  const [nextId, setNextId] = useState(54);

  // --- ACTIONS ---

  const handleVote = (id: number, type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    setTopics(prev => prev.map(t => t.id === id ? { ...t, votes: t.votes + (type === 'up' ? 1 : -1) } : t));
  };

  const handlePostTopic = () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const newTopic = {
      id: nextId,
      pinned: false,
      author: user.name,
      title: newTitle,
      votes: 0,
      comments: 0,
      time: "Just now",
      tag: "General",
      body: newBody,
      thread: []
    };
    setTopics([newTopic, ...topics]);
    setNextId(nextId + 1);
    setNewTitle('');
    setNewBody('');
    setShowNewTopicModal(false);
  };

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    setGlobalChat(prev => [...prev, {
      author: user.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: chatMessage,
      color: "text-white"
    }]);
    setChatMessage('');

    // Sim Reply
    setTimeout(() => {
      setGlobalChat(prev => [...prev, {
        author: generateBotName(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: ["Lol", "True", "Aggree", "Nice", "Anyone for HU?"][Math.floor(Math.random() * 5)],
        color: "text-slate-400"
      }]);
    }, 2000);
  };

  const openTopic = (id: number) => {
    setSelectedTopicId(id);
    setView('detail');
  };

  // --- RENDER ---
  const activeTopic = topics.find(t => t.id === selectedTopicId);

  return (
    <div className="flex h-full relative">
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-white font-display">
              {view === 'list' ? 'Discussion Strategy' :
                <button onClick={() => setView('list')} className="hover:text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">arrow_back</span> Back to Forum
                </button>
              }
            </h1>
            {view === 'list' && (
              <button onClick={() => setShowNewTopicModal(true)} className="bg-primary text-background font-black text-sm px-6 py-2.5 rounded-xl shadow-lg hover:brightness-110 flex items-center gap-2 transition">
                <span className="material-symbols-outlined">edit_square</span> NEW TOPIC
              </button>
            )}
          </div>

          {/* LIST VIEW */}
          {view === 'list' && (
            <>
              <div className="flex gap-4 border-b border-border-dark">
                <button className="pb-4 text-sm font-bold border-b-2 border-primary text-primary px-2">Recents (50+)</button>
                <button className="pb-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-white px-2">Trending</button>
                <button className="pb-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-white px-2">Hands Analysis</button>
              </div>

              <div className="space-y-4">
                {topics.map(topic => (
                  <div key={topic.id} onClick={() => openTopic(topic.id)} className={`bg-surface border p-6 rounded-xl transition-all cursor-pointer hover:shadow-lg hover:border-slate-600 ${topic.pinned ? 'border-primary/30 shadow-primary/5' : 'border-border-dark'}`}>
                    <div className="flex gap-6">
                      {/* Votes */}
                      <div className="flex flex-col items-center shrink-0 w-12 pt-1 gap-1">
                        <button onClick={(e) => handleVote(topic.id, 'up', e)} className="material-symbols-outlined text-slate-500 hover:text-green-400 text-xl font-bold">keyboard_arrow_up</button>
                        <span className={`text-sm font-black ${topic.votes > 0 ? 'text-white' : 'text-slate-500'}`}>{topic.votes}</span>
                        <button onClick={(e) => handleVote(topic.id, 'down', e)} className="material-symbols-outlined text-slate-500 hover:text-red-400 text-xl font-bold">keyboard_arrow_down</button>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${topic.pinned ? 'bg-primary/20 text-primary' : 'bg-background text-slate-500'}`}>{topic.tag}</span>
                          <span className="text-xs text-slate-500">Posted by <strong className="text-slate-300">{topic.author}</strong> • {topic.time}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 hover:text-primary transition-colors leading-snug">{topic.title}</h3>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="material-symbols-outlined text-lg">chat_bubble</span>
                            <span className="text-xs font-bold">{topic.thread.length} Comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && activeTopic && (
            <div className="space-y-6">
              <div className="bg-surface border border-border-dark p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeTopic.author}`} className="size-12 rounded-full border-2 border-primary/20 p-0.5" />
                    <div className="absolute bottom-0 right-0 size-3.5 bg-poker-green rounded-full border-2 border-surface"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{activeTopic.title}</h2>
                    <p className="text-sm text-slate-400">Posted by <span className="text-primary font-bold">{activeTopic.author}</span> • {activeTopic.time}</p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed mb-8">
                  <p>{activeTopic.body}</p>
                </div>
                <div className="pt-6 border-t border-border-dark flex items-center justify-between">
                  <div className="flex gap-6">
                    <button className="flex items-center gap-2 text-slate-400 hover:text-white transition group">
                      <span className="material-symbols-outlined group-hover:text-primary">thumb_up</span>
                      <span className="text-xs font-bold">Helpful</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-white transition group">
                      <span className="material-symbols-outlined group-hover:text-primary">share</span>
                      <span className="text-xs font-bold">Share</span>
                    </button>
                  </div>
                  <div className="bg-background px-4 py-1.5 rounded-full border border-border-dark">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discussion ({activeTopic.thread.length})</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                {activeTopic.thread.length === 0 ? <p className="text-slate-500 italic">No comments yet. Be the first!</p> : (
                  activeTopic.thread.map(comment => (
                    <div key={comment.id} className="bg-background/80 border border-white/5 p-6 rounded-2xl flex gap-5 transition-all hover:border-white/10">
                      <div className="shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`} className="size-10 rounded-full border border-border-dark bg-surface p-0.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-primary transition-colors cursor-pointer">{comment.author}</span>
                            <span className="size-1 bg-slate-600 rounded-full"></span>
                            <span className="text-xs text-slate-500">{comment.time}</span>
                          </div>
                          <button className="text-slate-600 hover:text-white transition"><span className="material-symbols-outlined text-base">more_horiz</span></button>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{comment.text}</p>
                        <div className="mt-4 flex gap-4">
                          <button className="text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-sm">reply</span> Reply</button>
                          <button className="text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-sm">thumb_up_off</span> Upvote</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SIDE CHAT */}
      <aside className="w-80 border-l border-border-dark bg-surface/5 flex flex-col shrink-0 h-full">
        <div className="p-4 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2.5 bg-poker-green rounded-full animate-pulse"></div>
            <h3 className="font-bold text-sm text-white">Global Chat</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">1,248 Online</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {globalChat.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black ${msg.color || 'text-slate-300'}`}>{msg.author}</span>
                {msg.staff && <span className="bg-gold/10 text-gold px-1 rounded text-[8px] font-black uppercase">Staff</span>}
                <span className="text-[9px] text-slate-600">{msg.time}</span>
              </div>
              <div className="bg-background/80 p-3 rounded-tr-xl rounded-b-xl max-w-[90%] border border-border-dark">
                <p className="text-xs text-slate-300 leading-relaxed">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border-dark bg-background">
          <div className="bg-surface rounded-xl border border-border-dark p-2 flex items-center gap-2 focus-within:ring-1 focus-within:ring-primary transition-all">
            <input
              className="flex-1 bg-transparent border-none text-xs focus:ring-0 placeholder:text-slate-600 text-white"
              placeholder="Write a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            />
            <button onClick={handleSendChat} className="text-primary hover:brightness-110">
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      </aside>

      {/* NEW TOPIC MODAL */}
      {showNewTopicModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowNewTopicModal(false)}>
          <div className="bg-surface border border-border-dark p-8 rounded-2xl w-full max-w-lg shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-white">Create New Topic</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Title</label>
                <input
                  className="w-full bg-background border border-border-dark rounded-lg p-3 text-white focus:ring-primary focus:border-primary"
                  placeholder="e.g., Analysis of Hand #402"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Content</label>
                <textarea
                  className="w-full h-32 bg-background border border-border-dark rounded-lg p-3 text-white focus:ring-primary focus:border-primary resize-none"
                  placeholder="Write your topic here..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewTopicModal(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
              <button onClick={handlePostTopic} className="bg-primary hover:bg-blue-600 px-6 py-2 rounded-lg text-background font-black text-sm shadow-lg transition">POST TOPIC</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
