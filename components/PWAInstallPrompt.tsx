import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show prompt only if not already installed and on mobile
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                setTimeout(() => setIsVisible(true), 5000); // Wait 5s before showing
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 left-4 right-4 z-[9999] md:hidden"
                >
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-2xl">install_mobile</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Install App</h4>
                                <p className="text-slate-400 text-[10px] leading-tight">Get the full-screen experience and better performance.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsVisible(false)}
                                className="px-3 py-2 text-slate-400 text-xs font-bold"
                            >
                                Later
                            </button>
                            <button
                                onClick={handleInstall}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                Install
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
