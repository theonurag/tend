(() => {
  "use strict";

  const THEME_KEY = "tend-theme";
  const saved = localStorage.getItem(THEME_KEY);
  document.documentElement.dataset.theme = saved === "dark" || saved === "light"
    ? saved
    : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("#themeToggle");
    if (!button) return;

    const sync = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
      button.querySelector("[aria-hidden]").textContent = dark ? "☀" : "☾";
      button.querySelector(".theme-label").textContent = dark ? "Light" : "Dark";
    };

    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
      sync();
    });
    sync();
  });
})();
