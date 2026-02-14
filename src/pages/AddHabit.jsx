import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { difficultyOptions } from "../data/seedData";
import { getTodayStr } from "../utils/storage";
import { ArrowLeft, Check } from "lucide-react";
import "./AddHabit.css";

export default function AddHabit() {
    const { dispatch } = useApp();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [type, setType] = useState("good");
    const [difficulty, setDifficulty] = useState("medium");
    const [frequency, setFrequency] = useState("daily");
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [replacementHabit, setReplacementHabit] = useState("");
    const [negativeCost, setNegativeCost] = useState(20);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = "Habit name is required";
        if (name.trim().length > 50) errs.name = "Max 50 characters";
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        dispatch({
            type: "ADD_HABIT",
            payload: {
                name: name.trim(),
                type,
                difficulty: type === "good" ? difficulty : "medium",
                frequency,
                startDate: getTodayStr(),
                reminderEnabled,
                replacementHabit: type === "bad" ? replacementHabit.trim() : "",
                negativeCost: type === "bad" ? negativeCost : 0,
            },
        });

        setSubmitted(true);
        setTimeout(() => navigate("/dashboard"), 600);
    };

    const selectedDiff = difficultyOptions.find((d) => d.value === difficulty);

    return (
        <div className="page-enter add-habit-page">
            <div className="page-header">
                <button className="btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h2>Create Habit</h2>
            </div>

            {submitted && (
                <div className="success-toast">
                    <Check size={16} /> Habit created! Redirecting...
                </div>
            )}

            <form onSubmit={handleSubmit} className="add-habit-form card card-gold">
                {/* Name */}
                <div className="form-group">
                    <label className="form-label">Habit Name</label>
                    <input
                        type="text"
                        className={`form-input ${errors.name ? "form-input-error" : ""}`}
                        placeholder="e.g., Read for 15 minutes"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setErrors({}); }}
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                {/* Type */}
                <div className="form-group">
                    <label className="form-label">Habit Type</label>
                    <div className="toggle-group">
                        <button type="button" className={`toggle-option ${type === "good" ? "active" : ""}`} onClick={() => setType("good")}>
                            ✅ Good Habit
                        </button>
                        <button type="button" className={`toggle-option ${type === "bad" ? "active" : ""}`} onClick={() => setType("bad")}>
                            🚫 Bad Habit
                        </button>
                    </div>
                </div>

                {/* Difficulty (Good habits only) */}
                {type === "good" && (
                    <div className="form-group">
                        <label className="form-label">Difficulty</label>
                        <div className="difficulty-selector">
                            {difficultyOptions.map((d) => (
                                <button
                                    key={d.value}
                                    type="button"
                                    className={`difficulty-btn ${difficulty === d.value ? "difficulty-active" : ""}`}
                                    onClick={() => setDifficulty(d.value)}
                                    style={{ "--diff-color": d.color }}
                                >
                                    <span className="diff-label">{d.label}</span>
                                    <span className="diff-desc">{d.desc}</span>
                                    <span className="diff-coins">🪙 {d.coins}</span>
                                </button>
                            ))}
                        </div>
                        <p className="form-hint">
                            You'll earn <strong style={{ color: selectedDiff?.color }}>{selectedDiff?.coins} coins</strong> per completion
                        </p>
                    </div>
                )}

                {/* Frequency */}
                <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <div className="toggle-group">
                        <button type="button" className={`toggle-option ${frequency === "daily" ? "active" : ""}`} onClick={() => setFrequency("daily")}>
                            Daily
                        </button>
                        <button type="button" className={`toggle-option ${frequency === "weekdays" ? "active" : ""}`} onClick={() => setFrequency("weekdays")}>
                            Weekdays
                        </button>
                        <button type="button" className={`toggle-option ${frequency === "weekly" ? "active" : ""}`} onClick={() => setFrequency("weekly")}>
                            Weekly
                        </button>
                    </div>
                </div>

                {/* Reminder */}
                <div className="form-group form-row">
                    <label className="form-label">Reminder</label>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={reminderEnabled} onChange={() => setReminderEnabled(!reminderEnabled)} />
                        <span className="toggle-slider" />
                    </label>
                </div>

                {/* Bad habit extras */}
                {type === "bad" && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Replacement (2-min alternative)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Take 5 deep breaths"
                                value={replacementHabit}
                                onChange={(e) => setReplacementHabit(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penalty Cost (coins lost per relapse)</label>
                            <div className="toggle-group">
                                {[10, 20, 30, 50].map((cost) => (
                                    <button
                                        key={cost}
                                        type="button"
                                        className={`toggle-option ${negativeCost === cost ? "active" : ""}`}
                                        onClick={() => setNegativeCost(cost)}
                                    >
                                        🪙 {cost}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <button type="submit" className="btn btn-primary btn-full" disabled={submitted} style={{ marginTop: 8 }}>
                    {submitted ? "Created ✓" : "Create Habit ✨"}
                </button>
            </form>
        </div>
    );
}
