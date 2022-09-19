import { Temporal, toTemporalInstant } from '@js-temporal/polyfill';
import {
  build,
  firstAndRest,
  groupByFirstElement,
  concat,
  takeLast,
  once,
  unwrap,
  wrap
} from './iterable';

const { abs, round } = Math;

export type Duration = Temporal.Duration;
export type PlainDate = Temporal.PlainDate;
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

export interface PlainDateRange {
  from: Temporal.PlainDate;
  to: Temporal.PlainDate;
}

export const toPlainDate = (
  d: Date,
  timeZone: Temporal.TimeZoneLike,
  calendar: Temporal.CalendarLike
) => toTemporalInstant.call(d).toZonedDateTime({ timeZone, calendar }).toPlainDate();

export const toLegacyDate = (d: PlainDate, timeZone: Temporal.TimeZoneLike) =>
  new Date(d.toZonedDateTime({ timeZone }).epochMilliseconds);

export const toPlainMonth = (
  m: Month,
  tz: Temporal.TimeZoneLike,
  calendar: Temporal.CalendarLike
) =>
  m instanceof Temporal.PlainYearMonth
    ? m
    : m instanceof Date
    ? Temporal.PlainYearMonth.from(toPlainDate(m, tz, calendar))
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
    concat(once(lastIteratedDay!), wrap(futureDays)),
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

export function ordinalOfDayInWeek(day: Temporal.PlainDate, weekStart: DayOfWeek) {
  return ((day.dayOfWeek - weekStart + 7) % 7) + 1;
}

export const PlainDateRange = {
  normalize({ from, to }: PlainDateRange) {
    if (PlainDate.lte(from, to)) return { from, to };
    else return { from: to, to: from };
  },
  iterate: function* iterate({ from, to }: PlainDateRange) {
    for (let d = from; PlainDate.lte(d, to); d = d.add({ days: 1 })) {
      yield d;
    }
  },
  toArray(range: PlainDateRange) {
    return [...PlainDateRange.iterate(range)];
  }
};

export const PlainDate = {
  now: () => Temporal.Now.zonedDateTimeISO(),
  from: Temporal.PlainDate.from,

  lt: (a: PlainDate, b: PlainDate) => Temporal.PlainDate.compare(a, b) < 0,
  lte: (a: PlainDate, b: PlainDate) => Temporal.PlainDate.compare(a, b) <= 0,
  gte: (a: PlainDate, b: PlainDate) => Temporal.PlainDate.compare(a, b) >= 0,
  gt: (a: PlainDate, b: PlainDate) => Temporal.PlainDate.compare(a, b) > 0,
  eq: (a: PlainDate, b: PlainDate) => Temporal.PlainDate.compare(a, b) === 0,

  max: (...args: PlainDate[]) => args.reduce((a, b) => (PlainDate.gte(a, b) ? a : b)),
  min: (...args: PlainDate[]) => args.reduce((a, b) => (PlainDate.lte(a, b) ? a : b)),

  isBetween: (date: PlainDate, start: PlainDate, end: PlainDate) =>
    PlainDate.gte(date, start) && PlainDate.lte(date, end),

  clamp: (date: PlainDate, start: PlainDate, end: PlainDate) =>
    PlainDate.lt(date, start) ? start : PlainDate.gt(date, end) ? end : date,

  startOfWeek: (date: PlainDate, sow: DayOfWeek) =>
    date.subtract({ days: ordinalOfDayInWeek(date, sow) - 1 }),
  endOfWeek: (date: PlainDate, sow: DayOfWeek) =>
    PlainDate.startOfWeek(date, sow).add({ weeks: 1 }).subtract({ days: 1 }),

  startOfMonth: (date: PlainDate) => date.with({ day: 1 }),
  endOfMonth: (date: PlainDate) =>
    PlainDate.startOfMonth(date).add({ months: 1 }).subtract({ days: 1 })
};

export const Duration = {
  lt: (a: Duration, b: Duration) => Temporal.Duration.compare(a, b) < 0,
  lte: (a: Duration, b: Duration) => Temporal.Duration.compare(a, b) <= 0,
  gte: (a: Duration, b: Duration) => Temporal.Duration.compare(a, b) >= 0,
  gt: (a: Duration, b: Duration) => Temporal.Duration.compare(a, b) > 0,
  eq: (a: Duration, b: Duration) => Temporal.Duration.compare(a, b) === 0,

  max: (...args: Duration[]) => args.reduce((a, b) => (Duration.gte(a, b) ? a : b)),
  min: (...args: Duration[]) => args.reduce((a, b) => (Duration.lte(a, b) ? a : b)),

  isBetween: (duration: Duration, min: Duration, max: Duration) =>
    Duration.gte(duration, min) && Duration.lte(duration, max),

  clamp: (duration: Duration, min: Duration, max: Duration) =>
    Duration.lt(duration, min) ? min : Duration.gt(duration, max) ? max : duration,

  div,

  scale: (s: number, d: Duration, unit: keyof Temporal.DurationLike = 'microseconds') =>
    Temporal.Duration.from({ [unit]: round(s * d.total(unit)) })
};

function div(a: Duration, b: Duration, unit?: Temporal.DurationTotalOf): number;
function div(a: Duration, b: number, unit?: keyof Temporal.DurationLike): Duration;
function div(a: Duration, b: Duration | number, unit: Temporal.DurationTotalOf = 'microseconds') {
  if (typeof b === 'number') {
    const u = unit as keyof Temporal.DurationLike;
    return Temporal.Duration.from({ [u]: round(a.total(u) / b) });
  } else {
    return a.total(unit) / b.total(unit);
  }
}

export const DateRange = {
  areOverlaping: (a: PlainDateRange, b: PlainDateRange) => {
    const from = PlainDate.max(a.from, b.from);
    const to = PlainDate.min(a.to, b.to);
    return PlainDate.lt(from, to);
  },

  eq: (a: PlainDateRange, b: PlainDateRange) =>
    PlainDate.eq(a.from, b.from) && PlainDate.eq(a.to, b.to)
};

export type DateRangeLike = PlainDateRange | 'day' | 'week' | 'month';
