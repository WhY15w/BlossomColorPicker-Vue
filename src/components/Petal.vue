<template>
  <button
    type="button"
    :class="[
      'absolute rounded-full focus:outline-none',
      isInvisible ? '' : 'focus:ring-2 focus:ring-white/50',
    ]"
    :style="buttonStyle"
    :aria-label="`Select color hue ${hue}`"
    :tabindex="isExpanded ? 0 : -1"
    @click="onClick?.()"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BLOOM_EASING } from '../constants';
import { hslToString, hslaToString } from '../utils';

const props = withDefaults(
  defineProps<{
    hue: number;
    saturation: number;
    lightness: number;
    index: number;
    totalPetals: number;
    isExpanded: boolean;
    petalSize: number;
    radius: number;
    animationDuration: number;
    staggerDelay: number;
    zIndex: number;
    rotationOffset?: number;
    alpha?: number;
    clip?: 'left' | 'right';
    isExternalHover?: boolean;
    pointerEvents?: 'auto' | 'none';
    hasShadow?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }>(),
  {
    rotationOffset: 0,
    alpha: 1,
    clip: undefined,
    isExternalHover: undefined,
    pointerEvents: 'auto',
    hasShadow: true,
    onClick: undefined,
    onMouseEnter: undefined,
    onMouseLeave: undefined,
  }
);

const internalHover = ref(false);

const isHovered = computed(() => props.isExternalHover ?? internalHover.value);

const handleMouseEnter = () => {
  internalHover.value = true;
  props.onMouseEnter?.();
};

const handleMouseLeave = () => {
  internalHover.value = false;
  props.onMouseLeave?.();
};

const isInvisible = computed(() => props.alpha === 0);

const buttonStyle = computed(() => {
  const angle =
    (props.index / props.totalPetals) * 360 - 90 + props.rotationOffset;
  const radian = (angle * Math.PI) / 180;
  const x = Math.cos(radian) * props.radius;
  const y = Math.sin(radian) * props.radius;

  const color =
    props.alpha < 1
      ? hslaToString(
          props.hue,
          props.saturation,
          props.lightness,
          props.alpha * 100
        )
      : hslToString(props.hue, props.saturation, props.lightness);

  const scale = isHovered.value ? 1.1 : 1;

  const clipStyle: Record<string, string> =
    props.clip === 'left'
      ? { clipPath: 'polygon(0% -10%, 60% -10%, 60% 110%, 0% 110%)' }
      : props.clip === 'right'
        ? { clipPath: 'polygon(40% -10%, 100% -10%, 100% 110%, 40% 110%)' }
        : {};

  const stagger = props.isExpanded && !isHovered.value ? props.staggerDelay : 0;

  return {
    width: `${props.petalSize}px`,
    height: `${props.petalSize}px`,
    backgroundColor: color,
    transform: props.isExpanded
      ? `translate(${x}px, ${y}px) scale(${scale})`
      : 'translate(0, 0) scale(0)',
    opacity: props.isExpanded ? 1 : 0,
    filter:
      isHovered.value && !isInvisible.value
        ? 'brightness(1.1)'
        : 'brightness(1)',
    transition: `transform ${props.animationDuration}ms ${BLOOM_EASING} ${stagger}ms,
                 opacity ${props.animationDuration}ms ${BLOOM_EASING} ${stagger}ms,
                 background-color 200ms ease,
                 box-shadow 200ms ease,
                 filter 200ms ease`,
    boxShadow:
      props.hasShadow && !isInvisible.value
        ? isHovered.value
          ? '0 4px 12px rgba(0,0,0,0.25)'
          : '0 2px 6px rgba(0,0,0,0.15)'
        : 'none',
    left: '50%',
    top: '50%',
    marginLeft: `${-props.petalSize / 2}px`,
    marginTop: `${-props.petalSize / 2}px`,
    zIndex: props.zIndex,
    pointerEvents: props.pointerEvents,
    ...clipStyle,
  } as Record<string, string | number>;
});
</script>
