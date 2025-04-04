<script lang="ts">
  import type { Temporal, Intl } from '@js-temporal/polyfill';
  import NavIcon, { Direction } from './NavIcon.svelte';
  import { ignoreUnusedProp } from './utils/misc';

  export let month: Temporal.PlainYearMonth;
  export let first: boolean;
  export let last: boolean;
  export let disableNavigation: boolean;
  export let createFormatter: (_options: Intl.DateTimeFormatOptions) => Intl.DateTimeFormat;
  export let navigateLeft: () => void;
  export let navigateRight: () => void;

  export let index: number = 0;
  ignoreUnusedProp(index);

  function preventDoubleClickSelection(e: MouseEvent) {
    if (e.detail > 1) {
      e.preventDefault();
    }
  }

  $: formatter = createFormatter({
    month: 'long',
    year: 'numeric'
  });
</script>

<div on:mousedown={preventDoubleClickSelection} role="row" tabindex="-1">
  {#if first && !disableNavigation}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <span
      class:day-picker-month-navbutton={true}
      on:click={navigateLeft}
      role="button"
      tabindex="0"
    >
      <NavIcon direction={Direction.Left} />
    </span>
  {:else}
    <span class:day-picker-month-space={true}></span>
  {/if}
  <span class:day-picker-month-caption={true}>
    {formatter.format(month)}
  </span>
  {#if last && !disableNavigation}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <span
      class:day-picker-month-navbutton={true}
      on:click={navigateRight}
      role="button"
      tabindex="0"
    >
      <NavIcon direction={Direction.Right} />
    </span>
  {:else}
    <span class:day-picker-month-space={true}></span>
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
    width: var(--dp-navicon-size, 1em);
  }

  .day-picker-month-caption {
    flex-grow: 1;
    text-align: center;
    font-weight: bold;
  }
</style>
