import React, { useEffect, useState } from 'react';

interface TournamentClockProps {
    startTime?: string;
    lateRegUntil?: string;
    status: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const TournamentClock: React.FC<TournamentClockProps> = ({
    startTime,
    lateRegUntil,
    status,
    size = 'md',
    className = ''
}) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [isUrgent, setIsUrgent] = useState(false);

    // Dimensions based on size prop
    const dimensions = {
        sm: { size: 32, stroke: 3, fontSize: 'text-[9px]' },
        md: { size: 48, stroke: 4, fontSize: 'text-[10px]' },
        lg: { size: 64, stroke: 5, fontSize: 'text-xs' }
    };

    const { size: clockSize, stroke, fontSize } = dimensions[size];
    const radius = (clockSize - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    // Colors based on state
    const getColors = () => {
        const s = status?.toLowerCase();
        if (s === 'running') return { stroke: 'text-blue-500', bg: 'text-blue-900/30' };
        if (s === 'late_reg') return { stroke: 'text-yellow-500', bg: 'text-yellow-900/30' };
        if (isUrgent) return { stroke: 'text-red-500', bg: 'text-red-900/30' };
        return { stroke: 'text-emerald-500', bg: 'text-emerald-900/30' };
    };

    const colors = getColors();

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            let targetTime = 0;
            let totalDuration = 0; // For progress calculation

            // Determine target based on status
            if (status?.toLowerCase() === 'running') {
                setTimeLeft('LIVE');
                setProgress(100);
                return;
            }

            if (status?.toLowerCase() === 'late_reg' && lateRegUntil) {
                targetTime = new Date(lateRegUntil).getTime();
                // Assume late reg is typically 30-60 mins, just show simple countdown
            } else if (startTime) {
                targetTime = new Date(startTime).getTime();
                // Cap progress visual at 1 hour for "Registering"
                totalDuration = 60 * 60 * 1000;
            }

            if (targetTime > 0) {
                const distance = targetTime - now;

                if (distance < 0) {
                    setTimeLeft(status === 'late_reg' ? 'CLOSED' : 'STARTING');
                    setProgress(100);
                    setIsUrgent(true);
                } else {
                    // Format time
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
                    else if (minutes > 0) setTimeLeft(`${minutes}m ${seconds}s`);
                    else setTimeLeft(`${seconds}s`);

                    // Calculate Progress (inverse for countdown: 100% -> 0%)
                    // If > 1 hour, show full circle (0 progress visually if we want it to fill up as it gets closer? 
                    // Let's make it typical clock style: empty means far away, full means now.)

                    let p = 0;
                    if (distance > totalDuration) p = 0;
                    else {
                        p = ((totalDuration - distance) / totalDuration) * 100;
                    }

                    setProgress(p);

                    // Urgent if < 5 mins
                    setIsUrgent(distance < 5 * 60 * 1000);
                }
            } else {
                setTimeLeft('--');
                setProgress(0);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, lateRegUntil, status]);

    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: clockSize, height: clockSize }}>
            {/* Background Circle */}
            <svg className={`transform -rotate-90 w-full h-full`} viewBox={`0 0 ${clockSize} ${clockSize}`}>
                <circle
                    className={colors.bg}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={radius}
                    cx={clockSize / 2}
                    cy={clockSize / 2}
                />
                {/* Progress Circle */}
                <circle
                    className={`${colors.stroke} transition-all duration-1000 ease-linear ${status === 'running' ? 'animate-pulse' : ''}`}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={clockSize / 2}
                    cy={clockSize / 2}
                    style={{ strokeDasharray: circumference, strokeDashoffset }}
                />
            </svg>

            {/* Text in Center */}
            <div className={`absolute inset-0 flex items-center justify-center ${fontSize} font-black ${colors.stroke} tabular-nums`}>
                {/* If running, maybe an icon? or just text */}
                {status?.toLowerCase() === 'running' ? (
                    <span className="material-symbols-outlined text-base animate-pulse">play_arrow</span>
                ) : (
                    <span className="leading-none text-center transform scale-90">{timeLeft}</span>
                )}
            </div>
        </div>
    );
};

export default TournamentClock;
