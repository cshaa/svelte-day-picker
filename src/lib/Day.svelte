<!-- <svelte:options strictprops={false} /> -->
<script lang="ts">
  import type { Temporal } from '@js-temporal/polyfill';
  import { noop, ignoreUnusedProp } from './utils/misc.js';

  export let day: Temporal.PlainDate;
  export let isWeekend: boolean = false;
  export let isOutside: boolean = false;
  export let isDisabled: boolean = false;
  export let isHidden: boolean = false;
  export let isSelected: boolean = false;
  export let isSelectedStart: boolean = false;
  export let isSelectedEnd: boolean = false;
  export let isPreview: boolean = false;
  export let isPreviewStart: boolean = false;
  export let isPreviewEnd: boolean = false;
  export let isToday: boolean = false;

  export let onClick: (e: MouseEvent) => void = noop;
  export let onMouseDown: (e: MouseEvent) => void = noop;
  export let onMouseUp: (e: MouseEvent) => void = noop;
  export let onMouseEnter: (e: MouseEvent) => void = noop;

  export let disableNavigation: boolean = false;
  ignoreUnusedProp(disableNavigation);

  export let createFormatter: unknown = null;
  ignoreUnusedProp(createFormatter);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<span
  class:day-picker-day={true}
  class:day-picker-weekend={isWeekend}
  class:day-picker-outside={isOutside}
  class:day-picker-disabled={isDisabled}
  class:day-picker-hidden={isHidden}
  class:day-picker-selected={isSelected}
  class:day-picker-selected-start={isSelectedStart}
  class:day-picker-selected-end={isSelectedEnd}
  class:day-picker-preview={isPreview}
  class:day-picker-preview-start={isPreviewStart}
  class:day-picker-preview-end={isPreviewEnd}
  class:day-picker-today={isToday}
  on:click={onClick}
  on:mousedown={onMouseDown}
  on:mouseup={onMouseUp}
  on:mouseenter={onMouseEnter}
  role="button"
  tabindex="0"
>
  <slot {day}>{day.day}</slot>
</span>

<style lang="scss">
  @import './assets.scss';
  .day-picker-day {
    text-align: center;
    padding: calc(0.5 * var(--dp-density-spacing-unit));
    border-radius: 100%;
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  .day-picker-weekend {
    color: var(--dp-weekend-color);
  }

  .day-picker-outside {
    color: var(--dp-outside-color);
  }

  .day-picker-disabled {
    color: var(--dp-disabled-color);
    cursor: default;
  }

  .day-picker-hidden {
    visibility: hidden;
    pointer-events: none;
  }

  .day-picker-today {
    font-weight: bold;
  }

  .day-picker-selected {
    background-color: var(--dp-selected-bg-color);
    color: var(--dp-selected-fg-color);
  }

  .day-picker-preview {
    background-color: var(--dp-preview-bg-color);
    color: var(--dp-preview-fg-color);
  }

  :global(.day-picker-mode-range) {
    .day-picker-selected-start,
    .day-picker-selected-end {
      cursor: ew-resize;
    }

    .day-picker-preview,
    .day-picker-selected.day-picker-outside,
    .day-picker-preview.day-picker-day:not(.day-picker-disabled):not(.day-picker-selected):not(
        .day-picker-outside
      ):hover {
      background-color: var(--dp-preview-bg-color);
    }

    .day-picker-preview:not(.day-picker-preview-start):not(.day-picker-preview-end),
    .day-picker-selected:not(.day-picker-selected-start):not(.day-picker-selected-end) {
      cursor: grab;
      border-radius: 0;
      background-color: unset;
      background-image: horizontal-stripe(var(--dp-preview-bg-color), 20%, 80%);
    }

    .day-picker-preview-start:not(.day-picker-selected):not(.day-picker-preview-end)::after,
    .day-picker-selected-start:not(.day-picker-selected-end)::after,
    .day-picker-selected-end.day-picker-preview-start:not(.day-picker-preview-end)::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 0.3em;
      background-color: unset;
      background-image: horizontal-stripe(var(--dp-preview-bg-color), 20%, 80%);
    }

    .day-picker-preview-end:not(.day-picker-selected):not(.day-picker-preview-start)::before,
    .day-picker-selected-end:not(.day-picker-selected-start)::before,
    .day-picker-selected-start.day-picker-preview-end:not(.day-picker-preview-start)::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 0.3em;
      background-color: unset;
      background-image: horizontal-stripe(var(--dp-preview-bg-color), 20%, 80%);
    }

    .day-picker-selected:not(.day-picker-outside):not(.day-picker-disabled) {
      background-color: var(--dp-selected-bg-color);
      color: #f0f8ff;

      &:not(.day-picker-selected-start):not(.day-picker-selected-end),
      &.day-picker-selected-start:not(.day-picker-selected-end)::after,
      &.day-picker-selected-end:not(.day-picker-selected-start)::before,
      &.day-picker-selected-end.day-picker-preview-start::after,
      &.day-picker-selected-start.day-picker-preview-end::before {
        background-color: unset;
        background-image: horizontal-stripe(var(--dp-selected-bg-color), 20%, 80%);
      }
    }
  }
</style>
