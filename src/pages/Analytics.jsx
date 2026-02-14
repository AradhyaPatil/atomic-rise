import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { getConsistencyScore, calculateStreak, generateInsights, detectHabitCorrelations, getMonthlyHeatmapData, getDayLabel } from "../utils/storage";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import CircularProgress from "../components/CircularProgress";
import "./Analytics.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export default function Analytics() {
    const { state, derived } = useApp();
    const { atomicScore, tier, avgConsistency, bestStreak, identityAlignment } = derived;
    const [heatmapMode, setHeatmapMode] = useState("habits"); // "habits" | "focus"

    // KPI computations
    const totalHabits = state.habits.length;
    const activeStreak = bestStreak;
    const longestStreak = useMemo(() => {
        let max = 0;
        state.habits.forEach((h) => {
            const s = calculateStreak(h.completions, state.graceDays);
            if (s > max) max = s;
        });
        return max;
    }, [state.habits]);

    const monthlyConsistency = useMemo(() => {
        if (state.habits.length === 0) return 0;
        const now = new Date();
        let totalDays = 0, completedDays = 0;
        state.habits.forEach((h) => {
            for (let i = 0; i < 30; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const ds = d.toISOString().slice(0, 10);
                totalDays++;
                if (h.completions?.[ds]) completedDays++;
            }
        });
        return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    }, [state.habits]);

    const focusThisMonth = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        return (state.focusSessions || []).filter((s) => s.date >= monthStart).length;
    }, [state.focusSessions]);

    // Heatmap data
    const heatmapData = useMemo(() => getMonthlyHeatmapData(state.habits, state.focusSessions), [state.habits, state.focusSessions]);

    // Insights and correlations
    const insights = useMemo(() => generateInsights(state), [state.habits, state.focusSessions, state.checkins]);
    const correlations = useMemo(() => detectHabitCorrelations(state.habits), [state.habits]);

    // Score trend (7-day)
    const scoreTrend = useMemo(() => {
        const now = new Date();
        return atomicScore > 50 ? "↑" : atomicScore > 25 ? "→" : "↓";
    }, [atomicScore]);

    const heatmapColors = ["var(--bg-card-alt)", "#27AE6030", "#27AE6060", "#27AE6090", "#27AE60"];

    return (
        <div className="page-enter analytics-page">
            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card card">
                    <span className="kpi-icon-sm">🎯</span>
                    <span className="kpi-value">{totalHabits}</span>
                    <span className="kpi-name">Habits</span>
                </div>
                <div className="kpi-card card">
                    <span className="kpi-icon-sm">🔥</span>
                    <span className="kpi-value">{activeStreak}</span>
                    <span className="kpi-name">Active Streak</span>
                </div>
                <div className="kpi-card card">
                    <span className="kpi-icon-sm">🏆</span>
                    <span className="kpi-value">{longestStreak}</span>
                    <span className="kpi-name">Best Streak</span>
                </div>
                <div className="kpi-card card">
                    <span className="kpi-icon-sm">📊</span>
                    <span className="kpi-value">{monthlyConsistency}%</span>
                    <span className="kpi-name">Monthly</span>
                </div>
                <div className="kpi-card card">
                    <span className="kpi-icon-sm">🧘</span>
                    <span className="kpi-value">{focusThisMonth}</span>
                    <span className="kpi-name">Focus</span>
                </div>
                <div className="kpi-card card">
                    <span className="kpi-icon-sm">🧬</span>
                    <span className="kpi-value">{identityAlignment}%</span>
                    <span className="kpi-name">Identity</span>
                </div>
                <div className="kpi-card card kpi-card-wide">
                    <span className="kpi-icon-sm">⚡</span>
                    <span className="kpi-value">{atomicScore} <span className="kpi-trend">{scoreTrend}</span></span>
                    <span className="kpi-name">Atomic Score</span>
                </div>
            </div>

            {/* GitHub-style Heatmap */}
            <div className="heatmap-section card">
                <div className="heatmap-header">
                    <h3 className="section-title">Monthly Activity</h3>
                    <div className="heatmap-tabs">
                        <button className={`heatmap-tab ${heatmapMode === "habits" ? "active" : ""}`} onClick={() => setHeatmapMode("habits")}>Habits</button>
                        <button className={`heatmap-tab ${heatmapMode === "focus" ? "active" : ""}`} onClick={() => setHeatmapMode("focus")}>Focus</button>
                    </div>
                </div>
                <div className="heatmap-grid">
                    {heatmapData.map((day) => {
                        const intensity = heatmapMode === "habits" ? day.intensity : day.focusIntensity;
                        return (
                            <div
                                key={day.date}
                                className="heatmap-cell"
                                style={{ background: heatmapColors[intensity] }}
                                title={`${day.date}: ${heatmapMode === "habits" ? `${day.completed}/${day.totalHabits} habits` : `${day.focusCount} sessions`}`}
                            />
                        );
                    })}
                </div>
                <div className="heatmap-legend">
                    <span className="heatmap-legend-label">Less</span>
                    {heatmapColors.map((c, i) => (
                        <div key={i} className="heatmap-legend-cell" style={{ background: c }} />
                    ))}
                    <span className="heatmap-legend-label">More</span>
                </div>
            </div>

            {/* Consistency chart */}
            {state.habits.length > 0 && (
                <div className="analytics-card card">
                    <h3 className="section-title">Habit Consistency</h3>
                    <div className="consistency-list">
                        {state.habits.map((habit) => {
                            const cons = Math.round(getConsistencyScore(habit));
                            return (
                                <div key={habit.id} className="consistency-item">
                                    <div className="cons-info">
                                        <span className="cons-name">{habit.name}</span>
                                        <span className="cons-cat">{habit.type === "good" ? "✅ Build" : "🚫 Break"}{habit.difficulty ? ` · ${habit.difficulty}` : ""}</span>
                                    </div>
                                    <div className="cons-bar-wrapper">
                                        <div className="cons-bar">
                                            <div className="cons-bar-fill" style={{ width: `${cons}%`, background: cons >= 70 ? "#27AE60" : cons >= 40 ? "#F1C40F" : "#E74C3C" }} />
                                        </div>
                                        <span className="cons-pct">{cons}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
                <div className="analytics-card card">
                    <h3 className="section-title">🧠 Insights</h3>
                    <div className="insights-list">
                        {insights.slice(0, 5).map((insight, i) => (
                            <div key={i} className="insight-item">
                                <span className="insight-emoji">{insight.type === "streak" ? "🔥" : insight.type === "warning" ? "⚠️" : "💡"}</span>
                                <div className="insight-body">
                                    <p>{insight.text}</p>
                                    {insight.confidence && (
                                        <div className="insight-conf-bar">
                                            <div className="insight-conf-fill" style={{ width: `${insight.confidence}%` }} />
                                            <span>{insight.confidence}% confidence</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Correlations */}
            {correlations.length > 0 && (
                <div className="analytics-card card" style={{ marginBottom: 24 }}>
                    <h3 className="section-title">🔗 Habit Correlations</h3>
                    <div className="insights-list">
                        {correlations.slice(0, 4).map((c, i) => (
                            <div key={i} className="insight-item">
                                <span className="insight-emoji">🔗</span>
                                <div className="insight-body">
                                    <p>{c.text}</p>
                                    {c.confidence && <span className="corr-conf">{c.confidence}% data confidence</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
