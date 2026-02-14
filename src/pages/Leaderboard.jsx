import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calculateAtomicScore, getAtomicTier, getWeeklyLeaderboardData } from "../utils/storage";
import "./Leaderboard.css";

export default function Leaderboard() {
    const { state, derived } = useApp();
    const [view, setView] = useState("all-time"); // "all-time" | "weekly"

    // User's data
    const { atomicScore: userScore, tier: userTier } = derived;
    const weeklyData = useMemo(() => getWeeklyLeaderboardData(state), [state.habits, state.focusSessions]);

    // Build combined list
    const userEntry = {
        username: state.username || "You",
        coins: state.coins,
        atomicScore: userScore,
        badges: state.rewards.filter((r) => r.type === "badge" && r.owned > 0).map((r) => r.icon),
        avatar: (state.username || "You").slice(0, 2).toUpperCase(),
        tier: userTier.name,
        isUser: true,
        weeklyScore: weeklyData.weeklyConsistency,
    };

    const allEntries = [...state.leaderboard.map((e) => ({
        ...e,
        weeklyScore: Math.floor(Math.random() * 60 + 40), // simulated weekly for bots
    })), userEntry];

    const sorted = view === "weekly"
        ? [...allEntries].sort((a, b) => b.weeklyScore - a.weeklyScore)
        : [...allEntries].sort((a, b) => b.atomicScore - a.atomicScore);

    const ranked = sorted.map((entry, i) => ({ ...entry, rank: i + 1 }));
    const top3 = ranked.slice(0, 3);
    const rest = ranked.slice(3);
    const podiumOrder = [top3[1], top3[0], top3[2]];

    function getTierBadge(tierName) {
        const tiers = {
            "Atomic Elite": { icon: "💎", color: "#9B59B6" },
            "Gold": { icon: "🥇", color: "#C8A951" },
            "Silver": { icon: "🥈", color: "#A0A0A0" },
            "Bronze": { icon: "🥉", color: "#CD7F32" },
            "Beginner": { icon: "🌱", color: "#27AE60" },
        };
        return tiers[tierName] || tiers["Beginner"];
    }

    return (
        <div className="page-enter leaderboard-page">
            <h2>Leaderboard</h2>
            <p className="section-subtitle">Ranked by {view === "weekly" ? "Weekly Consistency" : "Atomic Score"}</p>

            {/* View switcher */}
            <div className="lb-switcher">
                <button className={`lb-tab ${view === "all-time" ? "lb-tab-active" : ""}`} onClick={() => setView("all-time")}>
                    🏆 All-Time
                </button>
                <button className={`lb-tab ${view === "weekly" ? "lb-tab-active" : ""}`} onClick={() => setView("weekly")}>
                    📅 This Week
                </button>
            </div>

            {/* Weekly special badges */}
            {view === "weekly" && weeklyData.badges.length > 0 && (
                <div className="weekly-badges card card-gold">
                    <span className="wb-title">Your Weekly Badges</span>
                    <div className="wb-list">
                        {weeklyData.badges.map((b, i) => (
                            <span key={i} className="wb-badge">{b.icon} {b.name}</span>
                        ))}
                    </div>
                    {weeklyData.improvement > 0 && (
                        <span className="wb-improvement">📈 +{weeklyData.improvement}% improvement over last week!</span>
                    )}
                </div>
            )}

            {/* Podium */}
            <div className="podium">
                {podiumOrder.map((entry, i) => {
                    if (!entry) return null;
                    const tier = getTierBadge(entry.tier);
                    const podiumPos = [2, 1, 3][i];
                    const score = view === "weekly" ? `${entry.weeklyScore}%` : entry.atomicScore;
                    return (
                        <div key={entry.username} className={`podium-entry podium-${podiumPos} ${entry.isUser ? "podium-user" : ""}`}>
                            <div className="podium-avatar" style={{ borderColor: tier.color }}>
                                {entry.avatar}
                            </div>
                            <div className="podium-medal">
                                {podiumPos === 1 ? "🥇" : podiumPos === 2 ? "🥈" : "🥉"}
                            </div>
                            <span className="podium-name">{entry.username}</span>
                            <span className="podium-score">{score}</span>
                            <span className="podium-tier" style={{ color: tier.color }}>
                                {tier.icon} {entry.tier}
                            </span>
                            <div className="podium-bar" style={{ height: podiumPos === 1 ? 100 : podiumPos === 2 ? 72 : 50, background: `linear-gradient(to top, ${tier.color}22, ${tier.color}66)` }} />
                        </div>
                    );
                })}
            </div>

            {/* Rankings list */}
            <div className="rankings-list">
                {rest.map((entry) => {
                    const tier = getTierBadge(entry.tier);
                    const score = view === "weekly" ? `${entry.weeklyScore}%` : entry.atomicScore;
                    return (
                        <div key={entry.username} className={`rank-row card ${entry.isUser ? "rank-user" : ""}`}>
                            <span className="rank-number">#{entry.rank}</span>
                            <div className="rank-avatar" style={{ borderColor: tier.color }}>
                                {entry.avatar}
                            </div>
                            <div className="rank-info">
                                <span className="rank-name">{entry.username}</span>
                                <span className="rank-tier" style={{ color: tier.color }}>
                                    {tier.icon} {entry.tier}
                                </span>
                            </div>
                            <div className="rank-stats">
                                <span className="rank-score">{score}</span>
                                <span className="rank-score-label">{view === "weekly" ? "weekly" : "score"}</span>
                            </div>
                            {entry.badges && entry.badges.length > 0 && (
                                <div className="rank-badges">
                                    {entry.badges.map((b, i) => <span key={i}>{b}</span>)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tier Legend */}
            <div className="tier-legend card">
                <h3 className="section-title">Tier System</h3>
                <div className="tier-grid">
                    {[
                        { name: "Beginner", icon: "🌱", range: "0-199", color: "#27AE60" },
                        { name: "Bronze", icon: "🥉", range: "200-399", color: "#CD7F32" },
                        { name: "Silver", icon: "🥈", range: "400-599", color: "#A0A0A0" },
                        { name: "Gold", icon: "🥇", range: "600-799", color: "#C8A951" },
                        { name: "Atomic Elite", icon: "💎", range: "800+", color: "#9B59B6" },
                    ].map((t) => (
                        <div key={t.name} className="tier-item">
                            <span className="tier-item-icon">{t.icon}</span>
                            <span className="tier-item-name" style={{ color: t.color }}>{t.name}</span>
                            <span className="tier-item-range">{t.range}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
