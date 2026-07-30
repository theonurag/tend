import { mapEventRow, mapHabitRow, toHabitRow } from "./habit-mapper.js";

export function createSupabaseHabitRepository(client) {
  const expect = (result, context) => {
    if (result.error) {
      result.error.message = `${context}: ${result.error.message}`;
      throw result.error;
    }
    return result.data;
  };

  return {
    async list() {
      const result = await client
        .from("habits")
        .select("id, name, why, cue, action, minimum, duration_days, created_at, habit_events(id, event_date, occurred_at, outcome, reflection, adjustment)")
        .order("created_at", { ascending: true });
      return expect(result, "Loading habits failed").map(mapHabitRow);
    },

    async create(values) {
      const result = await client.from("habits").insert(toHabitRow(values)).select().single();
      return mapHabitRow(expect(result, "Creating habit failed"));
    },

    async update(id, values) {
      const result = await client.from("habits").update(toHabitRow(values)).eq("id", id).select().single();
      return mapHabitRow(expect(result, "Updating habit failed"));
    },

    async createEvent(habitId, date) {
      const result = await client
        .from("habit_events")
        .insert({ habit_id: habitId, event_date: date, outcome: "done", reflection: "", adjustment: "" })
        .select()
        .single();
      return mapEventRow(expect(result, "Saving habit day failed"));
    },

    async deleteEvent(eventId) {
      const result = await client.from("habit_events").delete().eq("id", eventId);
      expect(result, "Clearing habit day failed");
    },

    async deleteHabit(id) {
      const result = await client.from("habits").delete().eq("id", id);
      expect(result, "Deleting habit failed");
    },

    async reset(userId) {
      const result = await client.from("habits").delete().eq("user_id", userId);
      expect(result, "Resetting Tend failed");
    }
  };
}
