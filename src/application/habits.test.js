import test from "node:test";
import assert from "node:assert/strict";
import { createHabitService } from "./habits.js";

test("habit service toggles events through the repository contract", async () => {
  const calls = [];
  const repository = {
    createEvent: async (habitId, date) => {
      calls.push(["create", habitId, date]);
      return { id: "event-1", date, at: "", outcome: "done", reflection: "", adjustment: "" };
    },
    deleteEvent: async (eventId) => calls.push(["delete", eventId])
  };
  const habit = {
    id: "habit-1",
    durationDays: 2,
    createdAt: "2026-07-30T12:00:00.000Z",
    events: []
  };
  const service = createHabitService(repository, {
    now: () => new Date("2026-07-30T12:00:00.000Z")
  });

  assert.equal((await service.toggleDay(habit, 1)).kind, "added");
  assert.deepEqual(calls[0], ["create", "habit-1", "2026-07-30"]);
  assert.equal(habit.events.length, 1);

  assert.equal((await service.toggleDay(habit, 1)).kind, "removed");
  assert.deepEqual(calls[1], ["delete", "event-1"]);
  assert.equal(habit.events.length, 0);
});

test("habit service rejects shrinking a practice", async () => {
  const service = createHabitService({ update: async () => assert.fail("repository must not be called") });
  await assert.rejects(
    service.update({ id: "habit-1", durationDays: 14, events: [] }, { durationDays: 7 }),
    RangeError
  );
});
