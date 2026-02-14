import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motivationalQuotes } from "../data/seedData";
import { projectAtomicScore, generateInsights, getWeekDates, getDayLabel, getConsistencyScore } from "../utils/storage";
import { Plus, TrendingUp, Zap, Crown, Wallet, Brain } from "lucide-react";
import CircularProgress from "../components/CircularProgress";
import HabitCard from "../components/HabitCard";
import "./Home.css";

export default function Home() {
    const { state, derived } = useApp();
    const navigate = useNavigate();
    const { atomicScore, tier, bestStreak, avgConsistency, identityAlignment } = derived;

    const projection = useMemo(() => projectAtomicScore(state), [state.habits]);
    const insightOfDay = useMemo(() => {
        const ins = generateInsights(state);
        return ins.length > 0 ? ins[0] : null;
    }, [state.habits]);

    const weekDates = getWeekDates();
    const today = new Date().toISOString().slice(0, 10);

    // Weekly completion strip data
    const weeklyStrip = useMemo(() => {
        return weekDates.map((date) => {
            const total = state.habits.length;
            if (total === 0) return { date, pct: 0 };
            const done = state.habits.filter((h) => h.completions?.[date]).length;
            return { date, pct: Math.round((done / total) * 100) };
        });
    }, [state.habits, weekDates]);

    // Vault balance
    const vaultBalance = state.vault?.totalBalance || 0;

    // System strength = avg consistency
    const systemStrength = avgConsistency;

    // Quote of the day
    const quoteObj = motivationalQuotes[Math.floor(Date.now() / 86400000) % motivationalQuotes.length];
    const quote = quoteObj?.text || "Small habits compound into remarkable results.";

    return (
        <div className="page-enter home-page">
            {/* Atomic Score Hero */}
            <div className="home-hero card card-gold">
                <div className="home-hero-top">
                    <CircularProgress percentage={atomicScore} size={90} strokeWidth={6} color={tier.color} label={`${atomicScore}`} sublabel="Score" />
                    <div className="home-hero-info">
                        <div className="hero-tier" style={{ color: tier.color }}>
                            {tier.icon} {tier.name}
                        </div>
                        <div className="hero-quote">"{quote}"</div>
                        {projection && (
                            <div className="hero-projection">
                                <TrendingUp size={13} />
                                <span>{projection.trend === "improving" ? "📈" : projection.trend === "declining" ? "📉" : "➡️"} {projection.projected} in 30d</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="home-kpis">
                <div className="home-kpi card" onClick={() => navigate("/analytics")}>
                    <span className="kpi-icon">📊</span>
                    <span className="kpi-val">{systemStrength}%</span>
                    <span className="kpi-label">System</span>
                </div>
                <div className="home-kpi card" onClick={() => navigate("/vault")}>
                    <span className="kpi-icon">💰</span>
                    <span className="kpi-val">₹{vaultBalance}</span>
                    <span className="kpi-label">Vault</span>
                </div>
                <div className="home-kpi card">
                    <span className="kpi-icon">🪙</span>
                    <span className="kpi-val">{state.coins}</span>
                    <span className="kpi-label">Coins</span>
                </div>
                <div className="home-kpi card">
                    <span className="kpi-icon">🔥</span>
                    <span className="kpi-val">{bestStreak}</span>
                    <span className="kpi-label">Streak</span>
                </div>
            </div>

            {/* Weekly Completion Strip */}
            <div className="home-week card">
                <div className="home-week-header">
                    <span className="section-title">📅 This Week</span>
                </div>
                <div className="home-week-strip">
                    {weeklyStrip.map((day) => {
                        const isToday = day.date === today;
                        const intensity = day.pct >= 100 ? "full" : day.pct >= 50 ? "half" : day.pct > 0 ? "low" : "none";
                        return (
                            <div key={day.date} className={`week-day ${isToday ? "week-day-today" : ""}`}>
                                <span className="week-day-label">{getDayLabel(day.date)}</span>
                                <div className={`week-day-dot week-dot-${intensity}`}>
                                    {day.pct >= 100 && "✓"}
                                </div>
                                <span className="week-day-pct">{day.pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Insight of the Day */}
            {insightOfDay && (
                <div className="home-insight card" onClick={() => navigate("/analytics")}>
                    <div className="insight-icon"><Brain size={16} /></div>
                    <div className="insight-content">
                        <span className="insight-label">🧠 Insight of the Day</span>
                        <p className="insight-text">{insightOfDay.text}</p>
                        {insightOfDay.confidence && (
                            <span className="insight-conf">{insightOfDay.confidence}% confidence</span>
                        )}
                    </div>
                </div>
            )}

            {/* Active Habits */}
            <div className="home-habits-section">
                <div className="home-habits-header">
                    <h3 className="section-title">🎯 Active Habits</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate("/add-habit")}>
                        <Plus size={16} /> Add
                    </button>
                </div>

                {state.habits.length === 0 ? (
                    <div className="empty-state card">
                        <div className="empty-state-icon">🌱</div>
                        <h3>Start Your Atomic Journey</h3>
                        <p>Add your first habit and begin building the identity you want.</p>
                        <button className="btn btn-primary" onClick={() => navigate("/add-habit")}>
                            <Plus size={18} /> Add First Habit
                        </button>
                    </div>
                ) : (
                    <div className="home-habits-grid">
                        {state.habits.map((habit) => (
                            <HabitCard key={habit.id} habit={habit} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
