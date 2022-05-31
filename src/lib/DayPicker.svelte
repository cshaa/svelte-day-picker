<script lang="ts" context="module">
  import { Temporal, Intl as TIntl } from '@js-temporal/polyfill';
  import { DayOfWeek, daysInCalendarPage, toPlainMonth } from '$lib/utils/date';
  import type { Month } from '$lib/utils/date';
  import { map, range } from './utils/iterable';

  export interface Locale extends Intl.Locale {
    weekInfo?: {
      firstDay: DayOfWeek;
      weekend: DayOfWeek[];
      minimalDays: number;
    };
  }

  export enum Density {
    Default,
    Comfortable,
    Dense
  }

  export { DayOfWeek, Month };
</script>

<script lang="ts">
  import { ordinalOfDayInWeek } from './utils/date';

  /** Locale – selects default calendar options and corresponding translation strings, if available */
  export let locale: Locale = new Intl.Locale(TIntl.DateTimeFormat().resolvedOptions().locale);
  $: resolvedOptions = TIntl.DateTimeFormat(
    locale.baseName
  ).resolvedOptions() as Partial<Intl.ResolvedDateTimeFormatOptions>;

  /**
   * Either a Unicode Calendar Identifier of a calendar type, or a custom calendar according to the
   * Temporal Calendar Protocol. Most of the world uses 'gregory' or 'iso8601' (which is almost the same),
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

  $: formatter = TIntl.DateTimeFormat(locale.baseName, {
    calendar,
    timeZone,
    month: 'long',
    year: 'numeric',
    weekday: 'short',
    day: 'numeric'
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

  /** When first loaded, the calendar will show this month. */
  export let defaultMonth: Month | undefined = undefined;

  /** A `bind:` propery controling the current month. */
  export let month = defaultMonth;
  $: month_ = toPlainMonth(month ?? Temporal.Now.plainDate(calendar_), timeZone_, calendar_);

  /** The number of consecutive months to show */
  export let numberOfMonths = 1;

  /** Forbid the user from navigating to a different month */
  export let disableNavigation = false;

  /** Typographic density of the UI */
  export let density: Density = Density.Default;

  const yieldDays = (m: Temporal.PlainYearMonth) => daysInCalendarPage(m, weekStart_);

  $: months = [...map(range(numberOfMonths), m => month_.add({ months: m }))];
</script>

<div
  class:day-picker={true}
  class:day-picker-density-comfortable={density === Density.Comfortable}
  class:day-picker-density-dense={density === Density.Dense}
>
  {#each months as m}
    <div class:day-picker-month={true}>
      <div class:day-picker-month-caption={true}>
        <slot name="month-title" month={m} {formatter}>
          {formatter.format(m)}
        </slot>
      </div>
      {#each [...range(7)] as i}
        <span class:day-picker-day={true} class:day-picker-day-heading={true} />
      {/each}
      {#each [...yieldDays(m)] as d}
        <span
          class:day-picker-day={true}
          class:day-picker-weekend={weekend_.has(d.dayOfWeek)}
          class:day-picker-outside={!m.equals(d.toPlainYearMonth())}
          data-day-ordinal={ordinalOfDayInWeek(d, weekStart_)}
        >
          <slot name="day" day={d}>{d.day}</slot>
        </span>
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

  .day-picker-month-caption {
    grid-column: 1 / 8;
    text-align: center;
    font-weight: bold;
  }

  .day-picker-day {
    text-align: center;
    padding: calc(0.5 * var(--density-spacing-unit));
  }

  .day-picker-weekend {
    color: red;
  }

  .day-picker-outside {
    color: darkgray;
  }
</style>
