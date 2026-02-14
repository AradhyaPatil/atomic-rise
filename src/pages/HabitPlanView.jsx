import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { calculateStreak, getConsistencyScore, getWeeklyProgress } from "../utils/storage";
import { generateHabitDetailPlan } from "../services/geminiAI";
import { ArrowLeft, Target, Brain, Shield, Layers, Gift, TrendingUp, AlertTriangle, Zap, ChevronDown, ChevronUp } from "lucide-react";
import "./HabitPlanView.css";

export default function HabitPlanView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, derived } = useApp();
    const [expandedPhase, setExpandedPhase] = useState(null);

    const habit = state.habits.find((h) => h.id === id);

    // Get or generate plan
    const plan = useMemo(() => {
        if (!habit) return null;
        const plans = JSON.parse(localStorage.getItem("atomic-rise-plans") || "[]");
        const saved = plans.find((p) => p.plan.goal.title.toLowerCase() === habit.name.toLowerCase());
        if (saved) return saved.plan;
        return generateHabitDetailPlan(habit, state);
    }, [habit, state]);

    if (!habit || !plan) {
        return (
            <div className="page-enter hpv-page">
                <button className="hpv-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="hpv-empty"><p>Habit not found.</p></div>
            </div>
        );
    }

    const streak = calculateStreak(habit.completions, state.graceDays);
    const consistency = Math.round(getConsistencyScore(habit));
    const weeklyProg = getWeeklyProgress(habit);
    const totalCompletions = Object.keys(habit.completions || {}).length;

    // Determine current phase based on completions
    const currentPhase = totalCompletions < 7 ? 1 : totalCompletions < 21 ? 2 : totalCompletions < 45 ? 3 : 4;
    const phaseProgress = currentPhase === 1 ? Math.min(100, (totalCompletions / 7) * 100)
        : currentPhase === 2 ? Math.min(100, ((totalCompletions - 7) / 14) * 100)
            : currentPhase === 3 ? Math.min(100, ((totalCompletions - 21) / 24) * 100)
                : Math.min(100, ((totalCompletions - 45) / 30) * 100);

    const phaseIcons = ["🌱", "📚", "💪", "🏆"];
    const phaseColors = ["#27AE60", "#3498DB", "#E67E22", "#9B59B6"];

    const togglePhase = (i) => setExpandedPhase(expandedPhase === i ? null : i);

    return (
        <div className="page-enter hpv-page">
            <button className="hpv-back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back
            </button>

            {/* Hero */}
            <div className="hpv-hero card card-gold">
                <h2 className="hpv-title">{habit.name}</h2>
                <div className="hpv-hero-meta">
                    <span className="hpv-tag">{habit.type === "good" ? "🔨 Build" : "🛑 Break"}</span>
                    <span className="hpv-tag hpv-tag-conf" style={{
                        background: plan.goal.confidence_level === "High" ? "#27AE6022" : "#F1C40F22",
                        color: plan.goal.confidence_level === "High" ? "#27AE60" : "#F1C40F",
                    }}>
                        {plan.goal.confidence_level} Confidence
                    </span>
                    <span className="hpv-tag" style={{ background: "#27AE6022", color: "#27AE60" }}>
                        {plan.goal.estimated_success_probability} success
                    </span>
                </div>

                {/* Current Phase indicator */}
                <div className="hpv-current-phase">
                    <span className="hpv-phase-badge" style={{ background: phaseColors[currentPhase - 1] }}>
                        {phaseIcons[currentPhase - 1]} Phase {currentPhase}: {plan.phases[currentPhase - 1]?.name}
                    </span>
                </div>

                {/* Phase progress bar */}
                <div className="hpv-phase-progress">
                    <div className="hpv-phase-fill" style={{ width: `${phaseProgress}%`, background: phaseColors[currentPhase - 1] }} />
                </div>
                <span className="hpv-phase-pct">{Math.round(phaseProgress)}% through this phase</span>
            </div>

            {/* Stats row */}
            <div className="hpv-stats">
                <div className="hpv-stat card">
                    <span className="hpv-stat-val">🔥 {streak}</span>
                    <span className="hpv-stat-label">Streak</span>
                </div>
                <div className="hpv-stat card">
                    <span className="hpv-stat-val">{consistency}%</span>
                    <span className="hpv-stat-label">Consistency</span>
                </div>
                <div className="hpv-stat card">
                    <span className="hpv-stat-val">{totalCompletions}</span>
                    <span className="hpv-stat-label">Total</span>
                </div>
                <div className="hpv-stat card">
                    <span className="hpv-stat-val">{weeklyProg}%</span>
                    <span className="hpv-stat-label">This Week</span>
                </div>
            </div>

            {/* Psychological rationale */}
            {plan.goal.psychological_rationale && (
                <div className="hpv-rationale card">
                    <div className="hpv-rationale-header">
                        <Brain size={16} />
                        <strong>Why This Works</strong>
                    </div>
                    <p>{plan.goal.psychological_rationale}</p>
                </div>
            )}

            {/* Phase ladder */}
            <h3 className="section-title" style={{ marginTop: 16 }}>Progression Ladder</h3>
            <div className="hpv-ladder">
                {plan.phases.map((phase, i) => {
                    const isActive = currentPhase === phase.phase;
                    const isComplete = currentPhase > phase.phase;
                    const isExpanded = expandedPhase === i;

                    return (
                        <div key={phase.phase} className={`hpv-phase card ${isActive ? "hpv-phase-active" : ""} ${isComplete ? "hpv-phase-done" : ""}`}
                            style={{ borderLeft: `4px solid ${phaseColors[i]}` }}>

                            {/* Phase header — clickable */}
                            <div className="hpv-phase-header" onClick={() => togglePhase(i)}>
                                <div className="hpv-phase-left">
                                    <span className="hpv-phase-icon">
                                        {isComplete ? "✅" : phaseIcons[i]}
                                    </span>
                                    <div>
                                        <strong className="hpv-phase-name">Phase {phase.phase}: {phase.name}</strong>
                                        <span className="hpv-phase-dur">{phase.min_duration_days}-{phase.max_duration_days} days · {phase.estimated_time_minutes} min/day</span>
                                    </div>
                                </div>
                                <div className="hpv-phase-right">
                                    {isActive && <span className="hpv-active-badge">CURRENT</span>}
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>

                            {/* Target always visible */}
                            <div className="hpv-phase-target">
                                <Target size={14} />
                                <span>{phase.daily_target}</span>
                            </div>

                            {/* Expanded detail */}
                            {isExpanded && (
                                <div className="hpv-phase-detail">
                                    {phase.why_this_level && (
                                        <div className="hpv-detail-row">
                                            <Brain size={13} />
                                            <div><strong>Why this level</strong><p>{phase.why_this_level}</p></div>
                                        </div>
                                    )}
                                    {phase.common_resistance && (
                                        <div className="hpv-detail-row hpv-detail-warn">
                                            <Shield size={13} />
                                            <div><strong>Expected resistance</strong><p>{phase.common_resistance}</p></div>
                                        </div>
                                    )}
                                    {phase.environment_design && (
                                        <div className="hpv-detail-row hpv-detail-env">
                                            <Layers size={13} />
                                            <div><strong>Environment design</strong><p>{phase.environment_design}</p></div>
                                        </div>
                                    )}
                                    <div className="hpv-detail-row">
                                        <TrendingUp size={13} />
                                        <div><strong>Progression rule</strong><p>{phase.progression_rule}</p></div>
                                    </div>
                                    <div className="hpv-detail-row">
                                        <Target size={13} />
                                        <div><strong>Success criteria</strong><p>{phase.success_criteria}</p></div>
                                    </div>
                                    {phase.milestone_reward && (
                                        <div className="hpv-detail-row hpv-detail-reward">
                                            <Gift size={13} />
                                            <div><strong>Milestone reward</strong><p>{phase.milestone_reward}</p></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Adaptation rules */}
            <div className="hpv-adapt card">
                <h3 className="section-title">⚡ Adaptation Rules</h3>
                <div className="hpv-adapt-rule"><AlertTriangle size={14} /><span>{plan.adaptation_rules.miss_rule}</span></div>
                <div className="hpv-adapt-rule hpv-adapt-ok"><Zap size={14} /><span>{plan.adaptation_rules.success_rule}</span></div>
                <div className="hpv-adapt-rule hpv-adapt-plat"><TrendingUp size={14} /><span>{plan.adaptation_rules.plateau_rule}</span></div>
            </div>

            {/* Break goal support */}
            {habit.type === "bad" && plan.break_goal_support?.replacement_behavior && (
                <div className="hpv-break card card-gold">
                    <h3 className="section-title">🔄 Break Strategy</h3>
                    <p><strong>Replacement:</strong> {plan.break_goal_support.replacement_behavior}</p>
                    <p><strong>Trigger:</strong> {plan.break_goal_support.trigger_strategy}</p>
                </div>
            )}
        </div>
    );
}
