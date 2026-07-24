import { createClient } from "@supabase/supabase-js";
import { dateKey, journeyDate, journeyDay, successfulDates } from "./core.js";

const JOURNEY_LENGTH = 90;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const $ = (selector, root = document) => root.querySelector(selector);
const starterState = { habits: [] };
let toastTimer;
let activeHabitId = null;
let session = null;
let state = structuredClone(starterState);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Tend is missing its public Supabase configuration.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

function showToast(message, tone = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function reportError(context, error) {
  console.error(context, error);
  showToast("That did not save. Check your connection and try again.", "error");
}

function escapeHTML(value = "") {
  const node = document.createElement("div");
  node.textContent = String(value);
  return node.innerHTML;
}

function parseStart(habit) {
  const parsed = new Date(habit.createdAt);
  return Number.isNaN(parsed.valueOf()) ? new Date() : parsed;
}

function formatStart(value) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function mapHabit(row) {
  return {
    id: row.id,
    name: row.name,
    why: row.why,
    cue: row.cue,
    action: row.action,
    minimum: row.minimum,
    createdAt: row.created_at,
    events: (row.habit_events || []).map((event) => ({
      id: event.id,
      date: event.event_date,
      at: event.occurred_at,
      outcome: event.outcome,
      reflection: event.reflection,
      adjustment: event.adjustment
    }))
  };
}

function setSyncStatus(message, busy = false) {
  const status = $("#syncStatus");
  status.textContent = message;
  status.dataset.busy = String(busy);
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
  const currentDay = journeyDay(start, new Date(), JOURNEY_LENGTH);
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

async function loadHabits() {
  if (!session) return;
  setSyncStatus("Syncing…", true);
  const { data, error } = await supabase
    .from("habits")
    .select("id, name, why, cue, action, minimum, created_at, habit_events(id, event_date, occurred_at, outcome, reflection, adjustment)")
    .order("created_at", { ascending: true });

  if (error) {
    setSyncStatus("Could not sync");
    reportError("Loading habits failed", error);
    return;
  }

  state.habits = data.map(mapHabit);
  render();
  requestAnimationFrame(scrollToCurrentDay);
  setSyncStatus("Synced securely");
}

function openHabitDialog() {
  if (!session) return $("#authDialog").showModal();
  const form = $("#habitForm");
  form.reset();
  $("#habitDialog").showModal();
  setTimeout(() => form.elements.name.focus(), 50);
}

async function addHabit(data, submitButton) {
  submitButton.disabled = true;
  const values = {
    name: data.get("name").trim(),
    why: data.get("why").trim(),
    cue: data.get("cue").trim(),
    action: data.get("action").trim(),
    minimum: data.get("minimum").trim()
  };
  const { data: row, error } = await supabase.from("habits").insert(values).select().single();
  submitButton.disabled = false;

  if (error) return reportError("Creating habit failed", error);
  state.habits.push(mapHabit(row));
  render();
  requestAnimationFrame(scrollToCurrentDay);
  $("#habitDialog").close();
  setSyncStatus("Synced securely");
  showToast("Your 90-day practice has started.");
}

function findHabit(id) {
  return state.habits.find((habit) => habit.id === id);
}

async function toggleDay(id, day, button) {
  const habit = findHabit(id);
  if (!habit || button.disabled) return;
  const start = parseStart(habit);
  const currentDay = journeyDay(start, new Date(), JOURNEY_LENGTH);
  if (day < 1 || day > currentDay || day > JOURNEY_LENGTH) return;
  const key = dateKey(journeyDate(start, day));
  const existing = habit.events.find((event) => event?.date === key);
  button.disabled = true;

  if (existing) {
    const { error } = await supabase.from("habit_events").delete().eq("id", existing.id);
    button.disabled = false;
    if (error) return reportError("Clearing habit day failed", error);
    habit.events = habit.events.filter((event) => event.id !== existing.id);
    showToast(`Day ${day} cleared.`, "neutral");
  } else {
    const { data: event, error } = await supabase
      .from("habit_events")
      .insert({ habit_id: habit.id, event_date: key, outcome: "done", reflection: "", adjustment: "" })
      .select()
      .single();
    button.disabled = false;
    if (error) return reportError("Saving habit day failed", error);
    habit.events.push({
      id: event.id,
      date: event.event_date,
      at: event.occurred_at,
      outcome: event.outcome,
      reflection: event.reflection,
      adjustment: event.adjustment
    });
    showToast(`Day ${day} achieved.`);
  }
  setSyncStatus("Synced securely");
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

async function deleteActiveHabit() {
  const habit = findHabit(activeHabitId);
  if (!habit || !confirm(`Delete “${habit.name}” and its 90-day history?`)) return;
  const button = $("#deleteHabit");
  button.disabled = true;
  const { error } = await supabase.from("habits").delete().eq("id", activeHabitId);
  button.disabled = false;
  if (error) return reportError("Deleting habit failed", error);
  state.habits = state.habits.filter((item) => item.id !== activeHabitId);
  activeHabitId = null;
  $("#detailDialog").close();
  render();
  showToast("Habit deleted.", "neutral");
}

async function resetData() {
  if (!session || !confirm("Reset Tend and permanently remove all habits and their 90-day history?")) return;
  const { error } = await supabase.from("habits").delete().eq("user_id", session.user.id);
  if (error) return reportError("Resetting Tend failed", error);
  state = structuredClone(starterState);
  render();
  showToast("Your tracker is ready for a fresh start.", "neutral");
}

async function sendMagicLink(form) {
  const button = form.querySelector('[type="submit"]');
  const email = new FormData(form).get("email").trim();
  button.disabled = true;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
  });
  button.disabled = false;
  if (error) return reportError("Sending sign-in link failed", error);
  form.reset();
  $("#authDialog").close();
  showToast("Check your email for a secure sign-in link.");
}

async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) reportError("Signing out failed", error);
}

