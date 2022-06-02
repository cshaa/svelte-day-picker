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
</script>
<DayPicker numberOfMonths={2} mode={Mode.Range} bind:selected={selected} />
```
