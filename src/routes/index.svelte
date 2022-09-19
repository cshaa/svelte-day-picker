<script lang="ts">
  import DayPicker, { Density, Mode } from '$lib/DayPicker.svelte';
  import type { PlainDate } from '$lib/utils/date';
  let selected: PlainDate[];
  $: console.log(selected);
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<DayPicker
  numberOfMonths={2}
  mode={Mode.Range}
  disabled={{ after: new Date(Date.now() + 2 * 24 * 3600 * 1000) }}
  bind:selected
/>
