import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarDayOffset,
  dateKey,
  groupHabitsByDuration,
  habitStart,
  habitTimeline,
  isJourneyActive,
  isWeekStart,
  journeyDate,
  journeyDay,
  journeyProgress,
  normalizeJourneyLength,
  successfulDates
} from "./habits.js";

const localDate = (year, month, day) => new Date(year, month - 1, day, 12);

test("dateKey emits a stable local calendar date", () => {
  assert.equal(dateKey(localDate(2026, 7, 20)), "2026-07-20");
});

test("habitStart falls back when persisted input is invalid", () => {
  const fallback = localDate(2026, 7, 20);
  assert.equal(habitStart({ createdAt: "invalid" }, fallback).valueOf(), fallback.valueOf());
});

test("journeys map day numbers to local dates", () => {
  const start = localDate(2026, 7, 20);
  assert.equal(dateKey(journeyDate(start, 1)), "2026-07-20");
  assert.equal(dateKey(journeyDate(start, 10)), "2026-07-29");
  assert.equal(journeyDay(start, localDate(2026, 7, 20)), 1);
  assert.equal(journeyDay(start, localDate(2026, 7, 29)), 10);
  assert.equal(journeyDay(start, localDate(2027, 1, 1)), 91);
});

test("calendar offsets align journey days", () => {
  const start = localDate(2026, 7, 20);
  assert.equal(calendarDayOffset(start, localDate(2026, 7, 19)), -1);
  assert.equal(calendarDayOffset(start, localDate(2026, 7, 20)), 0);
  assert.equal(calendarDayOffset(start, localDate(2026, 7, 27)), 7);
});

test("journeys are active only from their start through their final day", () => {
  const start = localDate(2026, 7, 20);
  assert.equal(isJourneyActive(start, localDate(2026, 7, 19), 7), false);
  assert.equal(isJourneyActive(start, localDate(2026, 7, 20), 7), true);
  assert.equal(isJourneyActive(start, localDate(2026, 7, 26), 7), true);
  assert.equal(isJourneyActive(start, localDate(2026, 7, 27), 7), false);
});

test("habit timelines preserve blank calendar slots before later starts", () => {
  const timeline = habitTimeline([
    { createdAt: localDate(2026, 7, 29), durationDays: 7 },
    { createdAt: localDate(2026, 7, 30), durationDays: 7 }
  ]);
  assert.equal(dateKey(timeline.start), "2026-07-29");
  assert.equal(timeline.length, 8);
});

test("calendar weeks are divided before Sunday", () => {
  assert.equal(isWeekStart(localDate(2026, 8, 1)), false);
  assert.equal(isWeekStart(localDate(2026, 8, 2)), true);
});

test("habits group by normalized practice length in ascending order", () => {
  const habits = [
    { id: "a", durationDays: 14 },
    { id: "b", durationDays: 7 },
    { id: "c", durationDays: "14" }
  ];
  assert.deepEqual(groupHabitsByDuration(habits), [
    { durationDays: 7, habits: [habits[1]] },
    { durationDays: 14, habits: [habits[0], habits[2]] }
  ]);
});

test("journey lengths accept whole days within safe bounds", () => {
  assert.equal(normalizeJourneyLength(30), 30);
  assert.equal(normalizeJourneyLength("120"), 120);
  assert.equal(normalizeJourneyLength(0), 1);
  assert.equal(normalizeJourneyLength(5000), 3650);
  assert.equal(normalizeJourneyLength("not a number"), 90);
});

test("successful dates are unique and include only achieved events", () => {
  assert.deepEqual([...successfulDates([
    { date: "2026-07-20", outcome: "done" },
    { date: "2026-07-20", outcome: "done" },
    { date: "2026-07-21", outcome: "missed" }
  ])], ["2026-07-20"]);
});

test("journey progress counts only events inside the practice window", () => {
  const habit = {
    createdAt: localDate(2026, 7, 20),
    durationDays: 3,
    events: [
      { date: "2026-07-20", outcome: "done" },
      { date: "2026-07-22", outcome: "done" },
      { date: "2026-07-23", outcome: "done" }
    ]
  };
  assert.deepEqual(journeyProgress(habit, localDate(2026, 7, 23)), {
    achieved: 2,
    length: 3,
    rate: 67,
    isComplete: true,
    completedAt: localDate(2026, 7, 22)
  });
});

test("checking the final day completes a practice immediately", () => {
  const start = localDate(2026, 7, 28);
  const habit = { createdAt: start, durationDays: 1, events: [] };
  assert.equal(journeyProgress(habit, start).isComplete, false);
  habit.events.push({ date: "2026-07-28", outcome: "done" });
  assert.equal(journeyProgress(habit, start).isComplete, true);
});

test("an unchecked practice completes after its final calendar day", () => {
  const habit = { createdAt: localDate(2026, 7, 20), durationDays: 3, events: [] };
  assert.equal(journeyProgress(habit, localDate(2026, 7, 22)).isComplete, false);
  assert.equal(journeyProgress(habit, localDate(2026, 7, 23)).isComplete, true);
});
