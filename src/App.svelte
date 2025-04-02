<script lang="ts">
  import DayPicker, { Mode } from './lib/DayPicker.svelte';
  import type { PlainDate } from './lib/utils/date';

  let selected: PlainDate[];
  $: firstDate = selected?.at(0);
  $: lastDate = selected?.at(-1);
</script>

<main>
  <h1>Svelte Day Picker Demo</h1>

  <div class="demo">
    <h2>Selected dates:</h2>
    {#if firstDate && lastDate && firstDate === lastDate}
      <p>Selected: {firstDate?.toLocaleString()}</p>
    {:else if firstDate && lastDate}
      <p>From: {firstDate?.toLocaleString()} to: {lastDate?.toLocaleString()}</p>
    {:else}
      <p>No dates selected</p>
    {/if}

    <DayPicker
      numberOfMonths={2}
      mode={Mode.Range}
      disabled={{ after: new Date(Date.now() + 30 * 24 * 3600 * 1000) }}
      bind:selected
    />
  </div>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .demo {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h1 {
    color: #333;
  }

  h2 {
    color: #666;
    font-size: 1.2rem;
  }
</style>
