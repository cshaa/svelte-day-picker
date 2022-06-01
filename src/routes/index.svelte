<script lang="ts">
  import DayPicker, { Density } from '$lib/DayPicker.svelte';
  import { Intl } from '@js-temporal/polyfill';

  console.log(Intl.DateTimeFormat(undefined, { weekday: "short" }).formatToParts(new Date()));
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<DayPicker density={Density.Sparse} />
