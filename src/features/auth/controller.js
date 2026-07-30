import { $ } from "../../shared/dom.js";
import { reportError, setSyncStatus, showToast } from "../../shared/feedback.js";

export function createAuthController({ auth, tracker, localDev }) {
  let session = null;

  const open = () => {
    /** @type {HTMLDialogElement} */ ($("#authDialog")).showModal();
  };

  const apply = async (nextSession) => {
    session = nextSession;
    const signedIn = Boolean(session);
    $("#authGate").hidden = signedIn;
    $("#trackerContent").hidden = !signedIn;
    $("#resetData").hidden = !signedIn;
    $("#authButton").hidden = localDev;
    $("#authButton").textContent = signedIn ? "Sign out" : "Sign in";
    $("#authButton").dataset.signedIn = String(signedIn);
    $("#accountLabel").textContent = localDev ? "Local development" : signedIn ? session.user.email : "";

    if (signedIn) {
      await tracker.load();
    } else {
      tracker.clear();
      setSyncStatus("Sign in to sync");
    }
  };

  const sendMagicLink = async (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const form = /** @type {HTMLFormElement} */ (event.currentTarget);
    if (!form.reportValidity() || !auth) return;
    const button = /** @type {HTMLButtonElement} */ (event.submitter || form.querySelector('[type="submit"]'));
    const email = String(new FormData(form).get("email") || "").trim();
    button.disabled = true;
    try {
      await auth.sendMagicLink(email);
      form.reset();
      /** @type {HTMLDialogElement} */ ($("#authDialog")).close();
      showToast("Check your email for a secure sign-in link.");
    } catch (error) {
      reportError("Sending sign-in link failed", error);
    } finally {
      button.disabled = false;
    }
  };

  const bind = () => {
    $("#authForm").addEventListener("submit", sendMagicLink);
    $("#authButton").addEventListener("click", async (event) => {
      if (event.currentTarget.dataset.signedIn === "true" && auth) {
        try {
          await auth.signOut();
        } catch (error) {
          reportError("Signing out failed", error);
        }
      } else {
        open();
      }
    });
    document.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("[data-open-auth]")) open();
    });
  };

  const start = async () => {
    if (localDev) {
      await apply({ user: { id: "local-development", email: "" } });
      return;
    }
    try {
      await apply(await auth.initialSession());
      auth.onSessionChange(apply);
    } catch (error) {
      reportError("Restoring session failed", error);
      await apply(null);
    }
  };

  return {
    bind,
    current: () => session,
    isSignedIn: () => Boolean(session),
    open,
    start
  };
}
