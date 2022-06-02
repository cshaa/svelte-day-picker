<script lang="ts">
  import type { Temporal, Intl } from '@js-temporal/polyfill';
  import NavIcon, { Direction } from './NavIcon.svelte';

  export let month: Temporal.PlainYearMonth;
  export let first: boolean;
  export let last: boolean;
  export let disableNavigation: boolean;
  export let createFormatter: (options: Intl.DateTimeFormatOptions) => Intl.DateTimeFormat;
  export let navigateLeft: () => void;
  export let navigateRight: () => void;

  export let index: number = 0;

  $: formatter = createFormatter({
    month: 'long',
    year: 'numeric'
  });
</script>

<div>
  {#if first && !disableNavigation}
    <span class:day-picker-month-navbutton={true} on:click={navigateLeft}>
      <NavIcon direction={Direction.Left} />
    </span>
  {:else}
    <span class:day-picker-month-space={true} />
  {/if}
  <span class:day-picker-month-caption={true}>
    {formatter.format(month)}
  </span>
  {#if last && !disableNavigation}
    <span class:day-picker-month-navbutton={true} on:click={navigateRight}>
      <NavIcon direction={Direction.Right} />
    </span>
  {:else}
    <span class:day-picker-month-space={true} />
  {/if}
</div>

<style lang="scss">
  div {
    display: flex;
    flex-direction: row;
    align-items: center;

    margin-bottom: calc(0.7 * var(--dp-density-spacing-unit));
  }

  .day-picker-month-navbutton {
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .day-picker-month-navbutton,
  .day-picker-month-space {
    width: 16px;
  }

  .day-picker-month-caption {
    flex-grow: 1;
    text-align: center;
    font-weight: bold;
  }
</style>
