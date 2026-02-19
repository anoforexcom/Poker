import React from 'react';

const AdminGames: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border-dark rounded-2xl h-80">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">construction</span>
            <h3 className="text-xl font-bold text-white mb-2">Game Controls Coming Soon</h3>
            <p className="text-slate-500 text-center max-w-md">The game management dashboard is currently being migrated to the new Poker Engine. Tournament and Cash Game management will be available shortly.</p>
        </div>
    );
};

export default AdminGames;
