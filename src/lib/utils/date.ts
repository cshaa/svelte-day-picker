
  import { Temporal, toTemporalInstant } from '@js-temporal/polyfill';
  import {
    build,
    firstAndRest,
    groupByFirstElement,
    join,
    takeLast,
    once,
    unwrap,
    wrap
  } from './iterable';

export type Month = Temporal.PlainYearMonthLike | Date;

export enum DayOfWeek {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7
}

export const toPlainDate = (
  d: Date,
  timeZone: Temporal.TimeZoneLike,
  calendar: Temporal.CalendarLike
) => toTemporalInstant.call(d).toZonedDateTime({ timeZone, calendar }).toPlainDate();

export const toPlainMonth = (
  m: Month,
  tz: Temporal.TimeZoneLike,
  calendar: Temporal.CalendarLike
) =>
  m instanceof Date
    ? Temporal.PlainYearMonth.from(toPlainDate(m, tz, calendar))
    : m instanceof Temporal.PlainYearMonth
    ? m
    : Temporal.PlainYearMonth.from(m);

export function* daysInMonth(m: Temporal.PlainYearMonth): Iterable<Temporal.PlainDate> {
  for (let day = 1; day <= m.daysInMonth; day++) {
    yield m.toPlainDate({ day });
  }
}

export const dayCountTo = (a: DayOfWeek, b: DayOfWeek): number => {
  const diff = b - a;
  if (diff < 0) return diff + 7;
  return diff;
};

export function* daysInCalendarPage(
  m: Temporal.PlainYearMonth,
  weekStart: DayOfWeek,
  minWeeks = 1
) {
  // yield the first week, which may only partially be in this month
  const previousMonth = m.subtract({ months: 1 });
  const [firstDay, currentMonth] = firstAndRest(daysInMonth(m));
  const daysFromPreviousMonth = dayCountTo(weekStart, firstDay.dayOfWeek);
  yield* takeLast(daysInMonth(previousMonth), daysFromPreviousMonth);

  // yield the current month, counting weeks
  let week = 1;
  yield firstDay;
  for (const date of currentMonth) {
    if (date.dayOfWeek === weekStart) week++;
    yield date;
  }

  // all the days from this month's first day
  const futureDays = unwrap(
    build(() => {
      m = m.add({ months: 1 });
      return daysInMonth(m);
    })
  );

  // finish the current week
  let lastIteratedDay: Temporal.PlainDate;
  for (const date of wrap(futureDays)) {
    if (date.dayOfWeek === weekStart) {
      lastIteratedDay = date;
      break;
    }
    yield date;
  }

  // display the remaining weeks up to minWeeks
  const futureWeeks = groupByFirstElement(
    join(once(lastIteratedDay!), wrap(futureDays)),
    d => d.dayOfWeek === weekStart
  );

  for (const w of futureWeeks) {
    if (week++ >= minWeeks) break;
    yield* w;
  }
}

export function weeksInCalendarPage(
  m: Temporal.PlainYearMonth,
  weekStart: DayOfWeek,
  minWeeks = 1
) {
  return groupByFirstElement(
    daysInCalendarPage(m, weekStart, minWeeks),
    d => d.dayOfWeek === weekStart
  );
}
