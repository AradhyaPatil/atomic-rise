import { useState, useRef, useCallback, useEffect } from "react";

export function useTimer(durationSeconds = 1500) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const intervalRef = useRef(null);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        if (isComplete) return;
        clearTimer();
        setIsRunning(true);
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    setIsRunning(false);
                    setIsComplete(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearTimer, isComplete]);

    const pause = useCallback(() => {
        clearTimer();
        setIsRunning(false);
    }, [clearTimer]);

    const reset = useCallback(() => {
        clearTimer();
        setTimeLeft(durationSeconds);
        setIsRunning(false);
        setIsComplete(false);
    }, [clearTimer, durationSeconds]);

    useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }, []);

    return { timeLeft, isRunning, isComplete, start, pause, reset, formatTime };
}
