import { useState, useEffect } from 'react';

/**
 * A hook that takes a target value and shifts the current value towards it smoothly.
 */
export const useSmoothedValue = (target: number, speed: number = 0.1, precision: number = 0) => {
    const [current, setCurrent] = useState(target);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent(prev => {
                const diff = target - prev;
                // If diff is small, just set to target
                if (Math.abs(diff) < 1) return target;

                // Move towards target by a percentage of the difference
                // or at least 1 unit to ensure movement
                const step = diff * speed;
                const naturalStep = Math.abs(step) < 1 ? (diff > 0 ? 1 : -1) : step;

                return prev + naturalStep;
            });
        }, 100); // 10 ticks per second for smooth visual

        return () => clearInterval(interval);
    }, [target, speed]);

    return Math.round(current);
};
