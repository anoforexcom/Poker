import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show prompt automatically only on mobile after a delay
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                setTimeout(() => setIsVisible(true), 15000);
            }
        };

        const manualHandler = () => {
            console.log('[PWA] Manual trigger received');
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('trigger-pwa-install', manualHandler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('trigger-pwa-install', manualHandler);
        };
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: 100, scale: 0.9 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 100, scale: 0.9 }}
                        className="w-full max-w-sm bg-slate-900 border border-primary/30 p-5 rounded-2xl shadow-2xl"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                                    <span className="material-symbols-outlined text-primary text-3xl">install_mobile</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-lg uppercase tracking-tight">BestPoker App</h4>
                                    <p className="text-slate-400 text-xs">Instale para ter a melhor experiência mobile.</p>
                                </div>
                            </div>

                            {!deferredPrompt && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-sm">info</span>
                                    <p className="text-[10px] text-amber-200/70 leading-relaxed italic">
                                        Se o botão não funcionar, usa 'Adicionar ao Ecrã Principal' no menu do teu browser.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                                >
                                    AGORA NÃO
                                </button>
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 bg-primary text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 hover:bg-blue-600 transition-all"
                                >
                                    INSTALAR
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
