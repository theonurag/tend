(() => {
  "use strict";

  const THEME_KEY = "tend-theme";
  const root = document.documentElement;

  const readTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (error) {
      console.warn("Tend could not read the saved theme", error);
    }
    return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const syncButton = () => {
    const button = document.querySelector("#themeToggle");
    if (!button) return;
    const dark = root.dataset.theme === "dark";
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
    const icon = button.querySelector("[aria-hidden]");
    const label = button.querySelector(".theme-label");
    if (icon) icon.textContent = dark ? "☀" : "☾";
    if (label) label.textContent = dark ? "Light" : "Dark";
  };

  const applyTheme = (theme, persist = false) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        console.warn("Tend could not save the theme", error);
      }
    }
    syncButton();
  };

  applyTheme(readTheme());
  document.addEventListener("DOMContentLoaded", syncButton);
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#themeToggle")) return;
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  });
})();
