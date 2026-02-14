import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import HabitCard from "../components/HabitCard";
import { Plus } from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
    const { state } = useApp();
    const navigate = useNavigate();
    const [filter, setFilter] = useState("all");

    const filteredHabits = state.habits.filter((h) => {
        if (filter === "good") return h.type === "good";
        if (filter === "bad") return h.type === "bad";
        return true;
    });

    const goodCount = state.habits.filter((h) => h.type === "good").length;
    const badCount = state.habits.filter((h) => h.type === "bad").length;

    return (
        <div className="page-enter dashboard-page">
            <div className="dashboard-header">
                <h2>Your Habits</h2>
                <button className="btn btn-primary btn-sm" onClick={() => navigate("/add-habit")}>
                    <Plus size={16} /> Add
                </button>
            </div>

            {/* Filter tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                >
                    All ({state.habits.length})
                </button>
                <button
                    className={`filter-tab ${filter === "good" ? "active" : ""}`}
                    onClick={() => setFilter("good")}
                >
                    🌱 Good ({goodCount})
                </button>
                <button
                    className={`filter-tab ${filter === "bad" ? "active" : ""}`}
                    onClick={() => setFilter("bad")}
                >
                    🔴 Bad ({badCount})
                </button>
            </div>

            {/* Habit list */}
            <div className="habit-list">
                {filteredHabits.length === 0 ? (
                    <div className="empty-state card">
                        <div className="empty-state-icon">🌱</div>
                        <h3>Start Your Atomic Journey</h3>
                        <p>
                            {state.habits.length === 0
                                ? "Add your first habit and begin building the identity you want."
                                : "No habits match this filter."}
                        </p>
                        {state.habits.length === 0 && (
                            <button className="btn btn-primary" onClick={() => navigate("/add-habit")}>
                                <Plus size={18} /> Add First Habit
                            </button>
                        )}
                    </div>
                ) : (
                    filteredHabits.map((habit) => (
                        <HabitCard key={habit.id} habit={habit} />
                    ))
                )}
            </div>
        </div>
    );
}
