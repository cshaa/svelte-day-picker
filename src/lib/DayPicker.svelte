<script lang="ts" context="module">
  import { Temporal, Intl as TIntl } from '@js-temporal/polyfill';
  import {
    DayOfWeek,
    daysInCalendarPage,
    toPlainMonth,
    PlainDate,
    PlainDateRange,
    Duration
  } from '$lib/utils/date';
  import type { Month } from '$lib/utils/date';
  import { assertSome } from '$lib/utils/misc';
  import { enumerate, map, range, takeFirst } from './utils/iterable';

  const { round } = Math;

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

  export enum Mode {
    None,
    Single,
    Multiple,
    Range
  }

  export interface DayModifiers {
    isOutside: boolean;
    isWeekend: boolean;
    isDisabled: boolean;
    isSelected: boolean;
    isSelectedStart: boolean;
    isSelectedEnd: boolean;
    isPreview: boolean;
    isPreviewStart: boolean;
    isPreviewEnd: boolean;
  }

  enum ClickState {
    Empty = 0,
    FirstDaySelected,
    RangeSelected
  }

  enum Dragging {
    None = 0,
    MightDrag,
    From,
    To,
    Range,
    PostDrag
  }

  export { DayOfWeek, Month };
</script>

<script lang="ts">
  import Day from './Day.svelte';
  import DayHeading from './DayHeading.svelte';
  import MonthTitle from './MonthTitle.svelte';

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

  $: createFormatter = (options: TIntl.DateTimeFormatOptions) =>
    TIntl.DateTimeFormat(locale.baseName, {
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

  /** Selection mode – whether to select a single day, multiple days or a range. */
  export let mode: Mode = Mode.Single;

  /** A `bind:` property containing all the selected dates. */
  export let selected: PlainDate[] = [];

  /** A `bind:` property containing the selected range – if the mode is Mode.Range */
  export let selectedRange: PlainDateRange | undefined = undefined;

  let preview: PlainDate[] = [];
  let previewRange: PlainDateRange | undefined = undefined;
  let rangeClickState: ClickState = ClickState.Empty;
  let rangeDragging: Dragging = Dragging.None;
  let dragReference: PlainDate | undefined;
  let preDragSelected: PlainDateRange | undefined;

  $: {
    if (mode === Mode.Range) {
      preview = previewRange ? PlainDateRange.toArray(previewRange) : [];
      selected = selectedRange ? PlainDateRange.toArray(selectedRange) : [];
    } else {
      preview = [];
      previewRange = undefined;
      selectedRange = undefined;
    }
  }
  $: {
    if (selectedRange === undefined && rangeClickState !== ClickState.Empty) {
      rangeClickState = ClickState.Empty;
    }
  }

  const getRangePreview = (day: PlainDate): PlainDateRange => {
    const { from, to } = selectedRange ?? {};

    switch (rangeClickState) {
      case ClickState.Empty:
        return { from: day, to: day };

      case ClickState.FirstDaySelected:
        if (PlainDate.lt(day, from!)) return { from: day, to: to! };
        else return { from: from!, to: day };

      case ClickState.RangeSelected:
        if (PlainDate.lt(day, from!)) return { from: day, to: to! };
        else if (PlainDate.gt(day, to!)) return { from: from!, to: day };
        else if (Duration.lt(from!.until(day), day.until(to!))) return { from: day, to: to! };
        else return { from: from!, to: day };
    }
  };

  const navigateLeft = () => (month_ = month_.subtract({ months: 1 }));
  const navigateRight = () => (month_ = month_.add({ months: 1 }));

  const onDayClick = (day: PlainDate, mods: DayModifiers) => (e: MouseEvent) => {
    switch (mode) {
      case Mode.None:
        return;

      case Mode.Single:
        selected = [day];
        return;

      case Mode.Multiple:
        const i = selected.findIndex(d => d.equals(day));
        if (i === -1) selected.push(day), selected.sort(Temporal.PlainDate.compare);
        else selected.splice(i, 1);
        selected = selected;
        return;

      case Mode.Range: {
        if (rangeDragging !== Dragging.None) {
          rangeDragging = Dragging.None;
          dragReference = undefined;
          preDragSelected = undefined;
          return;
        }

        if (mods.isOutside /*|| mods.disabled */) return;

        let prev = getRangePreview(day);
        switch (rangeClickState) {
          case ClickState.Empty:
            rangeClickState = ClickState.FirstDaySelected;
            break;

          case ClickState.FirstDaySelected:
            rangeClickState = ClickState.RangeSelected;
            break;

          case ClickState.RangeSelected:
            break;
        }
        selectedRange = prev;
      }
    }
  };

  const onDayMouseEnter = (day: PlainDate, mods: DayModifiers) => (e: MouseEvent): void => {
    if (mode !== Mode.Range) {
      preview = [];
      return;
    }

    let prev: PlainDateRange | undefined, sel: PlainDateRange | undefined;
    const { from, to } = selectedRange ?? {};

    switch (rangeClickState) {
      case ClickState.FirstDaySelected:
        prev = getRangePreview(day);
        break;
    }

    switch (rangeDragging) {
      case Dragging.From:
        sel = { from: day, to: assertSome(to) };
        break;

      case Dragging.To:
        sel = { from: assertSome(from), to: day };
        break;

      case Dragging.Range: {
        const { from, to } = assertSome(preDragSelected);
        const days = round(assertSome(dragReference).until(day).total('days'));
        sel = { from: from.add({ days }), to: to.add({ days }) };
        break;
      }

      case Dragging.MightDrag: {
        const ref = assertSome(dragReference);
        const { from, to } = assertSome(preDragSelected);

        if (!day.equals(ref)) {
          if (ref.equals(from)) rangeDragging = Dragging.From;
          else if (ref.equals(to)) rangeDragging = Dragging.To;
          else if (PlainDate.isBetween(ref, from, to)) rangeDragging = Dragging.Range;
          else rangeDragging = Dragging.None;

          return onDayMouseEnter(day, mods)(e);
        }

        break;
      }
    }

    if (sel && PlainDate.gt(sel.from, sel.to)) {
      [sel.from, sel.to] = [sel.to, sel.from];
      if (rangeDragging === Dragging.From) rangeDragging = Dragging.To;
      else if (rangeDragging === Dragging.To) rangeDragging = Dragging.From;
    }

    if (sel) {
      previewRange = prev;
      selectedRange = sel;
    } else {
      previewRange = prev;
    }
  };

  const onDayMouseDown = (day: PlainDate, mods: DayModifiers) => (e: MouseEvent) => {};
  const onDayMouseUp = (day: PlainDate, mods: DayModifiers) => (e: MouseEvent) => {};
</script>

<div
  class:day-picker={true}
  class:day-picker-density-sparse={density === Density.Sparse}
  class:day-picker-density-medium={density === Density.Medium}
  class:day-picker-density-dense={density === Density.Dense}
  class:day-picker-mode-none={mode === Mode.None}
  class:day-picker-mode-single={mode === Mode.Single}
  class:day-picker-mode-multiple={mode === Mode.Multiple}
  class:day-picker-mode-range={mode === Mode.Range}
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
        {@const isDisabled = false}
        {@const isSelected = !!selected.find(d => d.equals(day))}
        {@const isSelectedStart = selected[0]?.equals(day) ?? false}
        {@const isSelectedEnd = selected[selected.length - 1]?.equals(day) ?? false}
        {@const isPreview = !!preview.find(d => d.equals(day))}
        {@const isPreviewStart = preview[0]?.equals(day) ?? false}
        {@const isPreviewEnd = preview[preview.length - 1]?.equals(day) ?? false}
        {@const modifiers = {
          isWeekend,
          isOutside,
          isDisabled,
          isSelected,
          isSelectedStart,
          isSelectedEnd,
          isPreview,
          isPreviewStart,
          isPreviewEnd
        }}
        {@const onMouseEnter = onDayMouseEnter(day, modifiers)}
        {@const onMouseDown = onDayMouseDown(day, modifiers)}
        {@const onMouseUp = onDayMouseUp(day, modifiers)}
        {@const onClick = onDayClick(day, modifiers)}
        {@const dayProps = {
          day,
          ...modifiers,
          disableNavigation,
          createFormatter,
          onClick,
          onMouseUp,
          onMouseDown,
          onMouseEnter
        }}

        <slot name="day" {...dayProps}><Day {...dayProps} /></slot>
      {/each}
    </div>
  {/each}
</div>

<style lang="scss">
  .day-picker {
    display: inline-flex;
    align-items: flex-start;
    margin: var(--dp-density-spacing-unit);
    column-gap: calc(1.2 * var(--dp-density-spacing-unit));

    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans',
      sans-serif, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
      'Segoe UI Emoji', 'Segoe UI Symbol';

    --dp-selected-bg-color: #4a90e2;
    --dp-preview-bg-color: #bebebe;
    --dp-selected-fg-color: white;
    --dp-preview-fg-color: black;
  }

  .day-picker-density-sparse {
    --dp-density-spacing-unit: 1em;
  }
  .day-picker-density-medium {
    --dp-density-spacing-unit: 0.75em;
  }
  .day-picker-density-dense {
    --dp-density-spacing-unit: 0.5em;
  }

  .day-picker-month {
    display: inline-grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .day-picker-month-title {
    grid-column: 1 / 8;
  }
</style>
