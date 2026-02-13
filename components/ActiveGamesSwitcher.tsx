import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useLiveWorld } from '../contexts/LiveWorldContext';

export const ActiveGamesSwitcher: React.FC = () => {
    const { activeGames, removeActiveGame } = useGame();
    const { tournaments } = useLiveWorld();
    const location = useLocation();

    if (activeGames.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 p-4 md:p-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-4 md:px-0">Mesa Ativas</p>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {activeGames.map(gameId => {
                    const tournament = tournaments.find(t => t.id === gameId);
                    const isActive = location.pathname.includes(gameId);

                    return (
                        <div
                            key={gameId}
                            className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all ${isActive
                                    ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10'
                                    : 'bg-surface/50 border-border-dark hover:bg-surface hover:border-slate-600'
                                }`}
                        >
                            <Link to={`/table/${gameId}`} className="flex-1 flex items-center gap-3 min-w-0">
                                <div className={`size-2 rounded-full ${isActive ? 'bg-primary animate-pulse' : 'bg-slate-600'}`}></div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-white truncate leading-tight">
                                        {tournament?.name || `Table #${gameId.substring(0, 5)}`}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-medium">
                                        {tournament?.type?.toUpperCase() || 'POKER'} • ${tournament?.buyIn || '0'}
                                    </p>
                                </div>
                            </Link>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    removeActiveGame(gameId);
                                }}
                                className="size-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                title="Sair da Mesa"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>

                            {/* Your Turn Badge Example (Mocked for now) */}
                            {/* <div className="absolute -top-1 -right-1 size-3 bg-gold rounded-full border-2 border-surface animate-bounce"></div> */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
