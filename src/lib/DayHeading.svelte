<!-- <svelte:options strictprops={false} /> -->

<script lang="ts">
  import type { Temporal, Intl } from '@js-temporal/polyfill';
  import Day from './Day.svelte';

  export let day: Temporal.PlainDate;
  export let isWeekend: boolean;
  export let createFormatter: (options: Intl.DateTimeFormatOptions) => Intl.DateTimeFormat;
  
  $: formatter = createFormatter({ weekday: 'short' });
</script>

<span class:day-picker-day={true} class:day-picker-day-heading={true}>
  <Day {day} {isWeekend} isOutside={false}>
    {formatter.format(day)}
  </Day>
</span>

<style lang="scss">
  .day-picker-day-heading {
      font-weight: bold;
  }
</style>
