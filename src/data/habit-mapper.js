import { normalizeJourneyLength } from "../domain/habits.js";

export function mapEventRow(row) {
  return {
    id: row.id,
    date: row.event_date,
    at: row.occurred_at,
    outcome: row.outcome,
    reflection: row.reflection,
    adjustment: row.adjustment
  };
}

export function mapHabitRow(row) {
  return {
    id: row.id,
    name: row.name,
    why: row.why,
    cue: row.cue,
    action: row.action,
    minimum: row.minimum,
    durationDays: normalizeJourneyLength(row.duration_days),
    createdAt: row.created_at,
    events: (row.habit_events || []).map(mapEventRow)
  };
}

export function toHabitRow(values) {
  return {
    name: values.name,
    why: values.why,
    cue: values.cue,
    action: values.action,
    minimum: values.minimum,
    duration_days: normalizeJourneyLength(values.durationDays)
  };
}
