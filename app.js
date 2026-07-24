import { dateKey, journeyDate, journeyDay, successfulDates } from "./core.js?v=10";

const STORAGE_KEY = "tend-v1";
const JOURNEY_LENGTH = 90;
const $ = (selector, root = document) => root.querySelector(selector);
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const starterState = { version: 1, habits: [], patterns: [] };
let toastTimer;
let activeHabitId = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.version === 1 && Array.isArray(saved.habits)) {
      saved.patterns ??= [];
      return saved;
    }
  } catch { /* start fresh if browser storage is unavailable or malformed */ }
  return clone(starterState);
}

let state = loadState();
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

function escapeHTML(value = "") {
  const node = document.createElement("div");
  node.textContent = String(value);
  return node.innerHTML;
}

function showToast(message, tone = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function parseStart(habit) {
  const parsed = new Date(habit.createdAt);
  return Number.isNaN(parsed.valueOf()) ? new Date() : parsed;
}

function formatStart(value) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function renderHead() {
  const dayCells = Array.from({ length: JOURNEY_LENGTH }, (_, index) => {
    const day = index + 1;
    return `<th scope="col" class="day-heading ${day % 7 === 1 && day > 1 ? "week-start" : ""}"><span>${day}</span></th>`;
  }).join("");
  $("#matrixHead").innerHTML = `<tr><th scope="col" class="habit-heading"><span>Habit</span></th><th scope="col" class="score-heading"><span>Done</span></th>${dayCells}</tr>`;
}

function habitRow(habit) {
  const start = parseStart(habit);
  const today = new Date();
  const currentDay = journeyDay(start, today, JOURNEY_LENGTH);
  const completed = successfulDates(habit.events);
  const completedInJourney = Array.from({ length: JOURNEY_LENGTH }, (_, index) => dateKey(journeyDate(start, index + 1))).filter((key) => completed.has(key)).length;
  const cells = Array.from({ length: JOURNEY_LENGTH }, (_, index) => {
    const day = index + 1;
    const key = dateKey(journeyDate(start, day));
    const done = completed.has(key);
    const future = day > currentDay;
    const isToday = day === currentDay && currentDay <= JOURNEY_LENGTH;
    const label = `${habit.name}, day ${day}${done ? ", achieved" : future ? ", not available yet" : ", not achieved"}`;
    return `<td class="day-cell ${day % 7 === 1 && day > 1 ? "week-start" : ""} ${isToday ? "is-today" : ""}">
      <button type="button" data-toggle-day="${day}" data-id="${escapeHTML(habit.id)}" aria-label="${escapeHTML(label)}" aria-pressed="${done}" ${future ? "disabled" : ""}>${done ? "<span aria-hidden=\"true\">✓</span>" : ""}</button>
    </td>`;
  }).join("");
  const status = currentDay > JOURNEY_LENGTH ? "Journey complete" : `Day ${Math.max(1, currentDay)} of 90`;
  return `<tr data-id="${escapeHTML(habit.id)}">
    <th scope="row" class="habit-name-cell"><button type="button" data-detail="${escapeHTML(habit.id)}"><strong>${escapeHTML(habit.name)}</strong><span>${status}</span></button></th>
    <td class="score-cell"><strong>${completedInJourney}</strong><span>/90</span></td>${cells}
  </tr>`;
}

function render() {
  renderHead();
  $("#matrixBody").innerHTML = state.habits.map(habitRow).join("");
  $("#matrixEmpty").hidden = state.habits.length > 0;
  $(".habit-matrix").hidden = state.habits.length === 0;

  const today = dateKey();
  const achievedToday = state.habits.filter((habit) => successfulDates(habit.events).has(today)).length;
  $("#todaySummary").textContent = state.habits.length
    ? `${achievedToday} of ${state.habits.length} ${state.habits.length === 1 ? "habit" : "habits"} achieved today.`
    : "One small check at a time.";
}

function scrollToCurrentDay() {
  if (!state.habits.length) return;
  const days = state.habits.map((habit) => journeyDay(parseStart(habit), new Date(), JOURNEY_LENGTH));
  const targetDay = Math.max(1, Math.min(JOURNEY_LENGTH, Math.round(days.reduce((a, b) => a + b, 0) / days.length)));
  const cell = $(`#matrixHead .day-heading:nth-child(${targetDay + 2})`);
  const scroller = $("#matrixScroll");
  if (cell) scroller.scrollLeft = Math.max(0, cell.offsetLeft - scroller.clientWidth * 0.58);
}

function openHabitDialog() {
  const form = $("#habitForm");
  form.reset();
  $("#habitDialog").showModal();
  setTimeout(() => form.elements.name.focus(), 50);
}

function addHabit(data) {
  state.habits.push({
    id: makeId(), name: data.get("name").trim(), why: data.get("why").trim(), cue: data.get("cue").trim(),
    action: data.get("action").trim(), minimum: data.get("minimum").trim(), place: "", frequency: "Most days",
    maintaining: false, createdAt: new Date().toISOString(), events: [], checkIns: []
  });
  save();
  render();
  requestAnimationFrame(scrollToCurrentDay);
  showToast("Your 90-day practice has started.");
}

function findHabit(id) {
  return state.habits.find((habit) => habit.id === id);
}

function toggleDay(id, day) {
  const habit = findHabit(id);
  if (!habit) return;
  const start = parseStart(habit);
  const currentDay = journeyDay(start, new Date(), JOURNEY_LENGTH);
  if (day < 1 || day > currentDay || day > JOURNEY_LENGTH) return;
  const key = dateKey(journeyDate(start, day));
  const wasDone = habit.events.some((event) => event?.date === key && event?.outcome === "done");
  if (wasDone) {
    habit.events = habit.events.filter((event) => !(event?.date === key && event?.outcome === "done"));
    showToast(`Day ${day} cleared.`, "neutral");
  } else {
    habit.events.push({ id: makeId(), date: key, at: new Date().toISOString(), outcome: "done", reflection: "", adjustment: "" });
    showToast(`Day ${day} achieved.`);
  }
  save();
  render();
}

function openDetail(id) {
  const habit = findHabit(id);
  if (!habit) return;
  activeHabitId = id;
  const start = parseStart(habit);
  const currentDay = journeyDay(start, new Date(), JOURNEY_LENGTH);
  const completed = successfulDates(habit.events);
  const count = Array.from({ length: JOURNEY_LENGTH }, (_, index) => dateKey(journeyDate(start, index + 1))).filter((key) => completed.has(key)).length;
  $("#detailTitle").textContent = habit.name;
  $("#detailCount").textContent = count;
  $("#detailDay").textContent = currentDay > JOURNEY_LENGTH ? "90-day journey complete" : `Day ${Math.max(1, currentDay)} of 90`;
  $("#detailProgress").style.width = `${Math.round((count / JOURNEY_LENGTH) * 100)}%`;
  $("#detailCue").textContent = habit.cue || "At the usual cue";
  $("#detailAction").textContent = habit.action || habit.name;
  $("#detailMinimum").textContent = habit.minimum || "Practice the smallest version";
  $("#detailWhy").textContent = habit.why || "";
  $("#detailWhyRow").hidden = !habit.why;
  $("#detailStarted").textContent = `Started ${formatStart(start)}`;
  $("#detailDialog").showModal();
}

function deleteActiveHabit() {
  const habit = findHabit(activeHabitId);
  if (!habit || !confirm(`Delete “${habit.name}” and its 90-day history?`)) return;
  state.habits = state.habits.filter((item) => item.id !== activeHabitId);
  activeHabitId = null;
  save();
  $("#detailDialog").close();
  render();
  showToast("Habit deleted.", "neutral");
}

document.addEventListener("click", (event) => {
  if (event.target.closest('[data-open="habit"]')) return openHabitDialog();
  const dayButton = event.target.closest("[data-toggle-day]");
  if (dayButton) return toggleDay(dayButton.dataset.id, Number(dayButton.dataset.toggleDay));
  const detailButton = event.target.closest("[data-detail]");
  if (detailButton) return openDetail(detailButton.dataset.detail);
  if (event.target.closest("[data-close-detail]")) return $("#detailDialog").close();
});

$("#habitForm").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  addHabit(new FormData(event.currentTarget));
  $("#habitDialog").close();
});

$("#deleteHabit").addEventListener("click", deleteActiveHabit);

$("#resetData").addEventListener("click", () => {
  if (!confirm("Reset Tend and remove all habits and their 90-day history?")) return;
  state = clone(starterState);
  save();
  render();
  showToast("Your tracker is ready for a fresh start.", "neutral");
});

save();
render();
requestAnimationFrame(scrollToCurrentDay);
