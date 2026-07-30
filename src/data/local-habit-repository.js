import { normalizeJourneyLength } from "../domain/habits.js";

const DEFAULT_KEY = "tend:local-dev-state:v1";

/**
 * @param {{
 *   storage?: Pick<Storage, "getItem" | "setItem">,
 *   storageKey?: string,
 *   createId?: () => string,
 *   now?: () => Date
 * }} [options]
 */
export function createLocalHabitRepository({
  storage = localStorage,
  storageKey = DEFAULT_KEY,
  createId = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  now = () => new Date()
} = {}) {
  const read = () => {
    try {
      const saved = JSON.parse(storage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.habits)) return [];
      return saved.habits.map((habit) => ({
        ...habit,
        durationDays: normalizeJourneyLength(habit.durationDays),
        events: Array.isArray(habit.events) ? habit.events : []
      }));
    } catch (error) {
      console.warn("Ignoring invalid local Tend data", error);
      return [];
    }
  };

  const write = (habits) => {
    storage.setItem(storageKey, JSON.stringify({ habits }));
  };

  return {
    async list() {
      return read();
    },

    async create(values) {
      const habits = read();
      const habit = {
        id: createId(),
        ...values,
        durationDays: normalizeJourneyLength(values.durationDays),
        createdAt: now().toISOString(),
        events: []
      };
      habits.push(habit);
      write(habits);
      return habit;
    },

    async update(id, values) {
      const habits = read();
      const habit = habits.find((item) => item.id === id);
      if (!habit) throw new Error(`Habit ${id} was not found.`);
      Object.assign(habit, values, {
        durationDays: normalizeJourneyLength(values.durationDays, habit.durationDays)
      });
      write(habits);
      return habit;
    },

    async createEvent(habitId, date) {
      const habits = read();
      const habit = habits.find((item) => item.id === habitId);
      if (!habit) throw new Error(`Habit ${habitId} was not found.`);
      const event = {
        id: createId(),
        date,
        at: now().toISOString(),
        outcome: "done",
        reflection: "",
        adjustment: ""
      };
      habit.events.push(event);
      write(habits);
      return event;
    },

    async deleteEvent(eventId) {
      const habits = read();
      for (const habit of habits) {
        habit.events = habit.events.filter((event) => event.id !== eventId);
      }
      write(habits);
    },

    async deleteHabit(id) {
      write(read().filter((habit) => habit.id !== id));
    },

    async reset() {
      write([]);
    }
  };
}
