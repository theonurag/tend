import test from "node:test";
import assert from "node:assert/strict";
import { mapHabitRow, toHabitRow } from "./habit-mapper.js";
import { createLocalHabitRepository } from "./local-habit-repository.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
}

test("database rows map to the domain naming convention", () => {
  assert.deepEqual(mapHabitRow({
    id: "habit-1",
    name: "Read",
    why: "Learn",
    cue: "After lunch",
    action: "Read a book",
    minimum: "One page",
    duration_days: 7,
    created_at: "2026-07-30T00:00:00.000Z",
    habit_events: [{
      id: "event-1",
      event_date: "2026-07-30",
      occurred_at: "2026-07-30T01:00:00.000Z",
      outcome: "done",
      reflection: "",
      adjustment: ""
    }]
  }), {
    id: "habit-1",
    name: "Read",
    why: "Learn",
    cue: "After lunch",
    action: "Read a book",
    minimum: "One page",
    durationDays: 7,
    createdAt: "2026-07-30T00:00:00.000Z",
    events: [{
      id: "event-1",
      date: "2026-07-30",
      at: "2026-07-30T01:00:00.000Z",
      outcome: "done",
      reflection: "",
      adjustment: ""
    }]
  });
});

test("domain values map to writable database columns only", () => {
  assert.deepEqual(toHabitRow({
    name: "Read",
    why: "Learn",
    cue: "After lunch",
    action: "Read",
    minimum: "One page",
    durationDays: 14
  }), {
    name: "Read",
    why: "Learn",
    cue: "After lunch",
    action: "Read",
    minimum: "One page",
    duration_days: 14
  });
});

test("local repository implements the habit lifecycle contract", async () => {
  const storage = memoryStorage();
  let id = 0;
  const repository = createLocalHabitRepository({
    storage,
    storageKey: "test",
    createId: () => `id-${++id}`,
    now: () => new Date("2026-07-30T12:00:00.000Z")
  });
  const values = {
    name: "Read",
    why: "Learn",
    cue: "After lunch",
    action: "Read",
    minimum: "One page",
    durationDays: 7
  };

  const habit = await repository.create(values);
  assert.equal((await repository.list()).length, 1);
  assert.equal(habit.id, "id-1");

  const event = await repository.createEvent(habit.id, "2026-07-30");
  assert.equal((await repository.list())[0].events.length, 1);

  await repository.deleteEvent(event.id);
  assert.equal((await repository.list())[0].events.length, 0);

  const updated = await repository.update(habit.id, { ...values, name: "Read more", durationDays: 14 });
  assert.equal(updated.durationDays, 14);

  await repository.deleteHabit(habit.id);
  assert.deepEqual(await repository.list(), []);
});

test("local repository reset clears all habits", async () => {
  const repository = createLocalHabitRepository({
    storage: memoryStorage(),
    storageKey: "test",
    createId: () => "id",
    now: () => new Date("2026-07-30T12:00:00.000Z")
  });
  await repository.create({
    name: "Read",
    why: "",
    cue: "After lunch",
    action: "Read",
    minimum: "One page",
    durationDays: 7
  });
  await repository.reset();
  assert.deepEqual(await repository.list(), []);
});
