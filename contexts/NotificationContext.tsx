import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type NotificationType = 'info' | 'success' | 'error' | 'warning';

interface NotificationOptions {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

interface NotificationContextType {
    showAlert: (message: string, type?: NotificationType, options?: NotificationOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<{
        message: string;
        type: NotificationType;
        options?: NotificationOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    const showAlert = (message: string, type: NotificationType = 'info', options?: NotificationOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfig({ message, type, options, resolve });
            setIsOpen(true);
        });
    };

    const handleClose = (result: boolean) => {
        setIsOpen(false);
        if (config) {
            config.resolve(result);
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    const getColorClass = (type: NotificationType) => {
        switch (type) {
            case 'success': return 'text-poker-green';
            case 'error': return 'text-red-500';
            case 'warning': return 'text-gold';
            default: return 'text-primary';
        }
    };

    return (
        <NotificationContext.Provider value={{ showAlert }}>
            {children}
            <AnimatePresence>
                {isOpen && config && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !config.options?.showCancel && handleClose(true)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-surface border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
                        >
                            {/* Accent Glow */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[64px] opacity-20 ${config.type === 'success' ? 'bg-poker-green' : config.type === 'error' ? 'bg-red-500' : 'bg-primary'}`} />

                            <div className="flex flex-col items-center text-center gap-4">
                                <div className={`size-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center ${getColorClass(config.type)}`}>
                                    <span className="material-symbols-outlined text-4xl">
                                        {getIcon(config.type)}
                                    </span>
                                </div>

                                <div>
                                    {config.options?.title && (
                                        <h3 className="text-xl font-bold text-white mb-1 font-display tracking-tight">
                                            {config.options.title}
                                        </h3>
                                    )}
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {config.message}
                                    </p>
                                </div>

                                <div className="flex w-full gap-3 mt-2">
                                    {config.options?.showCancel && (
                                        <button
                                            onClick={() => handleClose(false)}
                                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5"
                                        >
                                            {config.options.cancelText || 'Cancel'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleClose(true)}
                                        className={`flex-1 px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg shadow-black/20 ${config.type === 'error' ? 'bg-red-600 hover:bg-red-500' :
                                                config.type === 'success' ? 'bg-poker-green hover:bg-green-500' :
                                                    'bg-primary hover:bg-blue-500'
                                            }`}
                                    >
                                        {config.options?.confirmText || 'OK'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
};
