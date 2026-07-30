import { journeyProgress } from "../../domain/habits.js";
import { $ } from "../../shared/dom.js";
import { reportError, showToast } from "../../shared/feedback.js";
import { renderGrowthCard } from "./draw.js";

export function createGrowthCardController() {
  let activeHabit = null;

  const defaultCaption = (habit) => {
    const { achieved, length } = journeyProgress(habit);
    const showName = /** @type {HTMLInputElement} */ ($("#showGrowthName")).checked;
    const editedName = /** @type {HTMLInputElement} */ ($("#growthCardName")).value.trim();
    const practice = showName ? `“${editedName || habit.name}”` : "a personal practice";
    return `I tended ${practice} for ${length} days. I showed up ${achieved} ${achieved === 1 ? "time" : "times"}—and something took root. 🌱\n\nMade with Tend · ${window.location.origin}${window.location.pathname}`;
  };

  const caption = () => {
    if (!activeHabit) return "";
    return /** @type {HTMLTextAreaElement} */ ($("#growthCaption")).value.trim() || defaultCaption(activeHabit);
  };

  const updateCustomization = () => {
    if (!activeHabit) return;
    /** @type {HTMLTextAreaElement} */ ($("#growthCaption")).value = defaultCaption(activeHabit);
    renderGrowthCard(activeHabit);
  };

  const blob = () => new Promise((resolve, reject) => {
    /** @type {HTMLCanvasElement} */ ($("#growthCanvas")).toBlob(
      (value) => value ? resolve(value) : reject(new Error("The growth card could not be rendered.")),
      "image/png"
    );
  });

  const filename = (habit) => {
    const safeName = habit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 42) || "practice";
    const format = /** @type {HTMLInputElement | null} */ (document.querySelector('[name="growthFormat"]:checked'))?.value || "feed";
    return `tend-${safeName}-${format}.png`;
  };

  const download = async () => {
    if (!activeHabit) return;
    try {
      const image = await blob();
      const url = URL.createObjectURL(image);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename(activeHabit);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("Growth card downloaded.");
    } catch (error) {
      reportError("Downloading growth card failed", error);
    }
  };

  const share = async () => {
    if (!activeHabit) return;
    try {
      const image = await blob();
      const file = new File([image], filename(activeHabit), { type: "image/png" });
      if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
        await download();
        showToast("Sharing isn’t available here, so the card was downloaded.", "neutral");
        return;
      }
      await navigator.share({ title: "My Tend growth card", text: caption(), files: [file] });
      showToast("Growth card shared.");
    } catch (error) {
      if (error?.name !== "AbortError") reportError("Sharing growth card failed", error);
    }
  };

  const copyCaption = async () => {
    if (!activeHabit) return;
    try {
      await navigator.clipboard.writeText(caption());
      showToast("Caption copied.");
    } catch (error) {
      reportError("Copying caption failed", error);
    }
  };

  const initialize = () => {
    $("#shareGrowthCard").addEventListener("click", share);
    $("#downloadGrowthCard").addEventListener("click", download);
    $("#copyGrowthCaption").addEventListener("click", copyCaption);
    $("#growthCardName").addEventListener("input", updateCustomization);
    $("#showGrowthName").addEventListener("change", updateCustomization);
    document.querySelectorAll('[name="growthFormat"]').forEach((input) => input.addEventListener("change", () => {
      if (activeHabit) renderGrowthCard(activeHabit);
    }));
  };

  const open = async (habit) => {
    if (!habit || !journeyProgress(habit).isComplete) return;
    activeHabit = habit;
    /** @type {HTMLInputElement} */ ($("#growthCardName")).value = habit.name;
    /** @type {HTMLInputElement} */ (document.querySelector('[name="growthFormat"][value="feed"]')).checked = true;
    /** @type {HTMLInputElement} */ ($("#showGrowthName")).checked = true;
    /** @type {HTMLTextAreaElement} */ ($("#growthCaption")).value = defaultCaption(habit);
    /** @type {HTMLDialogElement} */ ($("#detailDialog")).close();
    await document.fonts?.ready;
    renderGrowthCard(habit);
    /** @type {HTMLDialogElement} */ ($("#growthDialog")).showModal();
  };

  return { initialize, open };
}
