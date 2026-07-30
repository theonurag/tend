/**
 * @typedef {object} HabitEvent
 * @property {string} id
 * @property {string} date
 * @property {string} at
 * @property {"done" | "replaced" | "missed" | "lapse"} outcome
 * @property {string} reflection
 * @property {string} adjustment
 */

/**
 * @typedef {object} Habit
 * @property {string} id
 * @property {string} name
 * @property {string} why
 * @property {string} cue
 * @property {string} action
 * @property {string} minimum
 * @property {number} durationDays
 * @property {string} createdAt
 * @property {HabitEvent[]} events
 */

/**
 * @typedef {object} HabitValues
 * @property {string} name
 * @property {string} why
 * @property {string} cue
 * @property {string} action
 * @property {string} minimum
 * @property {number} durationDays
 */

/**
 * @typedef {object} HabitRepository
 * @property {() => Promise<Habit[]>} list
 * @property {(values: HabitValues) => Promise<Habit>} create
 * @property {(id: string, values: HabitValues) => Promise<Habit>} update
 * @property {(habitId: string, date: string) => Promise<HabitEvent>} createEvent
 * @property {(eventId: string) => Promise<void>} deleteEvent
 * @property {(id: string) => Promise<void>} deleteHabit
 * @property {(userId?: string) => Promise<void>} reset
 */

export {};
