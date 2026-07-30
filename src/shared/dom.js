export function $(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Expected DOM element ${selector}.`);
  return element;
}

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}
