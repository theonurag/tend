export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function habitStart(habit, fallback = new Date()) {
  const parsed = new Date(habit?.createdAt);
  return Number.isNaN(parsed.valueOf()) ? new Date(fallback) : parsed;
}

export function journeyDate(start, day) {
  const date = new Date(start);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + Math.max(0, Number(day) - 1));
  return date;
}

export function calendarDayOffset(start, target) {
  const first = new Date(start);
  const current = new Date(target);
  const firstDay = Date.UTC(first.getFullYear(), first.getMonth(), first.getDate());
  const currentDay = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  return Math.floor((currentDay - firstDay) / 86400000);
}

export function journeyDay(start, today = new Date(), length = 90) {
  const elapsed = calendarDayOffset(start, today) + 1;
  return Math.max(1, Math.min(Number(length) + 1, elapsed));
}

export function isJourneyActive(start, today = new Date(), length = 90) {
  const offset = calendarDayOffset(start, today);
  return offset >= 0 && offset < Number(length);
}

export function isWeekStart(date) {
  return date.getDay() === 0;
}

export function habitTimeline(habits = [], fallback = new Date()) {
  const windows = (Array.isArray(habits) ? habits : []).map((habit) => {
    const parsed = new Date(habit?.createdAt);
    const start = journeyDate(Number.isNaN(parsed.valueOf()) ? fallback : parsed, 1);
    return {
      start,
      end: journeyDate(start, normalizeJourneyLength(habit?.durationDays))
    };
  });
  if (!windows.length) return { start: journeyDate(fallback, 1), length: 0 };
  const start = new Date(Math.min(...windows.map((window) => window.start.valueOf())));
  const end = new Date(Math.max(...windows.map((window) => window.end.valueOf())));
  return { start, length: calendarDayOffset(start, end) + 1 };
}

export function groupHabitsByDuration(habits = []) {
  const groups = new Map();
  for (const habit of Array.isArray(habits) ? habits : []) {
    const durationDays = normalizeJourneyLength(habit?.durationDays);
    if (!groups.has(durationDays)) groups.set(durationDays, []);
    groups.get(durationDays).push(habit);
  }
  return [...groups.entries()]
    .sort(([first], [second]) => first - second)
    .map(([durationDays, groupedHabits]) => ({ durationDays, habits: groupedHabits }));
}

export function normalizeJourneyLength(value, fallback = 90) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(1, Math.min(3650, parsed));
}

export function successfulDates(events = []) {
  return new Set((Array.isArray(events) ? events : [])
    .filter((event) => event?.outcome === "done")
    .map((event) => event.date)
    .filter(Boolean));
}

export function journeyProgress(habit = {}, today = new Date()) {
  const length = normalizeJourneyLength(habit.durationDays);
  const start = habitStart(habit, today);
  const completed = successfulDates(habit.events);
  const finalDate = dateKey(journeyDate(start, length));
  const dayOffset = calendarDayOffset(start, today);
  const achieved = Array.from({ length }, (_, index) => dateKey(journeyDate(start, index + 1)))
    .filter((key) => completed.has(key)).length;
  return {
    achieved,
    length,
    rate: Math.round((achieved / length) * 100),
    isComplete: dayOffset >= length || (dayOffset === length - 1 && completed.has(finalDate)),
    completedAt: journeyDate(start, length)
  };
}
