const GEMINI_API_KEY = "AIzaSyCrunxtsdVsXOEJntMZs1gJ0KsgMsikeIM";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are an expert in behavioral psychology and habit formation. Design adaptive habit plans using Tiny Habits methodology with gradual overload (max 40% increase between phases), consistency before intensity, and >80% adherence probability.

Rules:
- Start extremely small (minimum viable action)
- Never increase effort more than 40% between phases
- Phase 4 must be sustainable long-term
- For BREAK goals, include replacement behavior
- Include psychological rationale for each phase
- Anticipate common resistance points
- Suggest environment design and habit stacking

Respond with ONLY a raw JSON object (no markdown, no code fences, no explanation). The JSON must include: goal (with type, title, end_date, estimated_success_probability, confidence_level, psychological_rationale), phases array of 4 objects (each with phase, name, min_duration_days, max_duration_days, daily_target, estimated_time_minutes, why_this_level, common_resistance, environment_design, progression_rule, success_criteria, milestone_reward), adaptation_rules (miss_rule, success_rule, plateau_rule), break_goal_support (replacement_behavior, avoidance_tracking, trigger_strategy).`;

export async function generateHabitPlan(userInput) {
    const userPrompt = `Generate a progressive habit plan for:
Type: ${userInput.type}
Title: ${userInput.title}
End Date: ${userInput.endDate}
Ability: ${userInput.abilityLevel}
Current Frequency: ${userInput.currentFrequency}
Available Time: ${userInput.availableTime} minutes/day
Days Per Week: ${userInput.daysPerWeek}
Motivation: ${userInput.motivation}
Success Definition: ${userInput.successDefinition || "Consistent daily practice"}
${userInput.constraints ? "Constraints: " + userInput.constraints : ""}
Return ONLY the JSON object.`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errMsg = errorData.error?.message || `API error: ${response.status}`;
            if (response.status === 429 || errMsg.includes("quota") || errMsg.includes("rate")) {
                return { success: true, plan: generateLocalPlan(userInput), source: "local" };
            }
            throw new Error(errMsg);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return { success: true, plan: generateLocalPlan(userInput), source: "local" };

        let jsonStr = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
        const firstBrace = jsonStr.indexOf("{");
        const lastBrace = jsonStr.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1) return { success: true, plan: generateLocalPlan(userInput), source: "local" };
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
            .replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
            .replace(/\u2014/g, "-").replace(/\u2013/g, "-");

        const plan = JSON.parse(jsonStr);
        if (!plan.goal || !plan.phases || plan.phases.length < 4) return { success: true, plan: generateLocalPlan(userInput), source: "local" };

        // Ensure enriched fields exist (fill gaps from Gemini)
        plan.goal.psychological_rationale = plan.goal.psychological_rationale || "Progressive overload builds neural pathways through consistent small wins.";
        plan.phases.forEach((p, i) => {
            p.why_this_level = p.why_this_level || PHASE_WHY[i];
            p.common_resistance = p.common_resistance || PHASE_RESISTANCE[i];
            p.environment_design = p.environment_design || PHASE_ENV[i];
            p.milestone_reward = p.milestone_reward || PHASE_REWARDS[i];
        });

        return { success: true, plan, source: "gemini" };
    } catch (error) {
        console.error("AI Plan generation failed, using local fallback:", error);
        return { success: true, plan: generateLocalPlan(userInput), source: "local" };
    }
}

// Generate plan for an existing habit (used by HabitPlanView)
export function generateHabitDetailPlan(habit, state) {
    const input = {
        type: habit.type === "good" ? "build" : "break",
        title: habit.name,
        endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        abilityLevel: "some experience",
        currentFrequency: "sometimes",
        availableTime: habit.difficulty === "easy" ? 15 : habit.difficulty === "hard" ? 45 : 30,
        daysPerWeek: 5,
        motivation: "medium",
        successDefinition: `Maintain ${habit.name} consistently`,
        constraints: "",
    };
    return generateLocalPlan(input);
}

// ============================================================
// ENRICHED PHASE DATA
// ============================================================
const PHASE_WHY = [
    "The brain needs proof this is safe and achievable. Micro-actions bypass the prefrontal cortex's threat detection, establishing the behavior as non-threatening.",
    "Neural pathways are forming. Repetition at moderate intensity solidifies the habit loop (cue → routine → reward) without triggering burnout.",
    "The behavior is becoming automatic. This phase leverages procedural memory formation — consistency here is what makes the habit stick permanently.",
    "Full integration. The behavior is now part of your identity. Maintaining this level sustains neuroplastic gains and prevents regression.",
];

const PHASE_RESISTANCE = [
    "Feeling it's 'too easy' or 'not worth it'. The ego wants bigger action, but the brain needs small wins first.",
    "Boredom and plateauing motivation. The novelty has worn off but automaticity hasn't formed yet — this is the fragile middle.",
    "Life disruptions and overconfidence. You may feel 'you've got this' and skip days, or external stress competes for energy.",
    "Complacency and identity drift. Long-term maintenance requires reconnecting with why this habit matters to who you're becoming.",
];

const PHASE_ENV = [
    "Place your cue in the path of least resistance. Put items visible, set phone reminders, stack after an existing habit (e.g., 'After I pour coffee, I will...').",
    "Remove friction further: pre-prepare materials the night before. Add a visual tracker where you see it daily.",
    "Design your environment to make the habit the default. Remove competing triggers. Share your commitment with someone.",
    "Automate the environment: calendar blocks, prepared spaces, social accountability. Make NOT doing the habit harder than doing it.",
];

const PHASE_REWARDS = [
    "+25 coins for completing Phase 1",
    "+50 coins + 'Momentum Builder' badge",
    "+100 coins + 'Consistency Champion' badge",
    "+200 coins + 'Atomic Identity' badge + Vault bonus unlock",
];

// ============================================================
// LOCAL FALLBACK PLAN GENERATOR
// ============================================================
function generateLocalPlan(input) {
    const { type, title, endDate, abilityLevel, currentFrequency, availableTime, daysPerWeek, motivation, successDefinition } = input;
    const totalTime = parseInt(availableTime) || 30;
    const isBuild = type === "build";

    const phase1Time = Math.max(2, Math.round(totalTime * 0.2));
    const phase2Time = Math.max(5, Math.round(phase1Time * 1.4));
    const phase3Time = Math.max(10, Math.round(phase2Time * 1.35));
    const phase4Time = Math.min(totalTime, Math.round(phase3Time * 1.3));

    const abilityMultiplier = abilityLevel === "advanced" ? 0.7 : abilityLevel === "some experience" ? 0.85 : 1;
    const freqMultiplier = currentFrequency === "often" ? 0.6 : currentFrequency === "sometimes" ? 0.8 : currentFrequency === "rarely" ? 0.9 : 1;
    const durationScale = abilityMultiplier * freqMultiplier;

    const baseProb = 70;
    const prob = Math.min(95, baseProb
        + (abilityLevel === "advanced" ? 12 : abilityLevel === "some experience" ? 8 : 0)
        + (currentFrequency === "often" ? 10 : currentFrequency === "sometimes" ? 5 : 0)
        + (motivation === "high" ? 8 : motivation === "medium" ? 4 : 0));

    const confidence = prob >= 85 ? "High" : prob >= 75 ? "Medium" : "Low";
    const targets = generateTargets(title, isBuild, phase1Time, phase2Time, phase3Time, phase4Time);

    return {
        goal: {
            type: isBuild ? "build" : "break",
            title,
            end_date: endDate,
            estimated_success_probability: `${prob}%`,
            confidence_level: confidence,
            psychological_rationale: isBuild
                ? "Progressive overload leverages neuroplasticity — small consistent actions build neural pathways that eventually automate the behavior, making it effortless."
                : "Breaking habits requires rewiring trigger-response loops. Gradual replacement weakens old pathways while building new ones through counter-conditioning.",
        },
        phases: [
            {
                phase: 1, name: "Starting Out",
                min_duration_days: Math.max(5, Math.round(7 * durationScale)),
                max_duration_days: Math.max(7, Math.round(14 * durationScale)),
                daily_target: targets[0], estimated_time_minutes: phase1Time,
                why_this_level: PHASE_WHY[0], common_resistance: PHASE_RESISTANCE[0],
                environment_design: PHASE_ENV[0], milestone_reward: PHASE_REWARDS[0],
                progression_rule: `Complete ${Math.max(3, daysPerWeek - 2)} days this week to advance`,
                success_criteria: `Do the minimum ${phase1Time}-min action ${Math.max(3, daysPerWeek - 2)} out of 7 days`,
            },
            {
                phase: 2, name: "Familiar",
                min_duration_days: Math.max(7, Math.round(10 * durationScale)),
                max_duration_days: Math.max(10, Math.round(18 * durationScale)),
                daily_target: targets[1], estimated_time_minutes: phase2Time,
                why_this_level: PHASE_WHY[1], common_resistance: PHASE_RESISTANCE[1],
                environment_design: PHASE_ENV[1], milestone_reward: PHASE_REWARDS[1],
                progression_rule: `Complete ${Math.max(4, daysPerWeek - 1)} days per week consistently`,
                success_criteria: `Sustain ${phase2Time} min/day for ${Math.max(4, daysPerWeek - 1)} days/week for 2 weeks`,
            },
            {
                phase: 3, name: "Consistent",
                min_duration_days: Math.max(10, Math.round(14 * durationScale)),
                max_duration_days: Math.max(14, Math.round(24 * durationScale)),
                daily_target: targets[2], estimated_time_minutes: phase3Time,
                why_this_level: PHASE_WHY[2], common_resistance: PHASE_RESISTANCE[2],
                environment_design: PHASE_ENV[2], milestone_reward: PHASE_REWARDS[2],
                progression_rule: `Complete ${daysPerWeek} days per week at full effort`,
                success_criteria: `${phase3Time} min/day on ${daysPerWeek} days/week for 3 consecutive weeks`,
            },
            {
                phase: 4, name: "Goal Achiever",
                min_duration_days: Math.max(14, Math.round(21 * durationScale)),
                max_duration_days: Math.max(21, Math.round(30 * durationScale)),
                daily_target: targets[3], estimated_time_minutes: phase4Time,
                why_this_level: PHASE_WHY[3], common_resistance: PHASE_RESISTANCE[3],
                environment_design: PHASE_ENV[3], milestone_reward: PHASE_REWARDS[3],
                progression_rule: "Maintain until end_date",
                success_criteria: successDefinition || `Sustain ${phase4Time} min/day, ${daysPerWeek} days/week consistently`,
            },
        ],
        adaptation_rules: {
            miss_rule: "If 2 consecutive misses → drop one level and reduce effort by 20%, show a support tip",
            success_rule: "If 5 consecutive successes → increase effort by up to 20%",
            plateau_rule: "If 10 successes with low effort perception → suggest progression",
        },
        break_goal_support: isBuild
            ? { replacement_behavior: null, avoidance_tracking: null, trigger_strategy: null }
            : {
                replacement_behavior: generateReplacement(title),
                avoidance_tracking: "Track consecutive days resisted",
                trigger_strategy: "When urge strikes, perform replacement behavior for 2 minutes",
            },
    };
}

function generateTargets(title, isBuild, t1, t2, t3, t4) {
    const t = title.toLowerCase();
    if (isBuild) {
        if (/read/i.test(t)) return [`Read for ${t1} min (even 1 page counts)`, `Read for ${t2} min with focus`, `Read for ${t3} min and take 1 note`, `Read for ${t4} min with active note-taking`];
        if (/exercise|workout|gym|run|jog|walk/i.test(t)) return [`${t1} min light movement or stretching`, `${t2}-min bodyweight routine`, `Full ${t3}-min workout session`, `${t4}-min focused training`];
        if (/meditat|mindful|breath/i.test(t)) return [`Sit and breathe for ${t1} min`, `Guided meditation ${t2} min`, `Unguided meditation ${t3} min`, `Deep meditation ${t4} min`];
        if (/study|learn|course|practice|code|programming/i.test(t)) return [`Review material for ${t1} min`, `Active study ${t2} min`, `Deep study ${t3} min with practice`, `Full study ${t4} min with review`];
        if (/writ|journal|diary|blog/i.test(t)) return [`Write for ${t1} min (even 1 sentence)`, `Write ${t2} min focused`, `Write ${t3} min with editing`, `Complete ${t4}-min writing session`];
    } else {
        if (/smok/i.test(t)) return [`Delay smoking by ${t1} min`, `Replace ${Math.ceil(t2 / 5)} cigarettes with breathing`, `Resist for first ${t3} min of each craving`, `Stay smoke-free all day`];
        if (/social media|phone|screen|scroll/i.test(t)) return [`Delay phone for ${t1} min after waking`, `Phone away for ${t2}-min blocks`, `Limit to ${Math.max(2, Math.ceil(t3 / 10))} check-ins/day`, `Only check during ${t4}-min windows`];
    }
    if (isBuild) return [`Start with just ${t1} min of "${title}"`, `Practice "${title}" for ${t2} min`, `${t3} min of focused "${title}"`, `Full ${t4}-min "${title}" session`];
    return [`Resist "${title}" for ${t1} min when triggered`, `Avoid "${title}" for ${t2}-min blocks`, `Stay free from "${title}" for ${t3}+ min daily`, `Full-day avoidance of "${title}"`];
}

function generateReplacement(title) {
    const t = title.toLowerCase();
    if (/smok/i.test(t)) return "Take 10 deep breaths or chew gum";
    if (/social media|phone|scroll/i.test(t)) return "Pick up a book or journal for 2 minutes";
    if (/sugar|junk|snack|eat/i.test(t)) return "Drink water and eat a fruit";
    if (/procrast/i.test(t)) return "Set a 2-minute timer and start the smallest task";
    return "Take 5 deep breaths and do a 2-minute walk";
}
