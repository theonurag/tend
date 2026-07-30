import { normalizeJourneyLength } from "../../domain/habits.js";
import { $ } from "../../shared/dom.js";
import { HABIT_PRESETS, PRESET_GROUPS } from "./presets.js";

const DEFAULT_INITIAL_DAYS = 7;

function habitForm() {
  return /** @type {HTMLFormElement} */ ($("#habitForm"));
}

function formControl(form, name) {
  return /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */ (form.elements.namedItem(name));
}

function inputControl(form, name) {
  return /** @type {HTMLInputElement} */ (form.elements.namedItem(name));
}

export function initializeHabitEditor() {
  const select = /** @type {HTMLSelectElement} */ ($("#habitPreset"));
  if (select.options.length === 1) {
    for (const group of PRESET_GROUPS) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.label;
      for (const key of group.keys) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = HABIT_PRESETS[key].name;
        optgroup.append(option);
      }
      select.append(optgroup);
    }
  }

  select.addEventListener("change", (event) => {
    const preset = HABIT_PRESETS[/** @type {HTMLSelectElement} */ (event.currentTarget).value];
    if (!preset) return;
    const form = habitForm();
    Object.entries(preset).forEach(([field, value]) => {
      formControl(form, field).value = value;
    });
    formControl(form, "name").focus();
  });

  inputControl(habitForm(), "durationDays").addEventListener("input", (event) => {
    /** @type {HTMLInputElement} */ (event.currentTarget).setCustomValidity("");
  });
}

export function openHabitEditor(habit = null) {
  const form = habitForm();
  form.reset();
  form.dataset.habitId = habit?.id || "";
  formControl(form, "habitPreset").value = "";

  if (habit) {
    formControl(form, "name").value = habit.name;
    formControl(form, "why").value = habit.why || "";
    formControl(form, "cue").value = habit.cue || "";
    formControl(form, "action").value = habit.action || "";
    formControl(form, "minimum").value = habit.minimum || "";
    inputControl(form, "durationDays").value = String(habit.durationDays);
    inputControl(form, "durationDays").min = String(habit.durationDays);
    $("#habitDialogEyebrow").textContent = "Refine your practice";
    $("#habitDialogTitle").textContent = "Edit practice";
    $("#durationHelp").textContent = `This practice is currently ${habit.durationDays} days. You can extend it, but existing history cannot be shortened.`;
    $("#habitSubmit").textContent = "Save changes";
  } else {
    inputControl(form, "durationDays").value = String(DEFAULT_INITIAL_DAYS);
    inputControl(form, "durationDays").min = "1";
    $("#habitDialogEyebrow").textContent = "Begin a practice";
    $("#habitDialogTitle").textContent = "Add a practice";
    $("#durationHelp").textContent = "Choose 7, 14, 30, 90, or enter a custom length. You can extend it later.";
    $("#habitSubmit").textContent = "Start practice";
  }

  /** @type {HTMLDialogElement} */ ($("#habitDialog")).showModal();
  setTimeout(() => formControl(form, "name").focus(), 50);
}

export function readHabitValues(data, fallback = 90) {
  const text = (name) => String(data.get(name) || "").trim();
  return {
    name: text("name"),
    why: text("why"),
    cue: text("cue"),
    action: text("action"),
    minimum: text("minimum"),
    durationDays: normalizeJourneyLength(data.get("durationDays"), fallback)
  };
}

export function reportDurationError(message) {
  const control = inputControl(habitForm(), "durationDays");
  control.setCustomValidity(message);
  control.reportValidity();
}

export function closeHabitEditor() {
  /** @type {HTMLDialogElement} */ ($("#habitDialog")).close();
}
