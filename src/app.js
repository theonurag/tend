import { createClient } from "@supabase/supabase-js";
import { createHabitService } from "./application/habits.js";
import { createHabitStore } from "./application/habit-store.js";
import { createLocalHabitRepository } from "./data/local-habit-repository.js";
import { createSupabaseHabitRepository } from "./data/supabase-habit-repository.js";
import { createAuthService } from "./features/auth/auth.js";
import { createAuthController } from "./features/auth/controller.js";
import { createHabitEditorController } from "./features/habit-editor/controller.js";
import { closeHabitEditor, initializeHabitEditor } from "./features/habit-editor/editor.js";
import { createGrowthCardController } from "./features/growth-card/index.js";
import { createTrackerController } from "./features/tracker/controller.js";
import { $ } from "./shared/dom.js";

const LOCAL_DEV = import.meta.env.DEV;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!LOCAL_DEV && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error("Tend is missing its public Supabase configuration.");
}

const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;
const repository = LOCAL_DEV
  ? createLocalHabitRepository()
  : createSupabaseHabitRepository(supabase);
const store = createHabitStore(createHabitService(repository));
const authService = supabase ? createAuthService(supabase) : null;
const growthCard = createGrowthCardController();
const syncLabel = () => LOCAL_DEV ? "Saved locally" : "Synced securely";

let authController;
let habitEditor;
const tracker = createTrackerController({
  store,
  localDev: LOCAL_DEV,
  syncLabel,
  getSession: () => authController.current(),
  onEdit: (id) => habitEditor.edit(id),
  onGrowth: (habit) => growthCard.open(habit)
});
habitEditor = createHabitEditorController({
  store,
  isSignedIn: () => authController.isSignedIn(),
  openAuth: () => authController.open(),
  onChanged: tracker.renderAndScroll,
  syncLabel
});
authController = createAuthController({
  auth: authService,
  tracker,
  localDev: LOCAL_DEV
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-open="habit"]')) return habitEditor.openNew();
  if (event.target.closest("[data-close-habit]")) return closeHabitEditor();
  if (event.target.closest("[data-close-growth]")) {
    /** @type {HTMLDialogElement} */ ($("#growthDialog")).close();
  }
});

initializeHabitEditor();
growthCard.initialize();
habitEditor.bind();
tracker.bind();
authController.bind();
tracker.render();
await authController.start();
