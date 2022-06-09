# svelte-day-picker

A solid calendar component for Svelte and drop-in replacement for [React Day Picker](https://react-day-picker.js.org/). Uses the [Temporal API](https://2ality.com/2021/06/temporal-api.html) to handle dates, although it is also backwards-compatible with `Date`.

## Installation
```bash
yarn add svelte-day-picker
# OR
npm install svelte-day-picker
```

## Example Usage
```svelte
<script>
  import DayPicker, { Mode } from 'svelte-day-picker';
  let selected;
  $: first = selected?.at(0);
  $: last = selected?.at(-1);
</script>
<span>From {first?.toLocaleString()} to {last?.toLocaleString()}</span>
<DayPicker numberOfMonths={2} mode={Mode.Range} bind:selected={selected} />
```
[**Try it!**](https://svelte.dev/repl/0f027084f8c2485483a3e5ccb6287acf?version=3.48.0)

# API
## `<DayPicker />`
### DayPicker Props
  * <a id=daypicker.locale href=#daypicker.locale>`locale`</a>
    * Type: `string | Intl.Locale`
    * Default: The user's current locale
    * Description: Selects default calendar options and corresponding translation strings, if available

  * <a id=daypicker.calendar href=#daypicker.calendar> `calendar`</a>
    * Type: `string | Temporal.CalendarProtocol`
    * Default: Current locale's calendar — typically `'gregory'`
    * Description: Either a [Unicode Calendar Identifier](https://github.com/unicode-org/cldr/blob/main/common/bcp47/calendar.xml#L12) of a calendar type, or a custom calendar according to the [Temporal Calendar Protocol](https://tc39.es/proposal-temporal/docs/calendar.html#custom-calendars). Most of the world uses `'gregory'` or `'iso8601'` (which are almost the same), but other calendar identifiers include `'buddhist'`, `'chinese'`, `'hebrew'`, `'islamic'`.

  * <a id=daypicker.timezone href=#daypicker.timezone>`timeZone`</a>
    * Type: `string`
    * Default: Current locale's time zone
    * Description: Time zone to resolve today's date.

  * <a id=daypicker.weekstart href=#daypicker.weekstart>`weekStart`</a>
    * Type: (enum) `DayOfWeek`
    * Default: Current locale's week start
    * Description: Which day (Monday, Tuesday, ...) is considered the first day of the week.

  * <a id=daypicker.weekend href=#daypicker.weekend>`weekend`</a>
    * Type: (enum) `DayOfWeek[]`
    * Default: Current locale's weekend
    * Description: Days that are considered a weekend. They [needen't be two](https://en.wikipedia.org/wiki/Workweek_and_weekend#Friday_weekend_(One_day_weekend)), [nor contiguous](https://en.wikipedia.org/wiki/Workweek_and_weekend#Non-contiguous_working_week).

  * <a id=daypicker.numberofmonths href=#daypicker.numberofmonths>`numberOfMonths`</a>
    * Type: `number` (positive integer)
    * Default: `1`
    * Description: The number of consecutive months to show.

  * <a id=daypicker.defaultmonth href=#daypicker.defaultmonth>`defaultMonth`</a>
    * Type: `Date | Temporal.PlainYearMonthLike`
    * Default: The current month.
    * Description: When first loaded, the calendar will show this month.

  * <a id=daypicker.month href=#daypicker.month>`bind:month`</a>
    * Type: `Date | Temporal.PlainYearMonthLike`
    * Description: A `bind:` propery controling the current month.

  * <a id=daypicker.disablenavigation href=#daypicker.disablenavigation>`disableNavigation`</a>
    * Type: `boolean`
    * Default: `false`
    * Description: Forbid the user from navigating to a different month.

  * <a id=daypicker.density href=#daypicker.density>`density`</a>
    * Type: (enum) `Density`
    * Default: `Density.Sparse`
    * Description: Typographic density of the UI.

  * <a id=daypicker.mode href=#daypicker.mode>`mode`</a>
    * Type: (enum) `Mode`
    * Default: `Mode.Single`
    * Description: Selection mode – whether to select a single day, multiple days or a range.

  * <a id=daypicker.selected href=#daypicker.selected>`bind:selected`</a>
    * Type: `Temporal.PlainDate[]`
    * Default: `[]`
    * Description: A `bind:` property containing all the selected dates.

  * <a id=daypicker.selectedrange href=#daypicker.selectedrange>`bind:selectedRange`</a>
    * Type: `{ from: Temporal.PlainDate, to: Temporal.PlainDate } | undefined`
    * Default: `undefined`
    * Description: A `bind:` property containing the selected range, if the mode is `Mode.Range`.

### DayPicker Slots
  * <a id="daypicker>month-title" href="#daypicker>month-title">`month-title`</a>
    * The element that renders above each month. By default it's the month's name (for example _“January 2022”_) and navigation buttons forward & backward.
    * Default implementation: `<MonthTitle />`

  * <a id="daypicker>day-heading" href="#daypicker>day-heading">`day-heading`</a>
    * The days of week that appear as column headers of the calendar.
    * Default implementation `<DayHeading />`

  * <a id="daypicker>day" href="#daypicker>day">`day`</a>
    * The individual days in the month.
    * Default implementation `<Day />`


# Roadmap
 * [ ] Improve documentation
 * [ ] Implement SSR
 * [ ] Feature-parity with React Day Picker
 * [ ] Improve UX on touch devices
 * [ ] Keyboard navigation & ARIA
