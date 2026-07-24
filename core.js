export function dateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

export function journeyDate(start, day) {
  const date = new Date(start);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + Math.max(0, Number(day) - 1));
  return date;
}

export function journeyDay(start, today = new Date(), length = 90) {
  const first = new Date(start);
  const current = new Date(today);
  const firstDay = Date.UTC(first.getFullYear(), first.getMonth(), first.getDate());
  const currentDay = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  const elapsed = Math.floor((currentDay - firstDay) / 86400000) + 1;
  return Math.max(1, Math.min(Number(length) + 1, elapsed));
}

export function successfulDates(events = []) {
  return new Set((Array.isArray(events) ? events : [])
    .filter((event) => event?.outcome === "done")
    .map((event) => event.date)
    .filter(Boolean));
}

export function practiceSummary(events = []) {
  const safe = Array.isArray(events) ? events : [];
  const successes = safe.filter((event) => event?.outcome === "done" || event?.outcome === "replaced").length;
  const lapses = safe.filter((event) => event?.outcome === "missed" || event?.outcome === "lapse").length;
  const reflected = safe.filter((event) => event?.reflection?.trim()).length;
  const opportunities = successes + lapses;
  return {
    successes,
    lapses,
    reflected,
    opportunities,
    rate: opportunities ? Math.round((successes / opportunities) * 100) : null
  };
}

export function latestAutomaticity(checkIns = []) {
  const valid = (Array.isArray(checkIns) ? checkIns : [])
    .map((item) => Number(item?.rating))
    .filter((rating) => rating >= 1 && rating <= 10);
  return valid.length ? valid.at(-1) : null;
}

export function habitPhase(habit = {}) {
  if (habit.maintaining) return { key: "maintain", label: "Maintaining", hint: "Use lighter check-ins and keep the cue available." };
  const { successes } = practiceSummary(habit.events);
  const automaticity = latestAutomaticity(habit.checkIns);
  if (!successes) return { key: "prepare", label: "Prepared", hint: "Meet the cue and try the minimum version once." };
  if (successes < 10) return { key: "practice", label: "Practicing", hint: "Repeat in the same context; consistency matters more than intensity." };
  if (successes >= 30 && automaticity >= 8) return { key: "stabilize", label: "Stabilizing", hint: "It feels easier. Keep supporting it without forcing perfection." };
  return { key: "strengthen", label: "Strengthening", hint: "Keep rehearsing the cue–action link and adjust friction." };
}

export function gardenStage(growth = 0) {
  const value = Math.max(0, Number(growth) || 0);
  const stages = [
    { min: 0, name: "Quiet soil", icon: "·", message: "Your garden is ready for its first real-world practice." },
    { min: 1, name: "First seed", icon: "◉", message: "One small action has started something." },
    { min: 5, name: "New shoots", icon: "♧", message: "Repetition is helping the roots take hold." },
    { min: 15, name: "Growing garden", icon: "♣", message: "Your repeated actions are becoming a living pattern." },
    { min: 30, name: "Flourishing", icon: "✿", message: "The garden reflects steady practice—not perfection." },
    { min: 60, name: "Deep roots", icon: "❉", message: "Strong routines can still be tended gently." }
  ];
  return stages.filter((stage) => value >= stage.min).at(-1);
}

export function totalGrowth(habits = [], patterns = []) {
  const habitPractice = habits.reduce((total, habit) => total + practiceSummary(habit.events).successes, 0);
  const replacements = patterns.reduce((total, pattern) => total + practiceSummary(pattern.events).successes, 0);
  return habitPractice + replacements;
}

export function recoveryCount(habits = [], patterns = []) {
  return [...habits, ...patterns].reduce(
    (total, item) => total + (item.events || []).filter((event) => event?.reflection?.trim()).length,
    0
  );
}
