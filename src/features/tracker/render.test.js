import test from "node:test";
import assert from "node:assert/strict";
import { trackerMarkup } from "./render.js";

const today = new Date(2026, 6, 30, 12);

test("tracker markup groups practices and escapes user content", () => {
  const markup = trackerMarkup([{
    id: "habit-1",
    name: "<Read & learn>",
    why: "",
    cue: "After lunch",
    action: "Read",
    minimum: "One page",
    durationDays: 7,
    createdAt: today.toISOString(),
    events: []
  }], today);

  assert.match(markup, /7-day practices/);
  assert.match(markup, /&lt;Read &amp; learn&gt;/);
  assert.match(markup, /data-toggle-day="1"/);
  assert.doesNotMatch(markup, /<Read & learn>/);
});

test("tracker markup marks completed dates as pressed", () => {
  const markup = trackerMarkup([{
    id: "habit-1",
    name: "Read",
    why: "",
    cue: "After lunch",
    action: "Read",
    minimum: "One page",
    durationDays: 1,
    createdAt: today.toISOString(),
    events: [{
      id: "event-1",
      date: "2026-07-30",
      at: today.toISOString(),
      outcome: "done",
      reflection: "",
      adjustment: ""
    }]
  }], today);

  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /achieved/);
});
