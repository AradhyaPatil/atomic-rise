import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useTimer } from "../hooks/useTimer";
import { getFocusHeatmap, getDayLabel } from "../utils/storage";
import { Lock, Flame } from "lucide-react";
import "./FocusMode.css";

export default function FocusMode() {
    const { state, dispatch } = useApp();
    const navigate = useNavigate();
    const { timeLeft, isRunning, isComplete, start, pause, reset, formatTime } = useTimer(1500);

    const handleComplete = () => {
        dispatch({ type: "LOG_FOCUS_SESSION", payload: { duration: 25 } });
        reset();
    };

    if (!state.focusModeUnlocked) {
        return (
            <div className="page-enter focus-page">
                <div className="focus-locked card card-gold">
                    <div className="focus-locked-icon"><Lock size={48} /></div>
                    <h2>Focus Mode</h2>
                    <p>Unlock distraction-free deep work sessions to boost your productivity.</p>
                    <div className="focus-locked-cost">
                        <span className="coin-icon">🪙</span> 150 coins to unlock
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate("/rewards")}>
                        Go to Shop
                    </button>
                </div>
            </div>
        );
    }

    const totalSeconds = 1500;
    const percentage = ((totalSeconds - timeLeft) / totalSeconds) * 100;
    const heatmap = getFocusHeatmap(state.focusSessions || []);
    const heatmapEntries = Object.entries(heatmap);

    return (
        <div className="page-enter focus-page">
            <div className="focus-header">
                <h2>Focus Mode</h2>
                <p className="section-subtitle">Deep work, zero distractions</p>
            </div>

            {/* Focus Streak */}
            <div className="focus-streak-bar card">
                <Flame size={16} className="focus-streak-icon" />
                <span className="focus-streak-label">Focus Streak</span>
                <span className="focus-streak-count">🔥 {state.focusStreak || 0} days</span>
                <span className="focus-sessions-total">{(state.focusSessions || []).length} sessions total</span>
            </div>

            {/* Timer */}
            <div className={`focus-timer-container ${isRunning ? "focus-active" : ""}`}>
                <div className="focus-ring">
                    <svg viewBox="0 0 200 200" className="focus-svg">
                        <circle cx="100" cy="100" r="88" fill="none" stroke="var(--border-light)" strokeWidth="6" />
                        <circle
                            cx="100" cy="100" r="88"
                            fill="none"
                            stroke="var(--accent-gold)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)}
                            style={{ transition: "stroke-dashoffset 1s linear", transform: "rotate(-90deg)", transformOrigin: "center" }}
                        />
                    </svg>
                    <div className="focus-time">
                        {isComplete ? (
                            <div className="focus-complete">
                                <span className="focus-complete-icon">🎉</span>
                                <span>Session Complete!</span>
                                <span className="focus-coins-earned">+25 🪙</span>
                            </div>
                        ) : (
                            <>
                                <span className="focus-time-value">{formatTime(timeLeft)}</span>
                                <span className="focus-time-label">remaining</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="focus-controls">
                {isComplete ? (
                    <button className="btn btn-primary btn-full" onClick={handleComplete}>
                        Claim Coins & Reset 🪙
                    </button>
                ) : !isRunning ? (
                    <button className="btn btn-primary btn-full" onClick={start}>
                        {timeLeft < 1500 ? "Resume" : "Start Session"}
                    </button>
                ) : (
                    <button className="btn btn-secondary btn-full" onClick={pause}>
                        Pause
                    </button>
                )}
                {!isRunning && timeLeft < 1500 && !isComplete && (
                    <button className="btn btn-secondary btn-full" onClick={reset} style={{ marginTop: 10 }}>
                        Reset Timer
                    </button>
                )}
            </div>

            {isRunning && (
                <div className="focus-notice card">
                    <p>🔒 Habit editing is locked during focus sessions. Stay in the zone!</p>
                </div>
            )}

            {/* Weekly Heatmap */}
            {heatmapEntries.length > 0 && (
                <div className="focus-heatmap card">
                    <h3 className="section-title">Weekly Focus Heatmap</h3>
                    <div className="heatmap-grid">
                        {heatmapEntries.map(([date, minutes]) => {
                            const intensity = Math.min(1, minutes / 100);
                            return (
                                <div key={date} className="heatmap-cell">
                                    <div
                                        className="heatmap-block"
                                        style={{
                                            background: intensity > 0
                                                ? `rgba(200,169,81,${0.2 + intensity * 0.8})`
                                                : "var(--border-light)",
                                        }}
                                    />
                                    <span className="heatmap-day">{getDayLabel(date)}</span>
                                    <span className="heatmap-mins">{minutes}m</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
