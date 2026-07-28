import { createClient } from "@supabase/supabase-js";
import { dateKey, groupHabitsByDuration, isJourneyActive, journeyDate, journeyDay, normalizeJourneyLength, successfulDates } from "./core.js";

const DEFAULT_INITIAL_DAYS = 7;
const LOCAL_DEV = import.meta.env.DEV;
const LOCAL_STORAGE_KEY = "tend:local-dev-state:v1";
const HABIT_PRESETS = {
  read: { name: "Read every day", why: "I want to learn and make space away from scrolling", cue: "After I get into bed", action: "Read a book", minimum: "Read one page" },
  walk: { name: "Take a daily walk", why: "I want more movement, daylight, and mental space", cue: "After lunch", action: "Go outside for a walk", minimum: "Walk for five minutes" },
  water: { name: "Drink more water", why: "I want to stay hydrated and feel more alert", cue: "After I wake up", action: "Drink a glass of water", minimum: "Take five sips" },
  exercise: { name: "Move my body", why: "I want more energy, mobility, and physical wellbeing", cue: "After I change into comfortable clothes", action: "Do a movement session I enjoy", minimum: "Move for two minutes" },
  strength: { name: "Build strength", why: "I want to feel stronger and support my long-term health", cue: "After my first break", action: "Do a strength session", minimum: "Do one set of one exercise" },
  meditate: { name: "Meditate", why: "I want to respond with more calm and attention", cue: "After my morning drink", action: "Sit and meditate", minimum: "Take three mindful breaths" },
  breathe: { name: "Pause and breathe", why: "I want to create a moment of calm during my day", cue: "When I notice tension", action: "Pause for slow, steady breaths", minimum: "Take one slow breath" },
  journal: { name: "Write in a journal", why: "I want space to understand my thoughts and feelings", cue: "After I make my evening drink", action: "Write in my journal", minimum: "Write one sentence" },
  stretch: { name: "Stretch daily", why: "I want my body to feel less stiff", cue: "After I close my laptop", action: "Do a short stretch routine", minimum: "Stretch for one minute" },
  plan: { name: "Plan tomorrow", why: "I want to begin each day with clarity", cue: "Before I finish work", action: "Write tomorrow’s priorities", minimum: "Write one priority" },
  review: { name: "Review my day", why: "I want to learn from my days instead of letting them blur together", cue: "Before I begin my bedtime routine", action: "Reflect on what went well and what I learned", minimum: "Write down one observation" },
  sleep: { name: "Keep a sleep routine", why: "I want steadier energy and better rest", cue: "Thirty minutes before bedtime", action: "Begin my wind-down routine", minimum: "Dim the lights and put my phone away" },
  medication: { name: "Take prescribed medication", why: "I want to follow the care plan I made with my healthcare professional", cue: "At the time listed in my prescription", action: "Take my prescribed medication as directed", minimum: "Put it somewhere visible and check the instructions" },
  floss: { name: "Floss my teeth", why: "I want to care for my teeth and gums", cue: "After I brush my teeth at night", action: "Floss my teeth", minimum: "Floss one tooth" },
  sunlight: { name: "Get morning daylight", why: "I want to support my energy and daily rhythm", cue: "After I wake up", action: "Step outside or sit near a bright window", minimum: "Get one minute of daylight" },
  vegetables: { name: "Eat more vegetables", why: "I want meals that support my health and energy", cue: "When I prepare my main meal", action: "Add vegetables to my meal", minimum: "Add one bite-sized serving" },
  gratitude: { name: "Practice gratitude", why: "I want to notice what is already going well", cue: "After dinner", action: "Write down something I appreciate", minimum: "Write one sentence" },
  learn: { name: "Learn something new", why: "I want to keep growing with steady practice", cue: "After my first break", action: "Study a skill I care about", minimum: "Practice for five minutes" },
  focus: { name: "Do focused work", why: "I want to make meaningful progress without constant switching", cue: "After I choose my most important task", action: "Work with distractions put away", minimum: "Focus for five minutes" },
  phone: { name: "Start without my phone", why: "I want to choose how my day begins", cue: "When I wake up", action: "Leave my phone alone until after breakfast", minimum: "Wait five minutes before checking it" },
  connect: { name: "Connect with someone", why: "I want to nurture the relationships that matter to me", cue: "After my afternoon break", action: "Reach out with genuine attention", minimum: "Send one thoughtful message" },
  tidy: { name: "Reset my space", why: "I want my surroundings to feel calmer and easier to use", cue: "Before I finish the day", action: "Put my space back in order", minimum: "Put away one item" },
  money: { name: "Check my spending", why: "I want to understand my money and make intentional choices", cue: "After I open my banking app", action: "Review and categorize recent spending", minimum: "Review one transaction" },
  outdoors: { name: "Spend time outdoors", why: "I want more fresh air, daylight, and connection with my surroundings", cue: "After lunch", action: "Go outside without multitasking", minimum: "Step outside for one minute" }
};
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const $ = (selector, root = document) => root.querySelector(selector);
const starterState = { habits: [] };
let toastTimer;
let activeHabitId = null;
let session = null;
let state = structuredClone(starterState);

