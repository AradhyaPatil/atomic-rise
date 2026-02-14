import { useState, useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "./Challenges.css";

function Confetti({ show }) {
    if (!show) return null;
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ["#C8A951", "#E74C3C", "#27AE60", "#3498DB", "#9B59B6", "#F1C40F"][i % 6],
        size: 6 + Math.random() * 6,
    }));
    return (
        <div className="confetti-container">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        background: p.color,
                        width: p.size,
                        height: p.size,
                    }}
                />
            ))}
        </div>
    );
}

export default function Challenges() {
    const { state, dispatch } = useApp();
    const [showConfetti, setShowConfetti] = useState(false);

    const activeChallenges = state.challenges.filter((c) => c.joined && !c.completed);
    const completedChallenges = state.challenges.filter((c) => c.completed);
    const availableChallenges = state.challenges.filter((c) => !c.joined && !c.completed);

    const handleIncrement = useCallback((id) => {
        const challenge = state.challenges.find((c) => c.id === id);
        if (challenge && challenge.progress + 1 >= challenge.duration) {
            // Will complete
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2500);
        }
        dispatch({ type: "INCREMENT_CHALLENGE", payload: id });
    }, [dispatch, state.challenges]);

    return (
        <div className="page-enter challenges-page">
            <Confetti show={showConfetti} />

            <h2>Challenges</h2>
            <p className="section-subtitle">Push your limits and earn bonus coins</p>

            {/* Active */}
            {activeChallenges.length > 0 && (
                <div className="challenge-section">
                    <h3 className="section-title">🔥 Active</h3>
                    {activeChallenges.map((c) => {
                        const pct = Math.round((c.progress / c.duration) * 100);
                        return (
                            <div key={c.id} className="challenge-card card card-gold">
                                <div className="cc-header">
                                    <span className="cc-icon">{c.icon}</span>
                                    <div className="cc-info">
                                        <span className="cc-name">{c.name}</span>
                                        <span className="cc-desc">{c.description}</span>
                                    </div>
                                </div>
                                <div className="cc-progress">
                                    <div className="cc-bar">
                                        <div className="cc-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="cc-progress-label">{c.progress}/{c.duration} days</span>
                                </div>
                                <div className="cc-footer">
                                    <span className="cc-reward">🪙 {c.reward} coins</span>
                                    <div className="cc-actions">
                                        <button className="btn btn-sm btn-primary" onClick={() => handleIncrement(c.id)}>
                                            +1 Day ✓
                                        </button>
                                        <button className="btn btn-sm btn-secondary" onClick={() => dispatch({ type: "LEAVE_CHALLENGE", payload: c.id })}>
                                            Leave
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Completed */}
            {completedChallenges.length > 0 && (
                <div className="challenge-section">
                    <h3 className="section-title">🏆 Completed</h3>
                    {completedChallenges.map((c) => (
                        <div key={c.id} className="challenge-card card challenge-done">
                            <div className="cc-header">
                                <span className="cc-icon">{c.icon}</span>
                                <div className="cc-info">
                                    <span className="cc-name">{c.name}</span>
                                    <span className="cc-desc">{c.description}</span>
                                </div>
                                <span className="cc-done-badge">✓ Done</span>
                            </div>
                            <span className="cc-reward-earned">🪙 {c.reward} earned</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Available */}
            {availableChallenges.length > 0 && (
                <div className="challenge-section">
                    <h3 className="section-title">🎯 Available</h3>
                    {availableChallenges.map((c) => (
                        <div key={c.id} className="challenge-card card">
                            <div className="cc-header">
                                <span className="cc-icon">{c.icon}</span>
                                <div className="cc-info">
                                    <span className="cc-name">{c.name}</span>
                                    <span className="cc-desc">{c.description}</span>
                                </div>
                            </div>
                            <div className="cc-footer">
                                <div className="cc-meta">
                                    <span className="cc-duration">{c.duration} days</span>
                                    <span className="cc-reward">🪙 {c.reward}</span>
                                </div>
                                <button className="btn btn-sm btn-primary" onClick={() => dispatch({ type: "JOIN_CHALLENGE", payload: c.id })}>
                                    Join Challenge →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {state.challenges.length === 0 && (
                <div className="empty-state card">
                    <p>No challenges available yet.</p>
                </div>
            )}
        </div>
    );
}
