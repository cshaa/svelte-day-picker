<script lang="ts" context="module">
  import { Temporal, toTemporalInstant } from '@js-temporal/polyfill';
  import { DayOfWeek, toPlainMonth } from '$lib/utils/date';
  import type { Month } from '$lib/utils/date';

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
