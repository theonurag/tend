import {
  calendarDayOffset,
  dateKey,
  groupHabitsByDuration,
  habitStart,
  habitTimeline,
  isJourneyActive,
  isWeekStart,
  journeyDate,
  journeyDay,
  journeyProgress,
  successfulDates
} from "../../domain/habits.js";
import { $, escapeHTML } from "../../shared/dom.js";

export function parseStart(habit) {
  return habitStart(habit);
}

function dayHeadings(length, timelineStart) {
  const today = dateKey();
  return Array.from({ length }, (_, index) => {
    const date = journeyDate(timelineStart, index + 1);
    const key = dateKey(date);
    const weekStart = isWeekStart(date);
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const compact = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const full = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    return `<th scope="col" class="day-heading ${weekStart ? "week-start" : ""} ${key === today ? "is-today" : ""}" title="${escapeHTML(full)}"><small>${escapeHTML(weekday)}</small><span>${escapeHTML(compact)}</span></th>`;
  }).join("");
}

function outsideJourneyCells(length, firstColumn, timelineStart) {
  return Array.from({ length }, (_, index) => {
    const column = firstColumn + index;
    const weekStart = isWeekStart(journeyDate(timelineStart, column));
    return `<td class="day-cell outside-journey ${weekStart ? "week-start" : ""}" aria-hidden="true"></td>`;
  }).join("");
}

export function habitRowMarkup(habit, timelineStart, timelineLength, today = new Date()) {
  const start = parseStart(habit);
  const length = habit.durationDays;
  const leadingLength = Math.max(0, calendarDayOffset(timelineStart, start));
  const currentDay = journeyDay(start, today, length);
  const progress = journeyProgress(habit, today);
  const completed = successfulDates(habit.events);
  const todayKey = dateKey(today);
  const leadingCells = outsideJourneyCells(leadingLength, 1, timelineStart);
  const cells = Array.from({ length }, (_, index) => {
    const day = index + 1;
    const date = journeyDate(start, day);
    const key = dateKey(date);
    const done = completed.has(key);
    const future = key > todayKey;
    const isToday = key === todayKey;
    const weekStart = isWeekStart(date);
    const formattedDate = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    const label = `${habit.name}, ${formattedDate}, day ${day} of ${length}${done ? ", achieved" : future ? ", not available yet" : ", not achieved"}`;
    return `<td class="day-cell in-journey ${weekStart ? "week-start" : ""} ${isToday ? "is-today" : ""}">
      <button type="button" data-toggle-day="${day}" data-id="${escapeHTML(habit.id)}" title="${escapeHTML(formattedDate)}" aria-label="${escapeHTML(label)}" aria-pressed="${done}" ${future ? "disabled" : ""}>${done ? "<span aria-hidden=\"true\">✓</span>" : ""}</button>
    </td>`;
  }).join("");
  const trailingLength = Math.max(0, timelineLength - leadingLength - length);
  const trailingCells = outsideJourneyCells(trailingLength, leadingLength + length + 1, timelineStart);
  const status = progress.isComplete ? "Complete" : `Day ${Math.max(1, currentDay)} of ${length}`;
  return `<tr data-id="${escapeHTML(habit.id)}">
    <th scope="row" class="habit-name-cell"><button type="button" data-detail="${escapeHTML(habit.id)}"><strong>${escapeHTML(habit.name)}</strong><span>${status}</span></button></th>
    <td class="score-cell"><strong>${progress.achieved}</strong><span>/${length}</span></td>${leadingCells}${cells}${trailingCells}
  </tr>`;
}

function practiceGroupMarkup({ durationDays, habits }, today) {
  const practiceLabel = `${habits.length} ${habits.length === 1 ? "practice" : "practices"}`;
  const timeline = habitTimeline(habits, today);
  const activeCount = habits.filter((habit) => isJourneyActive(parseStart(habit), today, durationDays) && !journeyProgress(habit, today).isComplete).length;
  const activeLabel = activeCount ? `${activeCount} active` : "complete";
  return `<section class="practice-group" aria-label="${durationDays}-day practices">
    <div class="practice-group-row"><strong>${durationDays}-day practices</strong><span>${practiceLabel} · ${activeLabel}</span></div>
    <div class="group-table-scroll" tabindex="0" aria-label="Scroll ${durationDays}-day practices horizontally">
      <table class="habit-matrix">
        <thead><tr><th scope="col" class="habit-heading"><span>Practice</span></th><th scope="col" class="score-heading"><span>Done</span></th>${dayHeadings(timeline.length, timeline.start)}</tr></thead>
        <tbody>${habits.map((habit) => habitRowMarkup(habit, timeline.start, timeline.length, today)).join("")}</tbody>
      </table>
    </div>
  </section>`;
}

export function trackerMarkup(habits, today = new Date()) {
  return groupHabitsByDuration(habits).map((group) => practiceGroupMarkup(group, today)).join("");
}

export function renderTracker(habits, today = new Date()) {
  $("#practiceGroups").innerHTML = trackerMarkup(habits, today);
  $("#matrixEmpty").hidden = habits.length > 0;

  const todayKey = dateKey(today);
  const activeHabits = habits.filter((habit) => isJourneyActive(parseStart(habit), today, habit.durationDays) && !journeyProgress(habit, today).isComplete);
  const achievedToday = activeHabits.filter((habit) => successfulDates(habit.events).has(todayKey)).length;
  $("#todaySummary").textContent = activeHabits.length
    ? `${achievedToday} of ${activeHabits.length} active ${activeHabits.length === 1 ? "practice" : "practices"} achieved today.`
    : habits.length ? "No active practices today." : "One small check at a time.";
}

export function scrollToCurrentDay() {
  document.querySelectorAll(".group-table-scroll").forEach((element) => {
    const scroller = /** @type {HTMLElement} */ (element);
    const currentCells = /** @type {HTMLElement[]} */ ([...scroller.querySelectorAll(".day-cell.is-today")]);
    if (!currentCells.length) return;
    const offsets = currentCells.map((cell) => cell.offsetLeft).sort((first, second) => first - second);
    const target = offsets[Math.floor(offsets.length / 2)];
    scroller.scrollLeft = Math.max(0, target - scroller.clientWidth * 0.64);
  });
}
