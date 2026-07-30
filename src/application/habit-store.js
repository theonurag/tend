export function createHabitStore(service) {
  let items = [];

  return {
    all() {
      return items;
    },

    find(id) {
      return items.find((habit) => habit.id === id);
    },

    async load() {
      items = await service.list();
      return items;
    },

    async create(values) {
      const habit = await service.create(values);
      items.push(habit);
      return habit;
    },

    async update(id, values) {
      const current = items.find((habit) => habit.id === id);
      if (!current) throw new Error(`Habit ${id} was not found.`);
      const updated = await service.update(current, values);
      items = items.map((habit) => habit.id === id ? updated : habit);
      return updated;
    },

    async toggleDay(id, day) {
      const habit = items.find((item) => item.id === id);
      if (!habit) return { kind: "ignored", completedFinalDay: false };
      return service.toggleDay(habit, day);
    },

    async delete(id) {
      await service.delete(id);
      items = items.filter((habit) => habit.id !== id);
    },

    async reset(userId) {
      await service.reset(userId);
      items = [];
    },

    clear() {
      items = [];
    }
  };
}
