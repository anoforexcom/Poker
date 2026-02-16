import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useGame } from '../contexts/GameContext';

interface ChatPanelProps {
    tournamentId: string;
    isMinimized?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ tournamentId, isMinimized = false }) => {
    const { getMessages, addMessage } = useChat();
    const { user } = useGame();
    const [inputMessage, setInputMessage] = useState('');
    const [minimized, setMinimized] = useState(isMinimized);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages = getMessages(tournamentId);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        addMessage(tournamentId, {
            playerId: 'user',
            playerName: user.name,
            message: inputMessage,
            type: 'chat',
        });

        setInputMessage('');
    };

    if (minimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setMinimized(false)}
                    className="bg-surface border border-border-dark rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-surface/80 transition-colors shadow-lg"
                >
                    <span className="material-symbols-outlined text-primary">chat</span>
                    <span className="text-white font-bold">Chat</span>
                    {messages.length > 0 && (
                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {messages.length}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-surface border-l border-border-dark">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark bg-black/20">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">chat</span>
                    <h3 className="text-white font-bold">Tournament Chat</h3>
                </div>
                <button
                    onClick={() => setMinimized(true)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">minimize</span>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">forum</span>
                        <p className="text-sm">No messages yet. Be the first to chat!</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex flex-col gap-1 ${msg.playerId === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            {msg.type === 'system' ? (
                                <div className="text-center w-full">
                                    <span className="text-xs text-slate-500 italic">{msg.message}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${(() => {
                                            const colors = ['text-blue-400', 'text-green-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400', 'text-cyan-400'];
                                            let hash = 0;
                                            const name = msg.playerName || 'Player';
                                            for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                                            return colors[Math.abs(hash) % colors.length];
                                        })()}`}>
                                            {msg.playerName}
                                        </span>
                                        <span className="text-[8px] text-slate-600 font-bold">
                                            {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${msg.playerId === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                                            }`}
                                    >
                                        <p className="text-sm font-medium">{msg.message}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border-dark bg-black/20">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                        maxLength={200}
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                    {inputMessage.length}/200
                </p>
            </form>
        </div>
    );
};

export default ChatPanel;
