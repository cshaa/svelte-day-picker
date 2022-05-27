<script lang="ts" context="module">
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
  } from './utils';

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

  const toPlainDate = (d: Date, timeZone: Temporal.TimeZoneLike, calendar: Temporal.CalendarLike) =>
    toTemporalInstant.call(d).toZonedDateTime({ timeZone, calendar }).toPlainDate();

  const toPlainMonth = (m: Month, tz: Temporal.TimeZoneLike, calendar: Temporal.CalendarLike) =>
    m instanceof Date
      ? Temporal.PlainYearMonth.from(toPlainDate(m, tz, calendar))
      : m instanceof Temporal.PlainYearMonth
      ? m
      : Temporal.PlainYearMonth.from(m);

  function* daysInMonth(m: Temporal.PlainYearMonth): Iterable<Temporal.PlainDate> {
    for (let day = 1; day < m.daysInMonth; day++) {
      yield m.toPlainDate({ day });
    }
  }

  const dayCountTo = (a: DayOfWeek, b: DayOfWeek): number => {
    const diff = b - a;
    if (diff < 0) return diff + 7;
    return diff;
  };

  function* daysInCalendarPage(m: Temporal.PlainYearMonth, weekStart: DayOfWeek, minWeeks = 1) {
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

    // finish the current week
    let futureDays = unwrap(
      build(() => {
        m = m.add({ months: 1 });
        return daysInMonth(m);
      })
    );

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

    while (week < minWeeks) {}
  }

  export interface Locale extends Intl.Locale {
    weekInfo?: {
      firstDay: DayOfWeek;
      weekend: DayOfWeek[];
      minimalDays: number;
    };
  }
</script>

<script lang="ts">
  export let locale: Locale = new Intl.Locale(Intl.DateTimeFormat().resolvedOptions().locale);
  export let calendar = Intl.DateTimeFormat().resolvedOptions().calendar;
  export let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  $: weekInfo = locale.weekInfo ?? {
    firstDay: DayOfWeek.Monday,
    weekend: [DayOfWeek.Saturday, DayOfWeek.Sunday],
    minimalDays: 1
  };

  export let firstDay = weekInfo.firstDay;
  export let weekend = weekInfo.weekend;

  export let defaultMonth: Month = Temporal.Now.plainDate(calendar);
  $: defaultMonth_ = toPlainMonth(defaultMonth, tz, calendar);

  export let month = defaultMonth;
  $: month_ = toPlainMonth(month, tz, calendar);

  month_.toPlainDate;
</script>

<div class:day-picker={true} />

<style lang="scss">
</style>
