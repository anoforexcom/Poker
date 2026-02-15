import React, { useState, useEffect } from 'react';

const DebugOverlay: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        // Intercept console.log
        const originalLog = console.log;
        const originalError = console.error;

        const addLog = (type: 'LOG' | 'ERR', args: any[]) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            if (message.includes('[LIVEWORLD]') || message.includes('supabase')) {
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${type}: ${message}`, ...prev].slice(0, 20));
            }
        };

        console.log = (...args) => {
            originalLog(...args);
            addLog('LOG', args);
        };

        console.error = (...args) => {
            originalError(...args);
            addLog('ERR', args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
        };
    }, []);

    if (!isOpen) return (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full z-[9999] shadow-xl"
        >
            🐞
        </button>
    );

    return (
        <div className="fixed top-0 left-0 w-full h-1/3 bg-black/90 text-green-400 font-mono text-[10px] p-4 z-[9999] overflow-y-auto border-b-2 border-green-500 opacity-90 pointer-events-none">
            <div className="flex justify-between items-center mb-2 pointer-events-auto">
                <h3 className="font-bold uppercase">System Debugger (Live)</h3>
                <div className="flex gap-2">
                    <button onClick={() => setLogs([])} className="bg-slate-700 px-2 rounded">Clear</button>
                    <button onClick={() => setIsOpen(false)} className="bg-red-500 text-white px-2 rounded">Close</button>
                </div>
            </div>
            <div className="space-y-1">
                {logs.length === 0 && <span className="opacity-50">Waiting for logs...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="border-b border-white/10 pb-0.5">
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DebugOverlay;
