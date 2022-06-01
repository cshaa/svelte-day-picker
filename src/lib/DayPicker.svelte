<script lang="ts" context="module">
  import { Temporal, Intl as TIntl } from '@js-temporal/polyfill';
  import { DayOfWeek, daysInCalendarPage, toPlainMonth, ordinalOfDayInWeek } from '$lib/utils/date';
  import type { Month } from '$lib/utils/date';
  import { enumerate, map, range, takeFirst } from './utils/iterable';

  import MonthTitle from './MonthTitle.svelte';

  export interface Locale extends Intl.Locale {
    weekInfo?: {
      firstDay: DayOfWeek;
      weekend: DayOfWeek[];
      minimalDays: number;
    };
  }

  export enum Density {
    Sparse,
    Medium,
    Dense
  }

  export { DayOfWeek, Month };
</script>

<script lang="ts">
  import Day from './Day.svelte';
  import DayHeading from './DayHeading.svelte';

  /** Locale – selects default calendar options and corresponding translation strings, if available */
  export let locale: Locale = new Intl.Locale(TIntl.DateTimeFormat().resolvedOptions().locale);
  $: resolvedOptions = TIntl.DateTimeFormat(
    locale.baseName
  ).resolvedOptions() as Partial<Intl.ResolvedDateTimeFormatOptions>;

  /**
   * Either a Unicode Calendar Identifier of a calendar type, or a custom calendar according to the
   * Temporal Calendar Protocol. Most of the world uses 'gregory' or 'iso8601' (which are almost the same),
   * but other calendar identifiers include 'buddhist', 'chinese', 'hebrew', 'islamic'.
   *
   * @see https://github.com/unicode-org/cldr/blob/main/common/bcp47/calendar.xml#L12
   * @see https://tc39.es/proposal-temporal/docs/calendar.html#custom-calendars
   */
  export let calendar: string | Temporal.CalendarProtocol | undefined = undefined;
  $: calendar_ = calendar ?? resolvedOptions.calendar ?? 'iso8601';

  /** Timezone to resolve today's date. */
  export let timeZone: string | undefined = undefined;
  $: timeZone_ = resolvedOptions.timeZone ?? 'utc';

  $: weekInfo = locale.weekInfo ?? {
    firstDay: DayOfWeek.Monday,
    weekend: [DayOfWeek.Saturday, DayOfWeek.Sunday],
    minimalDays: 1
  };

  $: createFormatter = (options: TIntl.DateTimeFormatOptions) => TIntl.DateTimeFormat(locale.baseName, {
    calendar,
    timeZone,
    ...options
  });

  /** First day of the week. */
  export let weekStart: DayOfWeek | undefined = undefined;
  $: weekStart_ = weekStart ?? weekInfo.firstDay;

  /**
   * Days that are considered a weekend. They needen't be two or contiguous.
   * @see https://en.wikipedia.org/wiki/Workweek_and_weekend#Non-contiguous_working_week
   */
  export let weekend: DayOfWeek[] | undefined = undefined;
  $: weekend_ = new Set(weekend ?? weekInfo.weekend);

  /** The number of consecutive months to show. */
  export let numberOfMonths = 1;

  /** When first loaded, the calendar will show this month. */
  export let defaultMonth: Month | undefined = undefined;

  /** A `bind:` propery controling the current month. */
  export let month = defaultMonth;
  $: month_ = toPlainMonth(month ?? Temporal.Now.plainDate(calendar_), timeZone_, calendar_);
  $: months = [...map(range(numberOfMonths), m => month_.add({ months: m }))];

  /** Forbid the user from navigating to a different month. */
  export let disableNavigation = false;

  /** Typographic density of the UI. */
  export let density: Density = Density.Sparse;

  const navigateLeft = () => (month_ = month_.subtract({ months: 1 }));
  const navigateRight = () => (month_ = month_.add({ months: 1 }));
</script>

<div
  class:day-picker={true}
  class:day-picker-density-comfortable={density === Density.Medium}
  class:day-picker-density-dense={density === Density.Dense}
>
  {#each [...enumerate(months, true)] as { value: month, first, last, index }}
    {@const monthTitleProps = {
      month,
      first,
      last,
      index,
      createFormatter,
      disableNavigation,
      navigateLeft,
      navigateRight
    }}
    {@const days = [...daysInCalendarPage(month, weekStart_)]}
    {@const daysForHeading = [...takeFirst(days, 7)]}

    <div class:day-picker-month={true}>
      <div class:day-picker-month-title={true}>
        <slot name="month-title" {...monthTitleProps}><MonthTitle {...monthTitleProps} /></slot>
      </div>
      {#each daysForHeading as day}
        {@const isWeekend = weekend_.has(day.dayOfWeek)}
        {@const dayHeadingProps = { day, isWeekend, createFormatter }}

        <slot name="day-heading" {...dayHeadingProps}><DayHeading {...dayHeadingProps} /></slot>
      {/each}
      {#each days as day}
        {@const isWeekend = weekend_.has(day.dayOfWeek)}
        {@const isOutside = !month.equals(day.toPlainYearMonth())}
        {@const dayProps = { day, isWeekend, isOutside, disableNavigation, createFormatter }}

        <slot name="day" {...dayProps}><Day {...dayProps} /></slot>
      {/each}
    </div>
  {/each}
</div>

<style lang="scss">
  .day-picker {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans',
      sans-serif, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
      'Segoe UI Emoji', 'Segoe UI Symbol';

    margin: var(--density-spacing-unit);

    --density-spacing-unit: 1em;
    &.day-picker-density-comfortable {
      --density-spacing-unit: 0.75em;
    }
    &.day-picker-density-dense {
      --density-spacing-unit: 0.5em;
    }
  }

  .day-picker-month {
    display: inline-grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .day-picker-month-title {
    grid-column: 1 / 8;
  }
</style>
