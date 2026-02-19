import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ActiveGamesSwitcher: React.FC = () => {
    const { activeGames, removeActiveGame } = useGame();
    const { tables } = useLiveWorld();
    const navigate = useNavigate();

    if (!activeGames || activeGames.length === 0) return null;

    return (
        <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mr-1">Active Tables:</span>
            <AnimatePresence>
                {activeGames.map((id) => {
                    const table = tables.find(t => t.id === id);
                    const name = table ? table.name : `Table ${id.slice(0, 4)}`;

                    return (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, width: 0 }}
                            className="group flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 hover:border-blue-500/50 transition-all cursor-pointer"
                        >
                            <button
                                onClick={() => navigate(`/table/${id}`)}
                                className="text-[10px] font-bold text-zinc-300 group-hover:text-blue-400 transition-colors truncate max-w-[120px]"
                            >
                                {name}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeActiveGame(id);
                                }}
                                className="p-0.5 hover:bg-zinc-800 rounded text-zinc-600 hover:text-red-400 transition-all"
                            >
                                <X size={10} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

