<script lang="ts">
  import DayPicker, { Density, Mode } from '$lib/DayPicker.svelte';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<DayPicker numberOfMonths={2} mode={Mode.Range} />