async function applySession(nextSession) {
  session = nextSession;
  const signedIn = Boolean(session);
  $("#authGate").hidden = signedIn;
  $("#trackerContent").hidden = !signedIn;
  $("#resetData").hidden = !signedIn;
  $("#authButton").textContent = signedIn ? "Sign out" : "Sign in";
  $("#authButton").dataset.signedIn = String(signedIn);
  $("#accountLabel").textContent = signedIn ? session.user.email : "";

  if (signedIn) {
    await loadHabits();
  } else {
    state = structuredClone(starterState);
    activeHabitId = null;
    render();
    setSyncStatus("Sign in to sync");
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest('[data-open="habit"]')) return openHabitDialog();
  const dayButton = event.target.closest("[data-toggle-day]");
  if (dayButton) return toggleDay(dayButton.dataset.id, Number(dayButton.dataset.toggleDay), dayButton);
  const detailButton = event.target.closest("[data-detail]");
  if (detailButton) return openDetail(detailButton.dataset.detail);
  if (event.target.closest("[data-close-detail]")) return $("#detailDialog").close();
  if (event.target.closest("[data-open-auth]")) return $("#authDialog").showModal();
});

$("#habitForm").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  addHabit(new FormData(event.currentTarget), event.submitter);
});

$("#authForm").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  sendMagicLink(event.currentTarget);
});

$("#authButton").addEventListener("click", (event) => {
  if (event.currentTarget.dataset.signedIn === "true") signOut();
  else $("#authDialog").showModal();
});

$("#deleteHabit").addEventListener("click", deleteActiveHabit);
$("#resetData").addEventListener("click", resetData);

render();
const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
if (sessionError) reportError("Restoring session failed", sessionError);
await applySession(initialSession);
supabase.auth.onAuthStateChange((_event, nextSession) => {
  setTimeout(() => applySession(nextSession), 0);
});
