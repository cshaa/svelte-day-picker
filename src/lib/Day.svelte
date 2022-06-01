<!-- <svelte:options strictprops={false} /> -->

<script lang="ts">
  import type { Temporal } from '@js-temporal/polyfill';

  export let day: Temporal.PlainDate;
  export let isWeekend: boolean;
  export let isOutside: boolean;

  export let disableNavigation: boolean = false;
  export let createFormatter: any = null;
</script>

<span
  class:day-picker-day={true}
  class:day-picker-weekend={isWeekend}
  class:day-picker-outside={isOutside}
>
  <slot {day}>{day.day}</slot>
</span>

<style lang="scss">
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
