import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { generateHabitPlan } from "../services/geminiAI";
import { getTodayStr } from "../utils/storage";
import { Sparkles, ArrowLeft, Loader, Zap, Target, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import "./AIPlanner.css";

const DEFAULTS = {
    type: "build",
    title: "",
    endDate: "",
    abilityLevel: "beginner",
    currentFrequency: "rarely",
    availableTime: 30,
    daysPerWeek: 5,
    motivation: "medium",
    successDefinition: "",
    constraints: "",
};

export default function AIPlanner() {
    const { dispatch } = useApp();
    const navigate = useNavigate();
    const [form, setForm] = useState(DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);
    const [step, setStep] = useState("input"); // "input" | "result"

    const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
    const [planSource, setPlanSource] = useState(null); // "gemini" | "local"

    const handleGenerate = async () => {
        if (!form.title.trim() || !form.endDate) {
            setError("Please fill in at least the goal title and end date.");
            return;
        }
        setError(null);
        setLoading(true);
        const result = await generateHabitPlan(form);
        setLoading(false);

        if (result.success) {
            setPlan(result.plan);
            setPlanSource(result.source || "local");
            setStep("result");
        } else {
            setError(`AI generation failed: ${result.error}. Please try again.`);
        }
    };

    const handleAdoptPlan = () => {
        if (!plan) return;

        // Auto-create habit from Phase 1
        const phase1 = plan.phases[0];
        const difficulty = phase1.estimated_time_minutes <= 10 ? "easy" : phase1.estimated_time_minutes <= 25 ? "medium" : "hard";

        dispatch({
            type: "ADD_HABIT",
            payload: {
                name: plan.goal.title,
                type: plan.goal.type === "break" ? "bad" : "good",
                difficulty,
                frequency: `${form.daysPerWeek} days/week`,
                startDate: getTodayStr(),
                reminderEnabled: false,
                replacementHabit: plan.break_goal_support?.replacement_behavior || "",
            },
        });

        // Save the plan to localStorage for phase tracking
        const plans = JSON.parse(localStorage.getItem("atomic-rise-plans") || "[]");
        plans.push({
            id: "plan-" + Date.now(),
            createdAt: new Date().toISOString(),
            plan,
            currentPhase: 1,
            consecutiveSuccesses: 0,
            consecutiveMisses: 0,
        });
        localStorage.setItem("atomic-rise-plans", JSON.stringify(plans));

        navigate("/dashboard");
    };

    const phaseIcons = ["🌱", "📚", "💪", "🏆"];
    const phaseColors = ["#27AE60", "#3498DB", "#E67E22", "#9B59B6"];

    if (loading) {
        return (
            <div className="page-enter ai-planner-page">
                <div className="ai-loading">
                    <div className="ai-loading-orb">
                        <Sparkles size={32} />
                    </div>
                    <h3>AI Is Thinking...</h3>
                    <p>Designing your personalized habit plan using behavioral psychology</p>
                    <div className="ai-loading-dots">
                        <span /><span /><span />
                    </div>
                </div>
            </div>
        );
    }

    if (step === "result" && plan) {
        return (
            <div className="page-enter ai-planner-page">
                <button className="ai-back" onClick={() => setStep("input")}>
                    <ArrowLeft size={18} /> Edit Inputs
                </button>

                {/* Plan header */}
                <div className="plan-header card card-gold">
                    <div className="plan-header-icon">
                        <Sparkles size={28} />
                    </div>
                    <h2 className="plan-title">{plan.goal.title}</h2>
                    <div className="plan-meta">
                        <span className="plan-tag plan-tag-type">{plan.goal.type === "build" ? "🔨 Build" : "🛑 Break"}</span>
                        <span className="plan-tag plan-tag-conf" style={{
                            background: plan.goal.confidence_level === "High" ? "#27AE6022" : plan.goal.confidence_level === "Medium" ? "#F1C40F22" : "#E74C3C22",
                            color: plan.goal.confidence_level === "High" ? "#27AE60" : plan.goal.confidence_level === "Medium" ? "#F1C40F" : "#E74C3C",
                        }}>
                            {plan.goal.confidence_level} Confidence
                        </span>
                        <span className="plan-tag plan-tag-prob">
                            {plan.goal.estimated_success_probability} success rate
                        </span>
                    </div>
                    <p className="plan-end">Target: {plan.goal.end_date}</p>
                    <span className={`plan-source ${planSource === "gemini" ? "plan-source-ai" : "plan-source-local"}`}>
                        {planSource === "gemini" ? "✨ Generated by Gemini AI" : "🧠 Generated by Behavioral Engine"}
                    </span>
                </div>

                {/* Phases */}
                <h3 className="section-title" style={{ marginTop: 20 }}>Progressive Phases</h3>
                <div className="phases-timeline">
                    {plan.phases.map((phase, i) => (
                        <div key={phase.phase} className="phase-card card" style={{ borderLeft: `4px solid ${phaseColors[i]}` }}>
                            <div className="phase-header">
                                <span className="phase-icon">{phaseIcons[i]}</span>
                                <div className="phase-meta">
                                    <strong className="phase-name">Phase {phase.phase}: {phase.name}</strong>
                                    <span className="phase-duration">{phase.min_duration_days}-{phase.max_duration_days} days</span>
                                </div>
                                <span className="phase-time">{phase.estimated_time_minutes} min/day</span>
                            </div>
                            <div className="phase-target">
                                <Target size={14} />
                                <span>{phase.daily_target}</span>
                            </div>
                            <div className="phase-details">
                                <div className="phase-detail">
                                    <TrendingUp size={12} />
                                    <span>{phase.progression_rule}</span>
                                </div>
                                <div className="phase-detail">
                                    <CheckCircle size={12} />
                                    <span>{phase.success_criteria}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Adaptation rules */}
                <div className="adapt-section card">
                    <h3 className="section-title">⚡ Adaptation Rules</h3>
                    <div className="adapt-rule">
                        <AlertTriangle size={14} />
                        <span>{plan.adaptation_rules.miss_rule}</span>
                    </div>
                    <div className="adapt-rule adapt-success">
                        <Zap size={14} />
                        <span>{plan.adaptation_rules.success_rule}</span>
                    </div>
                    <div className="adapt-rule adapt-plateau">
                        <TrendingUp size={14} />
                        <span>{plan.adaptation_rules.plateau_rule}</span>
                    </div>
                </div>

                {/* Break goal support */}
                {plan.goal.type === "break" && plan.break_goal_support?.replacement_behavior && (
                    <div className="break-support card card-gold">
                        <h3 className="section-title">🔄 Break Goal Strategy</h3>
                        <p><strong>Replacement:</strong> {plan.break_goal_support.replacement_behavior}</p>
                        <p><strong>Tracking:</strong> {plan.break_goal_support.avoidance_tracking}</p>
                        <p><strong>Trigger:</strong> {plan.break_goal_support.trigger_strategy}</p>
                    </div>
                )}

                {/* Adopt button */}
                <button className="btn btn-primary btn-full adopt-btn" onClick={handleAdoptPlan}>
                    <Sparkles size={18} />
                    Adopt This Plan & Start Phase 1
                </button>
            </div>
        );
    }

    // Input form
    return (
        <div className="page-enter ai-planner-page">
            <button className="ai-back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back
            </button>

            <div className="ai-hero">
                <div className="ai-hero-icon">
                    <Sparkles size={32} />
                </div>
                <h2>AI Habit Planner</h2>
                <p>Powered by behavioral psychology. Tell us your goal and we'll design a progressive plan.</p>
            </div>

            <div className="ai-form">
                {/* Goal type */}
                <div className="ai-field">
                    <label>Goal Type</label>
                    <div className="ai-toggle-row">
                        <button className={`ai-toggle ${form.type === "build" ? "ai-toggle-active" : ""}`} onClick={() => update("type", "build")}>
                            🔨 Build
                        </button>
                        <button className={`ai-toggle ${form.type === "break" ? "ai-toggle-active" : ""}`} onClick={() => update("type", "break")}>
                            🛑 Break
                        </button>
                    </div>
                </div>

                {/* Title */}
                <div className="ai-field">
                    <label>What's Your Goal? *</label>
                    <input type="text" placeholder="e.g. Read 30 minutes daily" value={form.title} onChange={(e) => update("title", e.target.value)} />
                </div>

                {/* End date */}
                <div className="ai-field">
                    <label>Target End Date *</label>
                    <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
                </div>

                {/* Ability level */}
                <div className="ai-field">
                    <label>Current Ability Level</label>
                    <div className="ai-select-row">
                        {["beginner", "some experience", "advanced"].map((v) => (
                            <button key={v} className={`ai-chip ${form.abilityLevel === v ? "ai-chip-active" : ""}`} onClick={() => update("abilityLevel", v)}>
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Current frequency */}
                <div className="ai-field">
                    <label>How Often Do You Do This Now?</label>
                    <div className="ai-select-row">
                        {["never", "rarely", "sometimes", "often"].map((v) => (
                            <button key={v} className={`ai-chip ${form.currentFrequency === v ? "ai-chip-active" : ""}`} onClick={() => update("currentFrequency", v)}>
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time + days row */}
                <div className="ai-row">
                    <div className="ai-field ai-field-half">
                        <label>Minutes/Day</label>
                        <input type="number" min={5} max={120} value={form.availableTime} onChange={(e) => update("availableTime", parseInt(e.target.value) || 30)} />
                    </div>
                    <div className="ai-field ai-field-half">
                        <label>Days/Week</label>
                        <input type="number" min={1} max={7} value={form.daysPerWeek} onChange={(e) => update("daysPerWeek", parseInt(e.target.value) || 5)} />
                    </div>
                </div>

                {/* Motivation */}
                <div className="ai-field">
                    <label>Motivation Level</label>
                    <div className="ai-select-row">
                        {["low", "medium", "high"].map((v) => (
                            <button key={v} className={`ai-chip ${form.motivation === v ? "ai-chip-active" : ""}`} onClick={() => update("motivation", v)}>
                                {v === "low" ? "😐" : v === "medium" ? "💪" : "🔥"} {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Success definition */}
                <div className="ai-field">
                    <label>What Does Success Look Like?</label>
                    <input type="text" placeholder="e.g. Read 1 book per month consistently" value={form.successDefinition} onChange={(e) => update("successDefinition", e.target.value)} />
                </div>

                {/* Constraints */}
                <div className="ai-field">
                    <label>Any Constraints? (optional)</label>
                    <input type="text" placeholder="e.g. Only free after 8pm, bad knees" value={form.constraints} onChange={(e) => update("constraints", e.target.value)} />
                </div>

                {error && (
                    <div className="ai-error">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                <button className="btn btn-primary btn-full ai-generate-btn" onClick={handleGenerate}>
                    <Sparkles size={18} />
                    Generate AI Plan
                </button>
            </div>
        </div>
    );
}
