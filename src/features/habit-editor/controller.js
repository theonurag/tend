import { $ } from "../../shared/dom.js";
import { reportError, setSyncStatus, showToast } from "../../shared/feedback.js";
import {
  closeHabitEditor,
  openHabitEditor,
  readHabitValues,
  reportDurationError
} from "./editor.js";

export function createHabitEditorController({
  store,
  isSignedIn,
  openAuth,
  onChanged,
  syncLabel
}) {
  const openNew = () => {
    if (!isSignedIn()) {
      openAuth();
      return;
    }
    openHabitEditor();
  };

  const edit = (id) => {
    const habit = store.find(id);
    if (!habit) return;
    /** @type {HTMLDialogElement} */ ($("#detailDialog")).close();
    openHabitEditor(habit);
  };

  const save = async (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const form = /** @type {HTMLFormElement} */ (event.currentTarget);
    if (!form.reportValidity()) return;
    const id = form.dataset.habitId;
    const current = id ? store.find(id) : null;
    const values = readHabitValues(new FormData(form), current?.durationDays);
    const submitButton = /** @type {HTMLButtonElement} */ (event.submitter || $("#habitSubmit"));

    if (current && values.durationDays < current.durationDays) {
      reportDurationError("Practice length can only be extended.");
      return;
    }

    submitButton.disabled = true;
    try {
      if (current) {
        await store.update(current.id, values);
        showToast("Practice updated.");
      } else {
        await store.create(values);
        showToast(`Your ${values.durationDays}-day practice has started.`);
      }
      closeHabitEditor();
      onChanged();
      setSyncStatus(syncLabel());
    } catch (error) {
      reportError(current ? "Updating habit failed" : "Creating habit failed", error);
    } finally {
      submitButton.disabled = false;
    }
  };

  const bind = () => {
    $("#habitForm").addEventListener("submit", save);
  };

  return { bind, edit, openNew };
}
