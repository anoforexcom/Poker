import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useNavigate } from 'react-router-dom';

export const ActiveGamesSwitcher: React.FC = () => {
    const { activeGames } = useGame();
    const navigate = useNavigate();

    if (!activeGames || activeGames.length === 0) return null;

    return (
        <div className="flex gap-2 flex-wrap">
            {activeGames.map((id, i) => (
                <button
                    key={i}
                    onClick={() => navigate(`/table/${id}`)}
                    className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded text-xs hover:bg-blue-600/40 transition-all font-bold uppercase tracking-wider"
                >
                    Table {id.slice(0, 4)}
                </button>
            ))}
        </div>
    );
};
