import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, gardenStage, habitPhase, journeyDate, journeyDay, latestAutomaticity, practiceSummary, recoveryCount, successfulDates, totalGrowth } from "./core.js";

const localDate = (year, month, day) => new Date(year, month - 1, day, 12);
const event = (outcome, reflection = "") => ({ outcome, reflection });

test("dateKey emits a stable local calendar date", () => {
  assert.equal(dateKey(localDate(2026, 7, 20)), "2026-07-20");
});

test("90-day journeys map day numbers to local dates", () => {
  const start = localDate(2026, 7, 20);
  assert.equal(dateKey(journeyDate(start, 1)), "2026-07-20");
  assert.equal(dateKey(journeyDate(start, 10)), "2026-07-29");
  assert.equal(journeyDay(start, localDate(2026, 7, 20)), 1);
  assert.equal(journeyDay(start, localDate(2026, 7, 29)), 10);
  assert.equal(journeyDay(start, localDate(2027, 1, 1)), 91);
});

test("successful dates are unique and only include achieved habits", () => {
  assert.deepEqual([...successfulDates([
    { date: "2026-07-20", outcome: "done" },
    { date: "2026-07-20", outcome: "done" },
    { date: "2026-07-21", outcome: "missed" }
  ])], ["2026-07-20"]);
});

test("practice summary counts healthy opportunities without streak logic", () => {
  assert.deepEqual(practiceSummary([event("done"), event("missed"), event("done")]), {
    successes: 2, lapses: 1, reflected: 0, opportunities: 3, rate: 67
  });
});

test("replacement outcomes use the same opportunity summary", () => {
  assert.deepEqual(practiceSummary([event("replaced"), event("lapse", "I was tired")]), {
    successes: 1, lapses: 1, reflected: 1, opportunities: 2, rate: 50
  });
});

test("empty opportunity history has no misleading percentage", () => {
  assert.equal(practiceSummary([]).rate, null);
});

test("latestAutomaticity ignores invalid values and returns latest valid rating", () => {
  assert.equal(latestAutomaticity([{ rating: 3 }, { rating: 8 }]), 8);
  assert.equal(latestAutomaticity([{ rating: 0 }, { rating: 12 }]), null);
});

test("habit phases reflect practice and self-reported ease", () => {
  assert.equal(habitPhase({ events: [] }).key, "prepare");
  assert.equal(habitPhase({ events: [event("done")] }).key, "practice");
  assert.equal(habitPhase({ events: Array.from({ length: 10 }, () => event("done")) }).key, "strengthen");
  assert.equal(habitPhase({ events: Array.from({ length: 30 }, () => event("done")), checkIns: [{ rating: 8 }] }).key, "stabilize");
  assert.equal(habitPhase({ maintaining: true }).key, "maintain");
});

test("garden stage grows with successful real-world practice", () => {
  assert.equal(gardenStage(0).name, "Quiet soil");
  assert.equal(gardenStage(5).name, "New shoots");
  assert.equal(gardenStage(60).name, "Deep roots");
  assert.equal(gardenStage(-20).name, "Quiet soil");
});

test("total growth counts practices and replacements but not lapses", () => {
  const habits = [{ events: [event("done"), event("missed")] }];
  const patterns = [{ events: [event("replaced"), event("lapse")] }];
  assert.equal(totalGrowth(habits, patterns), 2);
});

test("recovery count requires a useful reflection", () => {
  const habits = [{ events: [event("missed", "Cue changed"), event("done")] }];
  const patterns = [{ events: [event("lapse", ""), event("lapse", "Stress spike")] }];
  assert.equal(recoveryCount(habits, patterns), 2);
});
