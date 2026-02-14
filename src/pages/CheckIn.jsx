import { useState } from "react";
import { useApp } from "../context/AppContext";
import { moodOptions } from "../data/seedData";
import { getTodayStr } from "../utils/storage";
import "./CheckIn.css";

export default function CheckIn() {
    const { state, dispatch } = useApp();
    const todayStr = getTodayStr();
    const todayCheckin = state.checkins.find((c) => c.date === todayStr);

    const [improved, setImproved] = useState(todayCheckin?.improved ?? null);
    const [identity, setIdentity] = useState(todayCheckin?.identity ?? "");
    const [journal, setJournal] = useState(todayCheckin?.journal ?? "");
    const [mood, setMood] = useState(todayCheckin?.mood ?? null);
    const [submitted, setSubmitted] = useState(!!todayCheckin);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch({
            type: "SAVE_CHECKIN",
            payload: { improved, identity, journal, mood },
        });
        setSubmitted(true);
    };

    const pastCheckins = state.checkins.filter((c) => c.date !== todayStr).slice(0, 7);

    return (
        <div className="page-enter checkin-page">
            <h2>Daily Check-In</h2>
            <p className="section-subtitle">Reflect on your 1% improvement</p>

            <form onSubmit={handleSubmit} className="checkin-form card card-gold">
                {submitted && (
                    <div className="checkin-saved-badge">✓ Today's check-in saved! (+5 🪙)</div>
                )}

                {/* Improved */}
                <div className="form-group">
                    <label className="form-label">Did you improve 1% today?</label>
                    <div className="toggle-group">
                        <button
                            type="button"
                            className={`toggle-option ${improved === true ? "active" : ""}`}
                            onClick={() => setImproved(true)}
                        >
                            ✨ Yes
                        </button>
                        <button
                            type="button"
                            className={`toggle-option ${improved === false ? "active" : ""}`}
                            onClick={() => setImproved(false)}
                        >
                            Not yet
                        </button>
                    </div>
                </div>

                {/* Identity */}
                <div className="form-group">
                    <label className="form-label">What identity are you building?</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., I am becoming a consistent reader"
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                    />
                </div>

                {/* Mood */}
                <div className="form-group">
                    <label className="form-label">How are you feeling?</label>
                    <div className="mood-selector">
                        {moodOptions.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                className={`mood-btn ${mood === m.value ? "mood-active" : ""}`}
                                onClick={() => setMood(m.value)}
                            >
                                <span className="mood-emoji">{m.emoji}</span>
                                <span className="mood-label">{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Journal */}
                <div className="form-group">
                    <label className="form-label">Journal (Optional)</label>
                    <textarea
                        className="form-input"
                        placeholder="What went well today? What will you do differently tomorrow?"
                        value={journal}
                        onChange={(e) => setJournal(e.target.value)}
                        rows={4}
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                    {submitted ? "Update Check-In" : "Save Check-In ✨"}
                </button>
            </form>

            {/* History */}
            {pastCheckins.length > 0 && (
                <div className="checkin-history">
                    <h3 className="section-title">Recent Reflections</h3>
                    {pastCheckins.map((c) => (
                        <div key={c.date} className="checkin-history-item card">
                            <div className="chi-header">
                                <span className="chi-date">{new Date(c.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                                <span className="chi-mood">{moodOptions.find((m) => m.value === c.mood)?.emoji || "—"}</span>
                            </div>
                            {c.identity && <div className="chi-identity">"{c.identity}"</div>}
                            {c.journal && <div className="chi-journal">{c.journal}</div>}
                            <div className="chi-improved">
                                {c.improved ? "✨ Improved 1%" : "🔄 Working on it"}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
