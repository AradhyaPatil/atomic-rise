import { useApp } from "../context/AppContext";
import { difficultyOptions } from "../data/seedData";
import { ShoppingBag, Sparkles } from "lucide-react";
import "./Rewards.css";

export default function Rewards() {
    const { state, dispatch } = useApp();

    const handleRedeem = (rewardId) => {
        dispatch({ type: "REDEEM_REWARD", payload: rewardId });
    };

    // Group rewards by type
    const powerUps = state.rewards.filter((r) => ["skip", "double", "boost", "focus", "insights"].includes(r.type));
    const badges = state.rewards.filter((r) => r.type === "badge");

    const boostActive = state.boostActive && state.boostExpiry && new Date() <= new Date(state.boostExpiry);
    const doubleActive = state.doubleRewardToday === new Date().toISOString().slice(0, 10);

    return (
        <div className="page-enter rewards-page">
            <div className="rewards-header">
                <h2>Coin Shop</h2>
                <div className="rewards-balance">
                    <span className="coin-big">🪙</span>
                    <span className="coin-count">{state.coins}</span>
                </div>
            </div>

            {/* Active boosts */}
            {(boostActive || doubleActive) && (
                <div className="active-boosts card card-gold">
                    <Sparkles size={16} />
                    <span>{boostActive && doubleActive ? "4x" : "2x"} Coin Multiplier Active!</span>
                </div>
            )}

            {/* How to earn */}
            <div className="earn-rules card">
                <h3 className="section-title">
                    <ShoppingBag size={16} /> How to Earn
                </h3>
                <div className="earn-grid">
                    {difficultyOptions.map((d) => (
                        <div key={d.value} className="earn-item">
                            <span className="earn-icon" style={{ color: d.color }}>●</span>
                            <span className="earn-text">{d.label} habit</span>
                            <span className="earn-coins">+{d.coins} 🪙</span>
                        </div>
                    ))}
                    <div className="earn-item">
                        <span className="earn-icon">🔥</span>
                        <span className="earn-text">7-day streak</span>
                        <span className="earn-coins">+50 🪙</span>
                    </div>
                    <div className="earn-item">
                        <span className="earn-icon">📝</span>
                        <span className="earn-text">Daily check-in</span>
                        <span className="earn-coins">+5 🪙</span>
                    </div>
                    <div className="earn-item">
                        <span className="earn-icon">🎯</span>
                        <span className="earn-text">Focus session</span>
                        <span className="earn-coins">+25 🪙</span>
                    </div>
                    <div className="earn-item">
                        <span className="earn-icon">🏆</span>
                        <span className="earn-text">Challenge</span>
                        <span className="earn-coins">+150-500 🪙</span>
                    </div>
                </div>
            </div>

            {/* Power-ups */}
            <div className="reward-section">
                <h3 className="section-title">⚡ Power-Ups</h3>
                <div className="reward-grid">
                    {powerUps.map((r) => {
                        const canBuy = state.coins >= r.cost;
                        const isFocusOwned = r.type === "focus" && state.focusModeUnlocked;
                        const isInsightsOwned = r.type === "insights" && state.insightsUnlocked;
                        const isOneTime = isFocusOwned || isInsightsOwned;

                        return (
                            <div key={r.id} className={`reward-card card ${isOneTime ? "reward-owned" : ""}`}>
                                <span className="reward-icon">{r.icon}</span>
                                <div className="reward-info">
                                    <span className="reward-name">{r.name}</span>
                                    <span className="reward-desc">{r.description}</span>
                                </div>
                                <div className="reward-actions">
                                    <span className="reward-cost">🪙 {r.cost}</span>
                                    {isOneTime ? (
                                        <span className="reward-owned-badge">✓ Owned</span>
                                    ) : (
                                        <button
                                            className="btn btn-sm btn-primary"
                                            disabled={!canBuy}
                                            onClick={() => handleRedeem(r.id)}
                                        >
                                            {canBuy ? "Buy" : "Need more"}
                                        </button>
                                    )}
                                    {r.owned > 0 && !isOneTime && (
                                        <span className="reward-qty">×{r.owned}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Badges */}
            <div className="reward-section">
                <h3 className="section-title">🏅 Badges</h3>
                <div className="badge-grid">
                    {badges.map((r) => {
                        const canBuy = state.coins >= r.cost;
                        const owned = r.owned > 0;

                        return (
                            <div key={r.id} className={`badge-card card ${owned ? "badge-unlocked" : ""}`}>
                                <span className="badge-big-icon">{r.icon}</span>
                                <span className="badge-card-name">{r.name}</span>
                                <span className="badge-card-desc">{r.description}</span>
                                {owned ? (
                                    <span className="badge-owned-label">✓ Unlocked</span>
                                ) : (
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        disabled={!canBuy}
                                        onClick={() => handleRedeem(r.id)}
                                    >
                                        🪙 {r.cost}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
