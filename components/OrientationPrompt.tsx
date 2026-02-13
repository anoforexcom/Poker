import React, { useState, useEffect } from 'react';

export const OrientationPrompt: React.FC = () => {
    const [isPortrait, setIsPortrait] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const portrait = window.innerHeight > window.innerWidth;
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;

            setIsPortrait(portrait);
            setIsMobile(mobile);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (!isMobile || !isPortrait) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0f1a] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="relative mb-8">
                <div className="w-24 h-44 border-4 border-slate-700 rounded-[2rem] relative animate-bounce-slow">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-700 rounded-full"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-slate-700 rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin-slow">screen_rotation</span>
                </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Roda o teu dispositivo</h2>
            <p className="text-slate-400 text-sm max-w-[250px] leading-relaxed">
                Para a melhor experiência de jogo, por favor utiliza o modo <span className="text-primary font-bold">Paisagem (Horizontal)</span>.
            </p>

            <div className="mt-8 flex gap-2">
                <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                <div className="size-2 bg-primary/60 rounded-full animate-pulse delay-75"></div>
                <div className="size-2 bg-primary/30 rounded-full animate-pulse delay-150"></div>
            </div>
        </div>
    );
};
