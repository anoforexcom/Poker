import React from 'react';

const AdminFinances: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border-dark rounded-2xl h-80">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">payments</span>
            <h3 className="text-xl font-bold text-white mb-2">Financial Controls Coming Soon</h3>
            <p className="text-slate-500 text-center max-w-md">The financial audit and transaction management system is being individualised for the new backend. Withdrawal approvals and deposit logs will return shortly.</p>
        </div>
    );
};

export default AdminFinances;
