<script lang="ts">
  import {
    build,
    firstAndRest,
    groupByFirstElement,
    takeFirst,
    takeLast
  } from '$lib/utils/iterable';
  import { DayOfWeek, daysInCalendarPage, weeksInCalendarPage } from '$lib/utils/date';
  import { Temporal } from '@js-temporal/polyfill';
  import { daysInMonth } from '$lib/utils/date';

  let n = 1;
  let arr: number[] = [];

  let iter = build(() => {
    arr.push(n++);
    return arr;
  });
  let [first, rest] = firstAndRest(takeFirst(iter, 100));

  const weeks = weeksInCalendarPage(
    Temporal.Now.plainDate('gregory').toPlainYearMonth(),
    DayOfWeek.Monday
  );
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

{#each [...daysInMonth(Temporal.Now.plainDate('gregory').toPlainYearMonth())] as d}
  {d.day}{' '}
{/each}

<hr />

{#each [...weeks] as w}
  <div>
    {#each w as d}
      <span>{d.day}&nbsp;</span>
    {/each}
  </div>
{/each}
