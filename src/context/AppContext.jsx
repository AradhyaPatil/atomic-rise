import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from "react";
import { saveState, loadState, calculateStreak, getTodayStr, getHabitCoins, formatDate, getMultiplier, calculateAtomicScore, getAtomicTier, calculateIdentityAlignment, getConsistencyScore } from "../utils/storage";
import { defaultChallenges, simulatedLeaderboard, defaultRewards } from "../data/seedData";

const AppContext = createContext(null);

const initialState = {
    habits: [],
    coins: 0,
    challenges: defaultChallenges,
    leaderboard: simulatedLeaderboard,
    checkins: [],
    rewards: defaultRewards,
    focusModeUnlocked: false,
    insightsUnlocked: false,
    username: "You",
    focusSessions: [],
    focusStreak: 0,
    boostActive: false,
    boostExpiry: null,
    doubleRewardToday: null,
    graceDays: [],
    selectedIdentity: null, // "Disciplined" | "Healthy" | "Focused" | "Social" | "Learner"
    vault: { deposits: [], totalBalance: 0 },
};

function appReducer(state, action) {
    switch (action.type) {
        case "LOAD_STATE":
            return { ...initialState, ...action.payload };

        case "ADD_HABIT": {
            const newHabit = {
                id: "habit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
                name: action.payload.name,
                type: action.payload.type,
                difficulty: action.payload.difficulty || "medium",
                frequency: action.payload.frequency,
                startDate: action.payload.startDate,
                reminderEnabled: action.payload.reminderEnabled || false,
                completions: {},
                coinsEarned: 0,
                replacementHabit: action.payload.replacementHabit || "",
                negativeCost: action.payload.negativeCost || 20,
            };
            return { ...state, habits: [...state.habits, newHabit] };
        }

        case "DELETE_HABIT":
            return {
                ...state,
                habits: state.habits.filter((h) => h.id !== action.payload),
            };

        case "TOGGLE_COMPLETION": {
            const { habitId, date } = action.payload;
            const habit = state.habits.find((h) => h.id === habitId);
            if (!habit) return state;

            const wasCompleted = habit.completions?.[date];
            const mult = getMultiplier(state); // Uses capped multiplier (max 3x)
            const baseCoins = Math.abs(getHabitCoins(habit));

            let coinsDelta = 0;
            const newCompletions = { ...habit.completions };

            if (wasCompleted) {
                delete newCompletions[date];
                coinsDelta = habit.type === "bad" ? baseCoins : -(baseCoins * mult);
            } else {
                newCompletions[date] = true;
                coinsDelta = habit.type === "bad" ? -(baseCoins) : (baseCoins * mult);
            }

            // Check for 7-day streak bonus
            const newStreak = calculateStreak(newCompletions, state.graceDays);
            const oldStreak = calculateStreak(habit.completions, state.graceDays);
            if (newStreak >= 7 && newStreak > oldStreak && newStreak % 7 === 0) {
                coinsDelta += 50;
            }

            const habits = state.habits.map((h) => {
                if (h.id !== habitId) return h;
                return {
                    ...h,
                    completions: newCompletions,
                    coinsEarned: Math.max(0, (h.coinsEarned || 0) + coinsDelta),
                };
            });

            return {
                ...state,
                habits,
                coins: Math.max(0, state.coins + coinsDelta),
            };
        }

        case "EARN_COINS":
            return { ...state, coins: state.coins + action.payload };

        case "SPEND_COINS":
            return { ...state, coins: Math.max(0, state.coins - action.payload) };

        case "REDEEM_REWARD": {
            const rewardId = action.payload;
            const reward = state.rewards.find((r) => r.id === rewardId);
            if (!reward || state.coins < reward.cost) return state;

            const rewards = state.rewards.map((r) =>
                r.id === rewardId ? { ...r, owned: r.owned + 1 } : r
            );

            let extra = {};
            if (reward.type === "focus") extra.focusModeUnlocked = true;
            if (reward.type === "insights") extra.insightsUnlocked = true;
            if (reward.type === "double") extra.doubleRewardToday = getTodayStr();
            if (reward.type === "boost") {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 3);
                extra.boostActive = true;
                extra.boostExpiry = expiry.toISOString();
            }

            return {
                ...state,
                rewards,
                coins: state.coins - reward.cost,
                ...extra,
            };
        }

        case "USE_SKIP": {
            const skipReward = state.rewards.find((r) => r.type === "skip");
            if (!skipReward || skipReward.owned <= 0) return state;

            const rewards = state.rewards.map((r) =>
                r.type === "skip" ? { ...r, owned: r.owned - 1 } : r
            );

            const { habitId } = action.payload;
            const today = getTodayStr();
            const habits = state.habits.map((h) => {
                if (h.id !== habitId) return h;
                return { ...h, completions: { ...h.completions, [today]: true } };
            });

            return {
                ...state,
                rewards,
                habits,
                graceDays: [...(state.graceDays || []), today],
            };
        }

        case "JOIN_CHALLENGE": {
            const challenges = state.challenges.map((c) =>
                c.id === action.payload ? { ...c, joined: true, progress: 0 } : c
            );
            return { ...state, challenges };
        }

        case "LEAVE_CHALLENGE": {
            const challenges = state.challenges.map((c) =>
                c.id === action.payload ? { ...c, joined: false, progress: 0 } : c
            );
            return { ...state, challenges };
        }

        case "INCREMENT_CHALLENGE": {
            const challenges = state.challenges.map((c) => {
                if (c.id !== action.payload || !c.joined || c.completed) return c;
                const newProgress = c.progress + 1;
                const completed = newProgress >= c.duration;
                return { ...c, progress: newProgress, completed };
            });

            const justCompleted = challenges.find(
                (c) => c.id === action.payload && c.completed && !state.challenges.find((sc) => sc.id === action.payload)?.completed
            );

            return {
                ...state,
                challenges,
                coins: justCompleted ? state.coins + justCompleted.reward : state.coins,
            };
        }

        case "SAVE_CHECKIN": {
            const checkin = {
                date: getTodayStr(),
                ...action.payload,
            };
            return {
                ...state,
                checkins: [checkin, ...state.checkins.filter((c) => c.date !== getTodayStr())],
                coins: state.coins + 5,
            };
        }

        case "LOG_FOCUS_SESSION": {
            const session = {
                date: getTodayStr(),
                duration: action.payload.duration || 25,
                completedAt: new Date().toISOString(),
            };

            const sessions = [...(state.focusSessions || []), session];

            let focusStreak = 0;
            const d = new Date();
            while (true) {
                const dateStr = formatDate(d);
                if (sessions.some((s) => s.date === dateStr)) {
                    focusStreak++;
                    d.setDate(d.getDate() - 1);
                } else {
                    break;
                }
            }

            return {
                ...state,
                focusSessions: sessions,
                focusStreak,
                coins: state.coins + 25,
            };
        }

        case "SET_USERNAME":
            return { ...state, username: action.payload };

        case "SET_IDENTITY":
            return { ...state, selectedIdentity: action.payload };

        case "VAULT_DEPOSIT": {
            const { amount, linked_goal_id } = action.payload;
            const deposit = {
                id: "dep-" + Date.now(),
                amount,
                linked_goal_id,
                status: "locked",
                createdAt: new Date().toISOString(),
            };
            const vault = state.vault || { deposits: [], totalBalance: 0 };
            return {
                ...state,
                vault: {
                    deposits: [...vault.deposits, deposit],
                    totalBalance: vault.totalBalance + amount,
                },
            };
        }

        case "VAULT_UNLOCK": {
            const { depositId } = action.payload;
            const vault = state.vault || { deposits: [], totalBalance: 0 };
            let bonusCoins = 0;
            const deposits = vault.deposits.map((d) => {
                if (d.id !== depositId || d.status !== "locked") return d;
                bonusCoins = Math.round(d.amount * 0.05); // 5% bonus coins
                return { ...d, status: "unlocked" };
            });
            return {
                ...state,
                vault: { ...vault, deposits },
                coins: state.coins + bonusCoins,
            };
        }

        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        const saved = loadState();
        if (saved) {
            dispatch({ type: "LOAD_STATE", payload: saved });
        }
    }, []);

    useEffect(() => {
        saveState(state);
    }, [state]);

    // ====== DERIVED SELECTORS (memoized heavy computations) ======
    const derivedState = useMemo(() => {
        const atomicScore = calculateAtomicScore(state);
        const tier = getAtomicTier(atomicScore);
        const identityAlignment = calculateIdentityAlignment(state);
        const goodHabits = state.habits.filter((h) => h.type === "good");
        const avgConsistency = goodHabits.length > 0
            ? Math.round(goodHabits.reduce((s, h) => s + getConsistencyScore(h), 0) / goodHabits.length)
            : 0;
        const bestStreak = Math.max(0, ...state.habits.map((h) => calculateStreak(h.completions, state.graceDays)));

        return {
            atomicScore,
            tier,
            identityAlignment,
            avgConsistency,
            bestStreak,
            goodHabits,
            badHabits: state.habits.filter((h) => h.type === "bad"),
        };
    }, [state.habits, state.challenges, state.focusSessions, state.checkins, state.selectedIdentity, state.graceDays]);

    const stableDispatch = useCallback(dispatch, []);

    return (
        <AppContext.Provider value={{ state, dispatch: stableDispatch, derived: derivedState }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within AppProvider");
    }
    return context;
}
