import { habitStart, journeyDay, journeyProgress } from "../../domain/habits.js";
import { $ } from "../../shared/dom.js";
import { reportError, setSyncStatus, showToast } from "../../shared/feedback.js";
import { renderTracker, scrollToCurrentDay } from "./render.js";

export function createTrackerController({
  store,
  localDev,
  syncLabel,
  getSession,
  onEdit,
  onGrowth
}) {
  let activeHabitId = null;

  const render = () => renderTracker(store.all());
  const renderAndScroll = () => {
    render();
    requestAnimationFrame(scrollToCurrentDay);
  };

  const load = async () => {
    setSyncStatus(localDev ? "Loading…" : "Syncing…", true);
    try {
      await store.load();
      renderAndScroll();
      setSyncStatus(syncLabel());
    } catch (error) {
      setSyncStatus("Could not sync");
      reportError("Loading habits failed", error);
    }
  };

  const clear = () => {
    store.clear();
    activeHabitId = null;
    render();
  };

  const toggleDay = async (id, day, button) => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      const result = await store.toggleDay(id, day);
      if (result.kind === "ignored") {
        button.disabled = false;
        return;
      }
      showToast(result.kind === "removed" ? `Day ${day} cleared.` : `Day ${day} achieved.`, result.kind === "removed" ? "neutral" : "success");
      setSyncStatus(syncLabel());
      render();
      if (result.completedFinalDay) requestAnimationFrame(() => openDetail(id));
    } catch (error) {
      button.disabled = false;
      reportError("Updating habit day failed", error);
    }
  };

  const openDetail = (id) => {
    const habit = store.find(id);
    if (!habit) return;
    activeHabitId = id;
    const start = habitStart(habit);
    const length = habit.durationDays;
    const currentDay = journeyDay(start, new Date(), length);
    const progress = journeyProgress(habit);
    $("#detailTitle").textContent = habit.name;
    $("#detailCount").textContent = String(progress.achieved);
    $("#detailEyebrow").textContent = `${length}-day practice`;
    $("#detailDay").textContent = progress.isComplete ? `${length}-day practice complete` : `Day ${Math.max(1, currentDay)} of ${length}`;
    $("#detailProgress").style.width = `${progress.rate}%`;
    $("#completionSummary").hidden = !progress.isComplete;
    $("#completionMessage").textContent = progress.isComplete
      ? `You showed up ${progress.achieved} ${progress.achieved === 1 ? "time" : "times"} across this ${length}-day practice. That evidence belongs to you.`
      : "";
    $("#detailCue").textContent = habit.cue || "At the usual cue";
    $("#detailAction").textContent = habit.action || habit.name;
    $("#detailMinimum").textContent = habit.minimum || "Practice the smallest version";
    $("#detailWhy").textContent = habit.why || "";
    $("#detailWhyRow").hidden = !habit.why;
    $("#detailStarted").textContent = `Started ${start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    /** @type {HTMLDialogElement} */ ($("#detailDialog")).showModal();
  };

  const deleteActive = async () => {
    const habit = store.find(activeHabitId);
    if (!habit || !confirm(`Delete “${habit.name}” and its history?`)) return;
    const button = /** @type {HTMLButtonElement} */ ($("#deleteHabit"));
    button.disabled = true;
    try {
      await store.delete(habit.id);
      activeHabitId = null;
      /** @type {HTMLDialogElement} */ ($("#detailDialog")).close();
      render();
      setSyncStatus(syncLabel());
      showToast("Practice deleted.", "neutral");
    } catch (error) {
      reportError("Deleting habit failed", error);
    } finally {
      button.disabled = false;
    }
  };

  const reset = async () => {
    const session = getSession();
    if (!session || !confirm("Reset Tend and permanently remove all habits and their history?")) return;
    try {
      await store.reset(session.user.id);
      render();
      setSyncStatus(syncLabel());
      showToast("Your tracker is ready for a fresh start.", "neutral");
    } catch (error) {
      reportError("Resetting Tend failed", error);
    }
  };

  const bind = () => {
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const dayButton = /** @type {HTMLButtonElement} */ (event.target.closest("[data-toggle-day]"));
      if (dayButton) return toggleDay(dayButton.dataset.id, Number(dayButton.dataset.toggleDay), dayButton);
      const detailButton = /** @type {HTMLElement} */ (event.target.closest("[data-detail]"));
      if (detailButton) return openDetail(detailButton.dataset.detail);
      if (event.target.closest("[data-close-detail]")) return /** @type {HTMLDialogElement} */ ($("#detailDialog")).close();
    });
    $("#deleteHabit").addEventListener("click", deleteActive);
    $("#editHabit").addEventListener("click", () => onEdit(activeHabitId));
    $("#extendPractice").addEventListener("click", () => onEdit(activeHabitId));
    $("#openGrowthCard").addEventListener("click", () => onGrowth(store.find(activeHabitId)));
    $("#resetData").addEventListener("click", reset);
  };

  return { bind, clear, load, render, renderAndScroll };
}
