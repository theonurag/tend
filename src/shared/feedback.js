import { $ } from "./dom.js";

let toastTimer;

export function showToast(message, tone = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

export function reportError(context, error) {
  console.error(context, error);
  showToast("That did not save. Check your connection and try again.", "error");
}

export function setSyncStatus(message, busy = false) {
  const status = $("#syncStatus");
  status.textContent = message;
  status.dataset.busy = String(busy);
}
