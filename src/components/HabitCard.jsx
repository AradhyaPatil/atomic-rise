import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { calculateStreak, getWeekDates, getDayLabel, getWeeklyProgress, DIFFICULTY_COINS } from "../utils/storage";
import { Trash2, Zap, ChevronRight } from "lucide-react";
import "./HabitCard.css";

export default function HabitCard({ habit }) {
    const { dispatch, state } = useApp();
    const navigate = useNavigate();
    const weekDates = getWeekDates();
    const today = new Date().toISOString().slice(0, 10);
    const streak = calculateStreak(habit.completions, state.graceDays);
    const weeklyProgress = getWeeklyProgress(habit);
    const isCompletedToday = habit.completions?.[today];

    const diffCoins = habit.type === "good" ? (DIFFICULTY_COINS[habit.difficulty] || 10) : habit.negativeCost || 20;
    const streakGlow = streak >= 7;
    const skipReward = state.rewards?.find((r) => r.type === "skip");
    const hasSkips = skipReward && skipReward.owned > 0;

    const handleToggle = (date) => {
        dispatch({ type: "TOGGLE_COMPLETION", payload: { habitId: habit.id, date } });
    };

    const handleSkip = () => {
        dispatch({ type: "USE_SKIP", payload: { habitId: habit.id } });
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${habit.name}"?`)) {
            dispatch({ type: "DELETE_HABIT", payload: habit.id });
        }
    };

    const handleCardClick = () => {
        navigate(`/habit/${habit.id}/plan`);
    };

    return (
        <div className={`habit-card card ${streakGlow ? "habit-card-glow" : ""} ${habit.type === "bad" ? "habit-card-bad" : ""}`}>
            {/* Header — clickable to open plan view */}
            <div className="hc-header" onClick={handleCardClick} style={{ cursor: "pointer" }}>
                <div className="hc-header-left">
                    <h3 className="hc-name">{habit.name}</h3>
                    <div className="hc-badges">
                        <span className={`hc-type-badge ${habit.type}`}>{habit.type === "good" ? "✅ Good" : "🚫 Bad"}</span>
                        {habit.type === "good" && habit.difficulty && (
                            <span className={`hc-diff-badge hc-diff-${habit.difficulty}`}>{habit.difficulty}</span>
                        )}
                    </div>
                </div>
                <div className="hc-header-right">
                    {streak > 0 && (
                        <div className={`hc-streak ${streakGlow ? "hc-streak-fire" : ""}`}>
                            <span className="hc-streak-icon">🔥</span>
                            <span className="hc-streak-count">{streak}</span>
                        </div>
                    )}
                    <ChevronRight size={16} className="hc-plan-arrow" />
                    <button className="hc-delete-btn" onClick={handleDelete} title="Delete habit"><Trash2 size={14} /></button>
                </div>
            </div>

            {/* 7-day grid */}
            <div className="hc-week-grid">
                {weekDates.map((date) => {
                    const isCompleted = habit.completions?.[date];
                    const isToday = date === today;
                    const isPast = date < today;

                    return (
                        <div
                            key={date}
                            className={`hc-day ${isCompleted ? "hc-day-done" : ""} ${isToday ? "hc-day-today" : ""} ${isPast && !isCompleted ? "hc-day-missed" : ""}`}
                            onClick={() => (isToday || isPast) && handleToggle(date)}
                        >
                            <span className="hc-day-label">{getDayLabel(date)}</span>
                            <div className="hc-day-check">
                                {isCompleted ? (
                                    <svg className="hc-checkmark" viewBox="0 0 24 24" width="20" height="20">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
                                    </svg>
                                ) : (
                                    <div className="hc-day-empty" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            <div className="hc-progress-section">
                <div className="hc-progress-bar">
                    <div className="hc-progress-fill" style={{ width: `${weeklyProgress}%` }} />
                </div>
                <span className="hc-progress-text">{weeklyProgress}% this week</span>
            </div>

            {/* Footer */}
            <div className="hc-footer">
                <div className="hc-coin-info">
                    <span className="hc-coin-icon">🪙</span>
                    <span className="hc-coin-amount">
                        {habit.type === "good" ? `+${diffCoins}` : `-${diffCoins}`} / day
                    </span>
                </div>
                <div className="hc-actions">
                    {!isCompletedToday && hasSkips && habit.type === "good" && (
                        <button className="hc-skip-btn" onClick={handleSkip} title="Use skip day">
                            <Zap size={14} /> Skip
                        </button>
                    )}
                </div>
            </div>

            {/* Replacement hint for bad habits */}
            {habit.type === "bad" && habit.replacementHabit && (
                <div className="hc-replacement">
                    💡 Try instead: <strong>{habit.replacementHabit}</strong>
                </div>
            )}
        </div>
    );
}