if (!LOCAL_DEV && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error("Tend is missing its public Supabase configuration.");
}

const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : null;

function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (!saved || !Array.isArray(saved.habits)) return structuredClone(starterState);
    return {
      habits: saved.habits.map((habit) => ({
        ...habit,
        durationDays: normalizeJourneyLength(habit.durationDays),
        events: Array.isArray(habit.events) ? habit.events : []
      }))
    };
  } catch (error) {
    console.warn("Ignoring invalid local Tend data", error);
    return structuredClone(starterState);
  }
}

function saveLocalState() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("Tend could not persist local data", error);
    showToast("Saved for this tab, but browser storage is unavailable.", "neutral");
    return false;
  }
}

function localId() {
  return globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
    durationDays: normalizeJourneyLength(row.duration_days),
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

function headingDateRange(habits, day) {
  const dates = habits
    .filter((habit) => habit.durationDays >= day)
    .map((habit) => journeyDate(parseStart(habit), day))
    .sort((first, second) => first - second);
  const first = dates[0];
  const last = dates.at(-1);
  const compact = (date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return dateKey(first) === dateKey(last) ? compact(first) : `${compact(first)}–${compact(last)}`;
}

function dayHeadings(length, habits) {
  return Array.from({ length }, (_, index) => {
    const day = index + 1;
    const weekStart = day === 1 || (day - 1) % 7 === 0;
    const dateRange = headingDateRange(habits, day);
    return `<th scope="col" class="day-heading ${weekStart ? "week-start" : ""}" title="${escapeHTML(dateRange)}, day ${day}"><small>${escapeHTML(dateRange)}</small><span>Day ${day}</span></th>`;
  }).join("");
}

function habitRow(habit, maximumLength) {
  const start = parseStart(habit);
  const length = habit.durationDays;
  const currentDay = journeyDay(start, new Date(), length);
  const completed = successfulDates(habit.events);
  const completedInJourney = Array.from({ length }, (_, index) => dateKey(journeyDate(start, index + 1))).filter((key) => completed.has(key)).length;
  const today = dateKey();
  const cells = Array.from({ length }, (_, index) => {
    const day = index + 1;
    const date = journeyDate(start, day);
    const key = dateKey(date);
    const done = completed.has(key);
    const future = key > today;
    const isToday = key === today;
    const weekStart = day === 1 || (day - 1) % 7 === 0;
    const formattedDate = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    const label = `${habit.name}, ${formattedDate}, day ${day} of ${length}${done ? ", achieved" : future ? ", not available yet" : ", not achieved"}`;
    return `<td class="day-cell in-journey ${weekStart ? "week-start" : ""} ${isToday ? "is-today" : ""}">
      <button type="button" data-toggle-day="${day}" data-id="${escapeHTML(habit.id)}" title="${escapeHTML(formattedDate)}" aria-label="${escapeHTML(label)}" aria-pressed="${done}" ${future ? "disabled" : ""}>${done ? "<span aria-hidden=\"true\">✓</span>" : ""}</button>
    </td>`;
  }).join("");
  const unusedCells = Array.from({ length: maximumLength - length }, (_, index) => {
    const day = length + index + 1;
    const weekStart = day === 1 || (day - 1) % 7 === 0;
    return `<td class="day-cell outside-journey ${weekStart ? "week-start" : ""}" aria-hidden="true"></td>`;
  }).join("");
  const status = currentDay > length ? "Complete" : `Day ${Math.max(1, currentDay)} of ${length}`;
  return `<tr data-id="${escapeHTML(habit.id)}">
    <th scope="row" class="habit-name-cell"><button type="button" data-detail="${escapeHTML(habit.id)}"><strong>${escapeHTML(habit.name)}</strong><span>${status}</span></button></th>
    <td class="score-cell"><strong>${completedInJourney}</strong><span>/${length}</span></td>${cells}${unusedCells}
  </tr>`;
}

function practiceGroup({ durationDays, habits }) {
  const practiceLabel = `${habits.length} ${habits.length === 1 ? "practice" : "practices"}`;
  const activeCount = habits.filter((habit) => isJourneyActive(parseStart(habit), new Date(), durationDays)).length;
  const activeLabel = activeCount ? `${activeCount} active` : "complete";
  return `<section class="practice-group" aria-label="${durationDays}-day practices">
    <div class="practice-group-row"><strong>${durationDays}-day practices</strong><span>${practiceLabel} · ${activeLabel}</span></div>
    <div class="group-table-scroll" tabindex="0" aria-label="Scroll ${durationDays}-day practices horizontally">
      <table class="habit-matrix">
        <thead><tr><th scope="col" class="habit-heading"><span>Practice</span></th><th scope="col" class="score-heading"><span>Done</span></th>${dayHeadings(durationDays, habits)}</tr></thead>
        <tbody>${habits.map((habit) => habitRow(habit, durationDays)).join("")}</tbody>
      </table>
    </div>
  </section>`;
}

function render() {
  const groups = groupHabitsByDuration(state.habits);
  $("#practiceGroups").innerHTML = groups.map(practiceGroup).join("");
  $("#matrixEmpty").hidden = state.habits.length > 0;

  const today = new Date();
  const todayKey = dateKey(today);
  const activeHabits = state.habits.filter((habit) => isJourneyActive(parseStart(habit), today, habit.durationDays));
  const achievedToday = activeHabits.filter((habit) => successfulDates(habit.events).has(todayKey)).length;
  $("#todaySummary").textContent = activeHabits.length
    ? `${achievedToday} of ${activeHabits.length} active ${activeHabits.length === 1 ? "practice" : "practices"} achieved today.`
    : state.habits.length ? "No active practices today." : "One small check at a time.";
}

function scrollToCurrentDay() {
  document.querySelectorAll(".group-table-scroll").forEach((scroller) => {
    const currentCells = [...scroller.querySelectorAll(".day-cell.is-today")];
    if (!currentCells.length) return;
    const offsets = currentCells.map((cell) => cell.offsetLeft).sort((first, second) => first - second);
    const target = offsets[Math.floor(offsets.length / 2)];
    scroller.scrollLeft = Math.max(0, target - scroller.clientWidth * 0.64);
  });
}

async function loadHabits() {
  if (!session) return;
  if (LOCAL_DEV) {
    state = loadLocalState();
    render();
    requestAnimationFrame(scrollToCurrentDay);
    setSyncStatus("Saved locally");
    return;
  }
  setSyncStatus("Syncing…", true);
  const { data, error } = await supabase
    .from("habits")
    .select("id, name, why, cue, action, minimum, duration_days, created_at, habit_events(id, event_date, occurred_at, outcome, reflection, adjustment)")
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
  form.dataset.habitId = "";
  form.elements.durationDays.value = DEFAULT_INITIAL_DAYS;
  form.elements.durationDays.min = "1";
  $("#habitDialogEyebrow").textContent = "Begin a practice";
  $("#habitDialogTitle").textContent = "Add a practice";
  $("#durationHelp").textContent = "Choose 7, 14, 30, 90, or enter a custom length. You can extend it later.";
  $("#habitSubmit").textContent = "Start practice";
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
    minimum: data.get("minimum").trim(),
    duration_days: normalizeJourneyLength(data.get("durationDays"))
  };
  if (LOCAL_DEV) {
    state.habits.push({
      id: localId(),
      name: values.name,
      why: values.why,
      cue: values.cue,
      action: values.action,
      minimum: values.minimum,
      durationDays: values.duration_days,
      createdAt: new Date().toISOString(),
      events: []
    });
    saveLocalState();
    submitButton.disabled = false;
    render();
    requestAnimationFrame(scrollToCurrentDay);
    $("#habitDialog").close();
    setSyncStatus("Saved locally");
    showToast(`Your ${values.duration_days}-day practice has started.`);
    return;
  }
  const { data: row, error } = await supabase.from("habits").insert(values).select().single();
  submitButton.disabled = false;

  if (error) return reportError("Creating habit failed", error);
  state.habits.push(mapHabit(row));
  render();
  requestAnimationFrame(scrollToCurrentDay);
  $("#habitDialog").close();
  setSyncStatus("Synced securely");
  showToast(`Your ${values.duration_days}-day practice has started.`);
}

function openEditHabit() {
  const habit = findHabit(activeHabitId);
  if (!habit) return;
  const form = $("#habitForm");
  form.dataset.habitId = habit.id;
  form.elements.habitPreset.value = "";
  form.elements.name.value = habit.name;
  form.elements.why.value = habit.why || "";
  form.elements.cue.value = habit.cue || "";
  form.elements.action.value = habit.action || "";
  form.elements.minimum.value = habit.minimum || "";
  form.elements.durationDays.value = habit.durationDays;
  form.elements.durationDays.min = String(habit.durationDays);
  $("#habitDialogEyebrow").textContent = "Refine your practice";
  $("#habitDialogTitle").textContent = "Edit practice";
  $("#durationHelp").textContent = `This practice is currently ${habit.durationDays} days. You can extend it, but existing history cannot be shortened.`;
  $("#habitSubmit").textContent = "Save changes";
  $("#detailDialog").close();
  $("#habitDialog").showModal();
  setTimeout(() => form.elements.name.focus(), 50);
}

async function updateHabit(id, data, submitButton) {
  const habit = findHabit(id);
  if (!habit) return;
  const form = $("#habitForm");
  const durationDays = normalizeJourneyLength(data.get("durationDays"), habit.durationDays);
  if (durationDays < habit.durationDays) {
    form.elements.durationDays.setCustomValidity("Practice length can only be extended.");
    form.elements.durationDays.reportValidity();
    return;
  }
  const values = {
    name: data.get("name").trim(),
    why: data.get("why").trim(),
    cue: data.get("cue").trim(),
    action: data.get("action").trim(),
    minimum: data.get("minimum").trim(),
    duration_days: durationDays
  };
  if (LOCAL_DEV) {
    Object.assign(habit, {
      name: values.name,
      why: values.why,
      cue: values.cue,
      action: values.action,
      minimum: values.minimum,
      durationDays: values.duration_days
    });
    saveLocalState();
    render();
    requestAnimationFrame(scrollToCurrentDay);
    $("#habitDialog").close();
    setSyncStatus("Saved locally");
    showToast("Practice updated.");
    return;
  }
  submitButton.disabled = true;
  const { data: row, error } = await supabase.from("habits").update(values).eq("id", id).select().single();
  submitButton.disabled = false;
  if (error) return reportError("Updating habit failed", error);
  const events = habit.events;
  Object.assign(habit, mapHabit({ ...row, habit_events: [] }), { events });
  render();
  requestAnimationFrame(scrollToCurrentDay);
  $("#habitDialog").close();
  setSyncStatus("Synced securely");
  showToast("Practice updated.");
}

function findHabit(id) {
  return state.habits.find((habit) => habit.id === id);
}

async function toggleDay(id, day, button) {
  const habit = findHabit(id);
  if (!habit || button.disabled) return;
  const start = parseStart(habit);
  const currentDay = journeyDay(start, new Date(), habit.durationDays);
  if (day < 1 || day > currentDay || day > habit.durationDays) return;
  const key = dateKey(journeyDate(start, day));
  const existing = habit.events.find((event) => event?.date === key);
  button.disabled = true;

  if (LOCAL_DEV) {
    if (existing) {
      habit.events = habit.events.filter((event) => event.id !== existing.id);
      showToast(`Day ${day} cleared.`, "neutral");
    } else {
      habit.events.push({
        id: localId(),
        date: key,
        at: new Date().toISOString(),
        outcome: "done",
        reflection: "",
        adjustment: ""
      });
      showToast(`Day ${day} achieved.`);
    }
    saveLocalState();
    setSyncStatus("Saved locally");
    render();
    return;
  }

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
  const length = habit.durationDays;
  const currentDay = journeyDay(start, new Date(), length);
  const completed = successfulDates(habit.events);
  const count = Array.from({ length }, (_, index) => dateKey(journeyDate(start, index + 1))).filter((key) => completed.has(key)).length;
  $("#detailTitle").textContent = habit.name;
  $("#detailCount").textContent = count;
  $("#detailEyebrow").textContent = `${length}-day practice`;
  $("#detailDay").textContent = currentDay > length ? `${length}-day practice complete` : `Day ${Math.max(1, currentDay)} of ${length}`;
  $("#detailProgress").style.width = `${Math.round((count / length) * 100)}%`;
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
  if (!habit || !confirm(`Delete “${habit.name}” and its history?`)) return;
  const button = $("#deleteHabit");
  button.disabled = true;
  if (LOCAL_DEV) {
    state.habits = state.habits.filter((item) => item.id !== activeHabitId);
    saveLocalState();
    activeHabitId = null;
    button.disabled = false;
    $("#detailDialog").close();
    render();
    setSyncStatus("Saved locally");
    showToast("Practice deleted.", "neutral");
    return;
  }
  const { error } = await supabase.from("habits").delete().eq("id", activeHabitId);
  button.disabled = false;
  if (error) return reportError("Deleting habit failed", error);
  state.habits = state.habits.filter((item) => item.id !== activeHabitId);
  activeHabitId = null;
  $("#detailDialog").close();
  render();
  showToast("Practice deleted.", "neutral");
}

async function resetData() {
  if (!session || !confirm("Reset Tend and permanently remove all habits and their history?")) return;
  if (LOCAL_DEV) {
    state = structuredClone(starterState);
    saveLocalState();
    render();
    setSyncStatus("Saved locally");
    showToast("Your local tracker is ready for a fresh start.", "neutral");
    return;
  }
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
  $("#authButton").hidden = LOCAL_DEV;
  $("#authButton").textContent = signedIn ? "Sign out" : "Sign in";
  $("#authButton").dataset.signedIn = String(signedIn);
  $("#accountLabel").textContent = LOCAL_DEV ? "Local development" : signedIn ? session.user.email : "";

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
  if (event.target.closest("[data-close-habit]")) return $("#habitDialog").close();
  if (event.target.closest("[data-open-auth]")) return $("#authDialog").showModal();
});

$("#habitPreset").addEventListener("change", (event) => {
  const preset = HABIT_PRESETS[event.currentTarget.value];
  if (!preset) return;
  const form = $("#habitForm");
  Object.entries(preset).forEach(([field, value]) => {
    form.elements[field].value = value;
  });
  form.elements.name.focus();
});

$("#habitForm").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const id = event.currentTarget.dataset.habitId;
  const submitButton = event.submitter || $("#habitSubmit");
  if (id) updateHabit(id, new FormData(event.currentTarget), submitButton);
  else addHabit(new FormData(event.currentTarget), submitButton);
});

$("#habitForm").elements.durationDays.addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
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
$("#editHabit").addEventListener("click", openEditHabit);
$("#resetData").addEventListener("click", resetData);

render();
if (LOCAL_DEV) {
  await applySession({ user: { id: "local-development", email: "" } });
} else {
  const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) reportError("Restoring session failed", sessionError);
  await applySession(initialSession);
  supabase.auth.onAuthStateChange((_event, nextSession) => {
    setTimeout(() => applySession(nextSession), 0);
  });
}
