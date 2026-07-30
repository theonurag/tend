import { dateKey, journeyDate, journeyDay } from "../domain/habits.js";

export function createHabitService(repository, { now = () => new Date() } = {}) {
  return {
    list() {
      return repository.list();
    },

    create(values) {
      return repository.create(values);
    },

    async update(habit, values) {
      if (values.durationDays < habit.durationDays) {
        throw new RangeError("Practice length can only be extended.");
      }
      const updated = await repository.update(habit.id, values);
      updated.events = habit.events;
      return updated;
    },

    async toggleDay(habit, day) {
      const today = now();
      const start = new Date(habit.createdAt);
      const currentDay = journeyDay(start, today, habit.durationDays);
      if (day < 1 || day > currentDay || day > habit.durationDays) {
        return { kind: "ignored", completedFinalDay: false };
      }

      const key = dateKey(journeyDate(start, day));
      const existing = habit.events.find((event) => event?.date === key);
      const completedFinalDay = !existing && day === habit.durationDays;

      if (existing) {
        await repository.deleteEvent(existing.id);
        habit.events = habit.events.filter((event) => event.id !== existing.id);
        return { kind: "removed", completedFinalDay: false };
      }

      const event = await repository.createEvent(habit.id, key);
      habit.events.push(event);
      return { kind: "added", completedFinalDay };
    },

    delete(id) {
      return repository.deleteHabit(id);
    },

    reset(userId) {
      return repository.reset(userId);
    }
  };
}
