
import React from 'react';

const Community: React.FC = () => {
  return (
    <div className="flex h-full">
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-white font-display">Discussion Strategy</h1>
            <button className="bg-primary text-background font-black text-sm px-6 py-2.5 rounded-xl shadow-lg hover:brightness-110 flex items-center gap-2">
              <span className="material-symbols-outlined">edit_square</span> NEW TOPIC
            </button>
          </div>

          <div className="flex gap-4 border-b border-border-dark">
            <button className="pb-4 text-sm font-bold border-b-2 border-primary text-primary px-2">Recents</button>
            <button className="pb-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-white px-2">Trending</button>
            <button className="pb-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-white px-2">Hands Analysis</button>
          </div>

          <div className="space-y-4">
            <ForumCard 
              pinned
              author="Admin_Renan"
              title="Analysis: 3-Bet Pot OOP in Dynamic Boards"
              votes={242}
              comments={84}
              time="3h ago"
              tag="Pinned"
            />
            <ForumCard 
              author="TheShark_MT"
              title="How to deal with aggressive limpers in Micro Stakes?"
              votes={56}
              comments={12}
              time="1h ago"
              tag="Question"
            />
            <ForumCard 
              author="Luckbox99"
              title="My journey from NL2 to NL25 in 3 months"
              votes={128}
              comments={54}
              time="5h ago"
              tag="Success"
            />
          </div>
        </div>
      </main>

      <aside className="w-80 border-l border-border-dark bg-surface/5 flex flex-col shrink-0 h-full">
        <div className="p-4 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2.5 bg-poker-green rounded-full animate-pulse"></div>
            <h3 className="font-bold text-sm text-white">Global Chat</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">1,248 Online</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <ChatMessage author="Pro_Dealer" time="14:02" message="Did anyone see the Sunday Million field? It's soft." color="text-primary" />
          <ChatMessage author="FishMagnet" time="14:03" message="Soft for you, I got 3 bad beats in 10 mins... 😭" color="text-slate-400" />
          <ChatMessage author="Coach_Matheus" time="14:05" message="Ranges class starting in 15 mins in Room 2!" color="text-gold" staff />
          <ChatMessage author="RiverRat" time="14:07" message="I'll be there! Need to adjust my 3-bets." color="text-slate-400" />
        </div>

        <div className="p-4 border-t border-border-dark bg-background">
          <div className="bg-surface rounded-xl border border-border-dark p-2 flex items-center gap-2">
            <input className="flex-1 bg-transparent border-none text-xs focus:ring-0 placeholder:text-slate-600" placeholder="Write a message..." />
            <button className="text-primary hover:brightness-110">
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

const ForumCard = ({ pinned, author, title, votes, comments, time, tag }: any) => (
  <div className={`bg-surface border p-6 rounded-xl transition-all cursor-pointer hover:shadow-lg ${
    pinned ? 'border-primary/30 shadow-primary/5' : 'border-border-dark'
  }`}>
    <div className="flex gap-6">
      <div className="flex flex-col items-center shrink-0 w-12 pt-1">
        <span className="material-symbols-outlined text-primary mb-1">stat_3</span>
        <span className="text-sm font-black text-white">{votes}</span>
        <span className="text-[9px] text-slate-500 font-bold uppercase">Votes</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
            pinned ? 'bg-primary/20 text-primary' : 'bg-background text-slate-500'
          }`}>{tag}</span>
          <span className="text-xs text-slate-500">Posted by <strong className="text-slate-300">{author}</strong> • {time}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-4 hover:text-primary transition-colors leading-snug">{title}</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-lg">chat_bubble</span>
            <span className="text-xs font-bold">{comments} Comments</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-lg">share</span>
            <span className="text-xs font-bold">Share</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ChatMessage = ({ author, time, message, color, staff }: any) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-black ${color}`}>{author}</span>
      {staff && <span className="bg-gold/10 text-gold px-1 rounded text-[8px] font-black uppercase">Staff</span>}
      <span className="text-[9px] text-slate-600">{time}</span>
    </div>
    <div className="bg-background/80 p-3 rounded-tr-xl rounded-b-xl max-w-[90%] border border-border-dark">
      <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
    </div>
  </div>
);

export default Community;
