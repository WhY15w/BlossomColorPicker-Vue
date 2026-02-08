<template>
  <svg
    ref="sliderRef"
    :width="svgSize"
    :height="svgSize"
    class="absolute pointer-events-none"
    :style="svgStyle"
  >
    <defs>
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        :x1="gradientStart.x"
        :y1="gradientStart.y"
        :x2="gradientEnd.x"
        :y2="gradientEnd.y"
      >
        <stop
          v-for="(color, i) in gradientColors"
          :key="i"
          :offset="`${(i / (arcGradientSteps - 1)) * 100}%`"
          :stop-color="color"
        />
      </linearGradient>
    </defs>

    <!-- Background track -->
    <path
      :d="arcPath"
      fill="none"
      stroke="rgba(0,0,0,0.06)"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
    />

    <!-- Gradient overlay -->
    <path
      :d="arcPath"
      fill="none"
      :stroke="`url(#${gradientId})`"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      class="pointer-events-auto"
      style="cursor: pointer"
      @click="onArcClick"
    />

    <!-- Slider handle -->
    <circle
      :cx="handlePos.x"
      :cy="handlePos.y"
      :r="handleRadius"
      :fill="handleColor"
      stroke="white"
      :stroke-width="2"
      class="pointer-events-auto cursor-grab active:cursor-grabbing"
      :style="handleStyle"
      @mousedown.prevent="startDrag"
      @touchstart.prevent="startDrag"
    />
  </svg>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { BLOOM_EASING, ARC_GRADIENT_STEPS } from '../constants';
import {
  sliderValueToLightness,
  hslToString,
  getVisualSaturation,
} from '../utils';

const props = withDefaults(
  defineProps<{
    value: number;
    hue: number;
    baseSaturation: number;
    isExpanded: boolean;
    barRadius: number;
    barWidth: number;
    sliderOffset: number;
    animationDuration: number;
    onChange: (value: number) => void;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>(),
  {
    position: 'right',
  }
);

const sliderRef = ref<SVGSVGElement | null>(null);
const isDragging = ref(false);

const arcGradientSteps = ARC_GRADIENT_STEPS;

// Unique ID for the gradient
let _uid = 0;
const gradientId = `arc-gradient-${++_uid}-${Math.random().toString(36).slice(2, 7)}`;

const centerAngle = computed(() => {
  switch (props.position) {
    case 'top':
      return -90;
    case 'bottom':
      return 90;
    case 'left':
      return 180;
    case 'right':
    default:
      return 0;
  }
});

const arcRadius = computed(() => props.barRadius + props.sliderOffset);
const halfSweep = 30;

const drawStartAngle = computed(() => centerAngle.value - halfSweep);
const drawEndAngle = computed(() => centerAngle.value + halfSweep);

const valStartAngle = computed(() =>
  props.position === 'left' ? drawEndAngle.value : drawStartAngle.value
);
const valEndAngle = computed(() =>
  props.position === 'left' ? drawStartAngle.value : drawEndAngle.value
);

const strokeWidth = computed(() => props.barWidth);
const handleRadius = computed(() => props.barWidth / 2);

const svgSize = computed(
  () => (arcRadius.value + handleRadius.value + strokeWidth.value) * 2 + 20
);
const center = computed(() => svgSize.value / 2);

const handleAngle = computed(
  () =>
    valStartAngle.value +
    (props.value / 100) * (valEndAngle.value - valStartAngle.value)
);

const handlePos = computed(() =>
  polarToCartesian(
    center.value,
    center.value,
    arcRadius.value,
    handleAngle.value
  )
);

const arcPath = computed(() =>
  describeArc(
    center.value,
    center.value,
    arcRadius.value,
    drawStartAngle.value,
    drawEndAngle.value
  )
);

const svgStyle = computed(() => ({
  left: '50%',
  top: '50%',
  marginLeft: `${-svgSize.value / 2}px`,
  marginTop: `${-svgSize.value / 2}px`,
  opacity: props.isExpanded ? 1 : 0,
  transform: props.isExpanded ? 'scale(1)' : 'scale(0.8)',
  transition: `opacity ${props.animationDuration}ms ${BLOOM_EASING} ${props.animationDuration / 2}ms, transform ${props.animationDuration}ms ${BLOOM_EASING} ${props.animationDuration / 2}ms`,
  zIndex: 50,
}));

const handleLightness = computed(() => sliderValueToLightness(props.value));
const handleSaturation = computed(() =>
  getVisualSaturation(props.value, props.baseSaturation)
);
const handleColor = computed(() =>
  hslToString(props.hue, handleSaturation.value, handleLightness.value)
);

const handleStyle = computed(() => ({
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  transition: isDragging.value
    ? 'none'
    : `cx ${props.animationDuration / 3}ms ease, cy ${props.animationDuration / 3}ms ease`,
}));

const gradientColors = computed(() =>
  Array.from({ length: ARC_GRADIENT_STEPS }, (_, i) => {
    const t = i / (ARC_GRADIENT_STEPS - 1);
    const saturation = getVisualSaturation(t * 100, props.baseSaturation);
    const lightness = 100 - t * 80;
    return hslToString(props.hue, saturation, lightness);
  })
);

const gradientStart = computed(() =>
  polarToCartesian(
    center.value,
    center.value,
    arcRadius.value,
    valStartAngle.value
  )
);
const gradientEnd = computed(() =>
  polarToCartesian(
    center.value,
    center.value,
    arcRadius.value,
    valEndAngle.value
  )
);

// --- helpers ---

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleInDegrees: number
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAng: number,
  endAng: number
) {
  const start = polarToCartesian(cx, cy, r, startAng);
  const end = polarToCartesian(cx, cy, r, endAng);
  const largeArcFlag = Math.abs(endAng - startAng) > 180 ? '1' : '0';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function calculateValueFromMouse(e: MouseEvent | TouchEvent) {
  if (!sliderRef.value) return;

  const rect = sliderRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  let normalizedAngle = angle - centerAngle.value;
  while (normalizedAngle > 180) normalizedAngle -= 360;
  while (normalizedAngle < -180) normalizedAngle += 360;

  normalizedAngle = Math.max(-halfSweep, Math.min(halfSweep, normalizedAngle));

  let newValue: number;
  if (props.position === 'left') {
    newValue = ((halfSweep - normalizedAngle) / (2 * halfSweep)) * 100;
  } else {
    newValue = ((normalizedAngle + halfSweep) / (2 * halfSweep)) * 100;
  }

  props.onChange(Math.round(Math.max(0, Math.min(100, newValue))));
}

function onArcClick(e: MouseEvent) {
  calculateValueFromMouse(e);
}

function startDrag() {
  isDragging.value = true;
}

function onMouseMove(e: MouseEvent) {
  calculateValueFromMouse(e);
}
function onTouchMove(e: TouchEvent) {
  calculateValueFromMouse(e);
}
function onEnd() {
  isDragging.value = false;
}

watch(isDragging, (dragging) => {
  if (dragging) {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);
  } else {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onEnd);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onEnd);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onEnd);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onEnd);
});
</script>
