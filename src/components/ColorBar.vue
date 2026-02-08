<template>
  <svg
    :width="size"
    :height="size"
    class="absolute pointer-events-none"
    :style="svgStyle"
  >
    <!-- Background track -->
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      stroke="rgba(0,0,0,0.06)"
      :stroke-width="barWidth"
    />
    <!-- Color overlay -->
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      :stroke="color"
      :stroke-width="barWidth"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BLOOM_EASING } from '../constants';
import { hslaToString } from '../utils';

const props = defineProps<{
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  radius: number;
  barWidth: number;
  isExpanded: boolean;
  animationDuration: number;
}>();

const size = computed(() => (props.radius + props.barWidth / 2) * 2 + 4);
const color = computed(() =>
  hslaToString(props.hue, props.saturation, props.lightness, props.alpha)
);

const svgStyle = computed(() => ({
  left: '50%',
  top: '50%',
  marginLeft: `${-size.value / 2}px`,
  marginTop: `${-size.value / 2}px`,
  opacity: props.isExpanded ? 1 : 0,
  transform: props.isExpanded ? 'scale(1)' : 'scale(0.8)',
  transition: `opacity ${props.animationDuration}ms ${BLOOM_EASING}, transform ${props.animationDuration}ms ${BLOOM_EASING}`,
  zIndex: 5,
}));
</script>
