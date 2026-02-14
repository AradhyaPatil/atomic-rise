import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Timer, BookOpen, Award, ClipboardCheck, ShoppingBag, TrendingUp, Sparkles } from "lucide-react";
import "./Profile.css";

export default function Profile() {
    const { state, derived } = useApp();
    const navigate = useNavigate();

    const { atomicScore, tier, bestStreak } = derived;
    const totalHabits = state.habits.length;
    const totalCompletions = state.habits.reduce((sum, h) => sum + Object.keys(h.completions || {}).length, 0);
    const ownedBadges = state.rewards.filter((r) => r.type === "badge" && r.owned > 0);
    const checkinCount = state.checkins.length;

    const menuItems = [
        { label: "AI Habit Planner", icon: Sparkles, path: "/ai-planner", desc: "Generate smart plans" },
        { label: "Focus Mode", icon: Timer, path: "/focus", desc: state.focusModeUnlocked ? `${(state.focusSessions || []).length} sessions` : "Locked 🔒" },
        { label: "Daily Check-In", icon: ClipboardCheck, path: "/checkin", desc: `${checkinCount} check-ins` },
        { label: "Analytics", icon: TrendingUp, path: "/analytics", desc: "Insights & trends" },
        { label: "Leaderboard", icon: Award, path: "/leaderboard", desc: "See rankings" },
        { label: "Coin Shop", icon: ShoppingBag, path: "/rewards", desc: `${state.coins} coins` },
    ];

    return (
        <div className="page-enter profile-page">
            {/* Profile header */}
            <div className="profile-hero card card-gold">
                <div className="profile-avatar">
                    {(state.username || "You").slice(0, 2).toUpperCase()}
                </div>
                <h2 className="profile-name">{state.username || "Atomic Riser"}</h2>
                <div className="profile-tier" style={{ color: tier.color }}>
                    {tier.icon} {tier.name}
                </div>
                <p className="profile-tagline">Tiny changes. Remarkable results.</p>

                <div className="profile-stats">
                    <div className="pstat">
                        <span className="pstat-value">{atomicScore}</span>
                        <span className="pstat-label">Score</span>
                    </div>
                    <div className="pstat-divider" />
                    <div className="pstat">
                        <span className="pstat-value">{totalHabits}</span>
                        <span className="pstat-label">Habits</span>
                    </div>
                    <div className="pstat-divider" />
                    <div className="pstat">
                        <span className="pstat-value">{totalCompletions}</span>
                        <span className="pstat-label">Checks</span>
                    </div>
                    <div className="pstat-divider" />
                    <div className="pstat">
                        <span className="pstat-value">🔥 {bestStreak}</span>
                        <span className="pstat-label">Streak</span>
                    </div>
                </div>
            </div>

            {/* Badges */}
            {ownedBadges.length > 0 && (
                <div className="profile-badges card">
                    <h3 className="section-title">Your Badges</h3>
                    <div className="badges-row">
                        {ownedBadges.map((b) => (
                            <div key={b.id} className="badge-item">
                                <span className="badge-emoji">{b.icon}</span>
                                <span className="badge-name">{b.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Menu */}
            <div className="profile-menu">
                {menuItems.map((item) => (
                    <button key={item.path} className="profile-menu-item card" onClick={() => navigate(item.path)}>
                        <div className="pmi-icon"><item.icon size={20} /></div>
                        <div className="pmi-info">
                            <span className="pmi-label">{item.label}</span>
                            <span className="pmi-desc">{item.desc}</span>
                        </div>
                        <span className="pmi-arrow">→</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
