const STORAGE_KEY = "atomic-rise-state";

// =============== PERSISTENCE ===============
export function saveState(state) {
    try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
        console.error("Failed to save state:", e);
    }
}

export function loadState() {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (serialized === null) return null;
        return JSON.parse(serialized);
    } catch (e) {
        console.error("Failed to load state:", e);
        return null;
    }
}

// =============== DATE UTILS ===============
export function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getTodayStr() {
    return formatDate(new Date());
}

export function getYesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
}

export function getWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(formatDate(d));
    }
    return dates;
}

export function getDayLabel(dateStr) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date(dateStr + "T00:00:00");
    return days[d.getDay()];
}

export function generateId() {
    return "habit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

export function daysBetween(d1, d2) {
    const a = new Date(d1 + "T00:00:00");
    const b = new Date(d2 + "T00:00:00");
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/** Get the Monday of the current week as YYYY-MM-DD */
export function getWeekStart() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    return formatDate(monday);
}

// =============== STREAK ALGORITHM (UPGRADED) ===============
export function calculateStreak(completions, graceDays = []) {
    if (!completions || Object.keys(completions).length === 0) return 0;

    let streak = 0;
    const d = new Date();
    const todayStr = formatDate(d);

    if (!completions[todayStr]) {
        d.setDate(d.getDate() - 1);
    }

    let gracesUsed = 0;
    const maxGrace = graceDays.length;

    while (true) {
        const dateStr = formatDate(d);
        if (completions[dateStr]) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else if (gracesUsed < maxGrace && graceDays.includes(dateStr)) {
            gracesUsed++;
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

// =============== DIFFICULTY & COINS ===============
export const DIFFICULTY_COINS = {
    easy: 5,
    medium: 10,
    hard: 20,
};

export function getHabitCoins(habit) {
    if (habit.type === "bad") return -(habit.negativeCost || 20);
    return DIFFICULTY_COINS[habit.difficulty] || 10;
}

/** Multiplier cap at 3x to prevent economy inflation */
export const MAX_MULTIPLIER = 3;

export function getMultiplier(state) {
    const today = getTodayStr();
    let mult = 1;
    if (state.boostActive && state.boostExpiry && new Date() <= new Date(state.boostExpiry)) mult *= 2;
    if (state.doubleRewardToday === today) mult *= 2;
    return Math.min(mult, MAX_MULTIPLIER); // Cap at 3x
}

// =============== WEEKLY METRICS ===============
export function getWeeklyProgress(habit) {
    const weekDates = getWeekDates();
    const completed = weekDates.filter(
        (date) => habit.completions && habit.completions[date]
    ).length;
    return Math.round((completed / 7) * 100);
}

export function getWeeklyCoins(habit) {
    const weekDates = getWeekDates();
    const completed = weekDates.filter(
        (date) => habit.completions && habit.completions[date]
    ).length;
    const perCheck = DIFFICULTY_COINS[habit.difficulty] || 10;
    return completed * perCheck;
}

// =============== CONSISTENCY SCORE ===============
export function getConsistencyScore(habit) {
    if (!habit.startDate) return 0;
    const start = new Date(habit.startDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = Math.max(1, Math.round((today - start) / (1000 * 60 * 60 * 24)) + 1);
    const completedDays = Object.keys(habit.completions || {}).length;
    return Math.min(100, Math.round((completedDays / totalDays) * 100));
}

// =============== FOCUS BONUS ===============
/** If user did ≥3 focus sessions this week, grants +5% consistency bonus */
export function getFocusConsistencyBonus(focusSessions = []) {
    const weekDates = new Set(getWeekDates());
    const thisWeekSessions = (focusSessions || []).filter((s) => weekDates.has(s.date));
    return thisWeekSessions.length >= 3 ? 5 : 0;
}

// =============== IDENTITY KEYWORD SYSTEM ===============
export const IDENTITY_KEYWORDS = [
    { keyword: "Disciplined", tag: "discipline", weights: { morning: 0.2, health: 0.3, focus: 0.3, social: 0.1, learning: 0.1 } },
    { keyword: "Healthy", tag: "health", weights: { morning: 0.1, health: 0.4, focus: 0.15, social: 0.1, learning: 0.25 } },
    { keyword: "Focused", tag: "focus", weights: { morning: 0.15, health: 0.1, focus: 0.45, social: 0.05, learning: 0.25 } },
    { keyword: "Social", tag: "social", weights: { morning: 0.1, health: 0.1, focus: 0.1, social: 0.5, learning: 0.2 } },
    { keyword: "Learner", tag: "learning", weights: { morning: 0.1, health: 0.1, focus: 0.2, social: 0.1, learning: 0.5 } },
];

/** Auto-classify a habit name into a category */
export function classifyHabit(name) {
    const n = (name || "").toLowerCase();
    if (/morn|wake|earli|sunrise|5.am|6.am|routine/i.test(n)) return "morning";
    if (/workout|exercise|run|jog|gym|yoga|stretch|walk|diet|water|meditat|sleep|health|eat/i.test(n)) return "health";
    if (/focus|deep.work|read|study|learn|code|write|journal|review|pomo/i.test(n)) return "focus";
    if (/call|friend|family|social|network|meet|communit/i.test(n)) return "social";
    if (/read|learn|book|course|skill|language|practic|study/i.test(n)) return "learning";
    return "focus"; // default
}

// =============== IDENTITY ALIGNMENT (SEMANTIC) ===============
export function calculateIdentityAlignment(state) {
    const { habits, checkins = [] } = state;
    const selectedIdentity = state.selectedIdentity || null;
    if (habits.length === 0) return 0;

    const goodHabits = habits.filter((h) => h.type === "good");
    if (goodHabits.length === 0) return 0;

    // Base: average consistency
    const avgConsistency = goodHabits.reduce((sum, h) => sum + getConsistencyScore(h), 0) / goodHabits.length;

    // Semantic boost: if an identity keyword is selected, weight habits by category match
    let semanticScore = avgConsistency;
    if (selectedIdentity) {
        const identityDef = IDENTITY_KEYWORDS.find((k) => k.keyword === selectedIdentity);
        if (identityDef) {
            // Weight each habit's consistency by how much it matches the identity
            let weightedSum = 0;
            let weightTotal = 0;
            goodHabits.forEach((h) => {
                const category = classifyHabit(h.name);
                const weight = identityDef.weights[category] || 0.1;
                const consistency = getConsistencyScore(h);
                weightedSum += consistency * weight;
                weightTotal += weight;
            });
            if (weightTotal > 0) {
                semanticScore = weightedSum / weightTotal;
            }
        }
    }

    // Boost for check-in frequency (shows identity engagement)
    const recentCheckins = checkins.filter((c) => {
        const diff = daysBetween(c.date, getTodayStr());
        return diff <= 14;
    }).length;
    const checkinBoost = Math.min(15, recentCheckins * 1.5);

    // Focus bonus synergy
    const focusBonus = getFocusConsistencyBonus(state.focusSessions);

    return Math.min(100, Math.round(semanticScore + checkinBoost + focusBonus));
}

// =============== ATOMIC SCORE (NON-LINEAR) ===============
export function calculateAtomicScore(state) {
    const { habits, challenges, focusSessions = [] } = state;

    if (habits.length === 0) return 0;

    const goodHabits = habits.filter((h) => h.type === "good");

    // 1. Overall consistency (0-100) + focus bonus
    const avgConsistency = goodHabits.length > 0
        ? goodHabits.reduce((sum, h) => sum + getConsistencyScore(h), 0) / goodHabits.length
        : 0;
    const focusBonus = getFocusConsistencyBonus(focusSessions);
    const consistencyScore = Math.min(100, avgConsistency + focusBonus);

    // 2. Active habits — NON-LINEAR: sqrt scaling prevents gaming with many easy habits
    //    sqrt(10) ≈ 3.16, so habitScore maxes ~63 at 10 habits, not 200
    const habitScore = Math.min(100, (Math.sqrt(habits.length) / Math.sqrt(10)) * 100);

    // 3. Challenge completion (0-100)
    const totalChallenges = challenges.length;
    const completedChallenges = challenges.filter((c) => c.completed).length;
    const challengeScore = totalChallenges > 0
        ? (completedChallenges / totalChallenges) * 100
        : 0;

    // 4. Streak bonus — NON-LINEAR: log scaling, diminishing returns past 30
    //    log(1+30)/log(1+60) ≈ 0.83 — long streaks still rewarded but not exploitable
    const totalStreakDays = habits.reduce((s, h) => s + calculateStreak(h.completions, state.graceDays), 0);
    const streakScore = Math.min(100, (Math.log(1 + totalStreakDays) / Math.log(1 + 60)) * 100);

    // 5. Focus time — log scaling (diminishing returns past 50 sessions)
    const focusScoreRaw = Math.min(100, (Math.log(1 + focusSessions.length) / Math.log(1 + 50)) * 100);

    // 6. Identity alignment (0-100)
    const identityScore = calculateIdentityAlignment(state);

    // Weighted composite
    const atomicScore = Math.round(
        (consistencyScore * 0.30) +
        (habitScore * 0.10) +
        (challengeScore * 0.15) +
        (streakScore * 0.15) +
        (focusScoreRaw * 0.10) +
        (identityScore * 0.20)
    );

    return Math.min(1000, Math.round(atomicScore * 10));
}

// =============== TIER SYSTEM ===============
export function getAtomicTier(score) {
    if (score >= 800) return { name: "Atomic Elite", icon: "💎", color: "#9B59B6" };
    if (score >= 600) return { name: "Gold", icon: "🥇", color: "#C8A951" };
    if (score >= 400) return { name: "Silver", icon: "🥈", color: "#A0A0A0" };
    if (score >= 200) return { name: "Bronze", icon: "🥉", color: "#CD7F32" };
    return { name: "Beginner", icon: "🌱", color: "#27AE60" };
}

// =============== INSIGHT ENGINE (With Confidence Scoring) ===============
export function generateInsights(state) {
    const { habits, challenges, focusSessions = [] } = state;
    const insights = [];

    const goodHabits = habits.filter((h) => h.type === "good");
    const badHabits = habits.filter((h) => h.type === "bad");

    goodHabits.forEach((h) => {
        const consistency = getConsistencyScore(h);
        const streak = calculateStreak(h.completions, state.graceDays);
        const dataDays = Object.keys(h.completions || {}).length;
        const totalDays = h.startDate ? daysBetween(h.startDate, getTodayStr()) + 1 : dataDays;

        // Confidence = how much data we have (more days = higher confidence)
        const confidence = Math.min(98, Math.round(50 + (Math.min(totalDays, 30) / 30) * 48));

        if (consistency < 50 && dataDays > 3) {
            insights.push({
                type: "warning",
                icon: "⚠️",
                title: `"${h.name}" needs attention`,
                text: `Only ${consistency}% consistency. Try reducing difficulty or pairing it with an existing habit.`,
                confidence,
                dataDays: totalDays,
            });
        }

        if (streak >= 7 && streak < 21) {
            insights.push({
                type: "success",
                icon: "🔥",
                title: `${streak}-day streak on "${h.name}"!`,
                text: `You're building momentum. Consider increasing difficulty to level up.`,
                confidence,
                dataDays: totalDays,
            });
        }

        if (streak >= 21) {
            insights.push({
                type: "milestone",
                icon: "🏆",
                title: `"${h.name}" is becoming automatic!`,
                text: `21+ days means this habit is solidifying into your identity. You've entered the "automaticity" phase.`,
                confidence: Math.min(98, confidence + 10),
                dataDays: totalDays,
            });
        }

        // High consistency + easy difficulty → suggest upgrading
        if (consistency >= 85 && h.difficulty === "easy" && dataDays >= 7) {
            insights.push({
                type: "tip",
                icon: "📈",
                title: `Ready to level up "${h.name}"?`,
                text: `${consistency}% consistency at Easy difficulty. You could handle Medium for 2× the coins.`,
                confidence,
                dataDays: totalDays,
            });
        }
    });

    // Bad habit insights
    if (badHabits.length >= 3) {
        insights.push({
            type: "tip",
            icon: "💡",
            title: "Too many bad habits tracked",
            text: "Focus on replacing one bad habit at a time with a 2-minute alternative for better results.",
            confidence: 90,
            dataDays: null,
        });
    }

    badHabits.forEach((h) => {
        const relapses = Object.keys(h.completions || {}).length;
        if (relapses === 0) {
            insights.push({
                type: "success",
                icon: "✨",
                title: `Clean record on "${h.name}"`,
                text: "No relapses tracked. Keep building that resistance!",
                confidence: 75,
                dataDays: null,
            });
        }
    });

    // Focus insights
    if (focusSessions.length === 0 && habits.length > 0) {
        insights.push({
            type: "tip",
            icon: "🎯",
            title: "Try Focus Mode",
            text: "Deep work sessions can boost your consistency by up to 5%. Unlock it in the shop!",
            confidence: 85,
            dataDays: null,
        });
    }

    const focusBonus = getFocusConsistencyBonus(focusSessions);
    if (focusBonus > 0) {
        insights.push({
            type: "success",
            icon: "🧠",
            title: "Focus Synergy Active!",
            text: `3+ focus sessions this week → +${focusBonus}% consistency bonus applied to your Atomic Score.`,
            confidence: 95,
            dataDays: focusSessions.length,
        });
    }

    if (focusSessions.length >= 10) {
        insights.push({
            type: "milestone",
            icon: "🧠",
            title: "Deep Work Warrior",
            text: `${focusSessions.length} focus sessions completed! You're in the top tier of concentration.`,
            confidence: 95,
            dataDays: focusSessions.length,
        });
    }

    // Challenge insights
    const activeChallenges = challenges.filter((c) => c.joined && !c.completed);
    if (activeChallenges.length === 0 && challenges.some((c) => !c.joined)) {
        insights.push({
            type: "tip",
            icon: "🏋️",
            title: "Join a Challenge",
            text: "Challenges contribute 15% to your Atomic Score. Pick one to push yourself!",
            confidence: 90,
            dataDays: null,
        });
    }

    return insights;
}

// =============== LIFT-RATIO CORRELATION ENGINE ===============
export function detectHabitCorrelations(habits) {
    const correlations = [];
    const goodHabits = habits.filter((h) => h.type === "good");

    if (goodHabits.length < 2) return correlations;

    // Build a universe of all dates where ANY habit was tracked
    const allDatesSet = new Set();
    goodHabits.forEach((h) => {
        Object.keys(h.completions || {}).forEach((d) => allDatesSet.add(d));
    });
    const totalDays = Math.max(1, allDatesSet.size);

    for (let i = 0; i < goodHabits.length; i++) {
        for (let j = i + 1; j < goodHabits.length; j++) {
            const h1 = goodHabits[i];
            const h2 = goodHabits[j];

            const dates1 = new Set(Object.keys(h1.completions || {}));
            const dates2 = new Set(Object.keys(h2.completions || {}));

            if (dates1.size < 3 || dates2.size < 3) continue;

            // P(H2) = overall probability of completing H2
            const pH2 = dates2.size / totalDays;

            // P(H2 | H1) = probability of H2 on days H1 was done
            let coOccurrence = 0;
            dates1.forEach((d) => { if (dates2.has(d)) coOccurrence++; });
            const pH2givenH1 = coOccurrence / Math.max(1, dates1.size);

            // Lift ratio: how much H1 "lifts" the probability of H2
            const lift = pH2 > 0 ? pH2givenH1 / pH2 : 1;
            const liftPercentage = Math.round((lift - 1) * 100);

            // Only report meaningful positive correlations
            if (lift >= 1.15 && coOccurrence >= 3) {
                // Data confidence based on observation count
                const dataPoints = Math.min(dates1.size, dates2.size);
                const confidence = Math.min(95, Math.round(50 + (Math.min(dataPoints, 20) / 20) * 45));

                correlations.push({
                    habit1: h1.name,
                    habit2: h2.name,
                    lift: Math.round(lift * 100) / 100,
                    liftPercentage,
                    coOccurrences: coOccurrence,
                    confidence,
                    text: `${h1.name} increases ${h2.name} completion probability by ${liftPercentage}%.`,
                });
            }
        }
    }

    correlations.sort((a, b) => b.liftPercentage - a.liftPercentage);
    return correlations.slice(0, 3);
}

// =============== FOCUS HEATMAP DATA ===============
export function getFocusHeatmap(focusSessions = []) {
    const heatmap = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        heatmap[dateStr] = 0;
    }

    focusSessions.forEach((s) => {
        if (heatmap[s.date] !== undefined) {
            heatmap[s.date] += s.duration || 25;
        }
    });

    return heatmap;
}

// =============== FUTURE PROJECTION ENGINE ===============
/** Projects Atomic Score 30 days ahead based on last 14 days of daily completion rates */
export function projectAtomicScore(state) {
    const { habits } = state;
    if (habits.length === 0) return { projected: 0, trend: "stable", dailyRate: 0 };

    const goodHabits = habits.filter((h) => h.type === "good");
    if (goodHabits.length === 0) return { projected: 0, trend: "stable", dailyRate: 0 };

    // Look back 14 days and count completions per day
    const today = new Date();
    const dailyCompletions = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        const completed = goodHabits.filter((h) => h.completions?.[dateStr]).length;
        dailyCompletions.push(completed / goodHabits.length); // rate 0-1
    }

    // Simple linear trend: compare first half avg to second half avg
    const firstHalf = dailyCompletions.slice(0, 7);
    const secondHalf = dailyCompletions.slice(7);
    const avg1 = firstHalf.reduce((s, v) => s + v, 0) / 7;
    const avg2 = secondHalf.reduce((s, v) => s + v, 0) / 7;
    const dailyImprovement = (avg2 - avg1) / 7; // daily rate of change

    // Project consistency 30 days from now
    const currentRate = avg2;
    const projectedRate = Math.max(0, Math.min(1, currentRate + dailyImprovement * 30));

    // Estimate projected score (current + projected consistency growth)
    const currentScore = calculateAtomicScore(state);
    // Consistency contributes 30% of score (scaled to 1000), so max delta from consistency = 300
    const consistencyDelta = Math.round((projectedRate - currentRate) * 100 * 0.30 * 10);
    // Assume streaks grow too: rough estimate +1 streak day per day of consistency
    const streakDelta = Math.round(Math.log(1 + 30) / Math.log(1 + 60) * 0.15 * 1000 * (projectedRate > 0.5 ? 0.3 : 0.1));

    const projected = Math.max(0, Math.min(1000, currentScore + consistencyDelta + streakDelta));

    let trend = "stable";
    if (dailyImprovement > 0.01) trend = "improving";
    else if (dailyImprovement < -0.01) trend = "declining";

    return {
        projected: Math.round(projected),
        trend,
        dailyRate: Math.round(currentRate * 100),
        projectedRate: Math.round(projectedRate * 100),
        confidence: Math.min(90, Math.round(50 + dailyCompletions.filter((v) => v > 0).length * 3)),
    };
}

// =============== WEEKLY LEADERBOARD ===============
export function getWeeklyLeaderboardData(state) {
    const weekDates = getWeekDates();
    const goodHabits = state.habits.filter((h) => h.type === "good");

    // User's weekly completions
    const weeklyCompletions = weekDates.reduce((sum, date) => {
        return sum + goodHabits.filter((h) => h.completions?.[date]).length;
    }, 0);

    // Weekly consistency
    const weeklyConsistency = goodHabits.length > 0
        ? Math.round((weeklyCompletions / (goodHabits.length * 7)) * 100)
        : 0;

    // Determine special badges
    const badges = [];

    // Focus Champion: ≥5 focus sessions this week
    const weeklyFocus = (state.focusSessions || []).filter((s) => weekDates.includes(s.date));
    if (weeklyFocus.length >= 5) badges.push({ name: "Focus Champion", icon: "🧠" });

    // Consistency King: ≥90% weekly consistency
    if (weeklyConsistency >= 90) badges.push({ name: "Consistency King", icon: "👑" });

    // Most Improved: if this week's rate > last week's by 20%+
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 13);
    const lastWeekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(lastWeekStart);
        d.setDate(lastWeekStart.getDate() + i);
        lastWeekDates.push(formatDate(d));
    }
    const lastWeekCompletions = lastWeekDates.reduce((sum, date) => {
        return sum + goodHabits.filter((h) => h.completions?.[date]).length;
    }, 0);
    const lastWeekRate = goodHabits.length > 0 ? lastWeekCompletions / (goodHabits.length * 7) : 0;
    const thisWeekRate = goodHabits.length > 0 ? weeklyCompletions / (goodHabits.length * 7) : 0;
    if (thisWeekRate - lastWeekRate >= 0.2) badges.push({ name: "Most Improved", icon: "📈" });

    return {
        weeklyCompletions,
        weeklyConsistency,
        weeklyFocusSessions: weeklyFocus.length,
        badges,
        improvement: Math.round((thisWeekRate - lastWeekRate) * 100),
    };
}

// =============== MONTHLY HEATMAP DATA ===============
/** Returns 30 days of habit completion intensity for GitHub-style heatmap */
export function getMonthlyHeatmapData(habits, focusSessions = []) {
    const today = new Date();
    const days = [];

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat

        const totalHabits = habits.length;
        const completed = totalHabits > 0
            ? habits.filter((h) => h.completions?.[dateStr]).length
            : 0;
        const pct = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;

        // Intensity: 0 = none, 1 = <25%, 2 = <50%, 3 = <75%, 4 = >=75%
        const intensity = pct === 0 ? 0 : pct < 25 ? 1 : pct < 50 ? 2 : pct < 75 ? 3 : 4;

        // Focus sessions count for that day
        const focusCount = focusSessions.filter((s) => s.date === dateStr).length;
        const focusIntensity = focusCount === 0 ? 0 : focusCount === 1 ? 2 : focusCount >= 2 ? 4 : 1;

        days.push({ date: dateStr, dayOfWeek, completed, totalHabits, pct, intensity, focusCount, focusIntensity });
    }

    return days;
}
