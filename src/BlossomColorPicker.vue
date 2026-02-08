<template>
  <div
    :class="['relative inline-flex items-center justify-center', className]"
    :style="{
      width: `${coreSize}px`,
      height: `${coreSize}px`,
    }"
    role="group"
    aria-label="Color picker">
    <div
      ref="containerRef"
      class="absolute flex items-center justify-center"
      :style="{
        width: `${isExpanded ? containerSize : coreSize}px`,
        height: `${isExpanded ? containerSize : coreSize}px`,
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${shiftOffset.x}px), calc(-50% + ${shiftOffset.y}px))`,
        transition: `width ${animationDuration}ms ${BLOOM_EASING}, height ${animationDuration}ms ${BLOOM_EASING}, transform ${animationDuration}ms ${BLOOM_EASING}`,
        zIndex: isExpanded ? 50 : 0,
      }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave">
      <!-- Background fill -->
      <div
        class="absolute rounded-full pointer-events-none bg-white"
        :style="{
          width: `${(barRadius + BAR_WIDTH / 2) * 2}px`,
          height: `${(barRadius + BAR_WIDTH / 2) * 2}px`,
          opacity: isExpanded ? 1 : 0,
          transform: isExpanded ? 'scale(1)' : 'scale(0.8)',
          transition: `opacity ${animationDuration}ms ${BLOOM_EASING}, transform ${animationDuration}ms ${BLOOM_EASING}`,
          zIndex: 0,
        }">
        <div
          class="absolute inset-0 rounded-full"
          :style="{
            backgroundColor: hslaToString(
              currentValue.hue,
              currentValue.saturation,
              currentLightness,
              15
            ),
            transition: `background-color ${animationDuration}ms ease`,
          }" />
      </div>

      <!-- Color Bar -->
      <ColorBar
        :hue="currentValue.hue"
        :saturation="
          getVisualSaturation(currentValue.saturation, baseSaturation)
        "
        :lightness="currentLightness"
        :alpha="currentValue.alpha"
        :radius="barRadius"
        :bar-width="BAR_WIDTH"
        :is-expanded="isExpanded"
        :animation-duration="animationDuration" />

      <!-- Dynamic Layers -->
      <template
        v-for="(layerColors, layerIdx) in layers"
        :key="layerIdx">
        <template
          v-for="(color, index) in layerColors"
          :key="`layer-${layerIdx}-${color.h}-${index}`">
          <!-- Special handling for the bottom petal (split rendering) -->
          <template v-if="index === getBottomIndex(layerColors.length)">
            <!-- Visual Left Half (Lowest Z) -->
            <Petal
              :hue="color.h"
              :saturation="color.s"
              :lightness="color.l"
              :index="index"
              :total-petals="layerColors.length"
              :is-expanded="isExpanded"
              :petal-size="petalSize"
              :radius="layerRadii[layerIdx]"
              :animation-duration="animationDuration"
              :stagger-delay="
                layerPrefixCounts[layerIdx] * PETAL_STAGGER +
                index * PETAL_STAGGER
              "
              :z-index="
                getPetalZIndex(
                  index,
                  getBottomIndex(layerColors.length),
                  layerColors.length,
                  layerIdx,
                  layers.length,
                  true,
                  false
                )
              "
              clip="left"
              :is-external-hover="
                hoveredPetal?.layer === layerIdx &&
                hoveredPetal?.index === index
              "
              pointer-events="none"
              :has-shadow="false"
              :rotation-offset="layerRotations[layerIdx]"
              :alpha="1" />
            <!-- Visual Right Half (Highest Z) -->
            <Petal
              :hue="color.h"
              :saturation="color.s"
              :lightness="color.l"
              :index="index"
              :total-petals="layerColors.length"
              :is-expanded="isExpanded"
              :petal-size="petalSize"
              :radius="layerRadii[layerIdx]"
              :animation-duration="animationDuration"
              :stagger-delay="
                layerPrefixCounts[layerIdx] * PETAL_STAGGER +
                index * PETAL_STAGGER
              "
              :z-index="
                getPetalZIndex(
                  index,
                  getBottomIndex(layerColors.length),
                  layerColors.length,
                  layerIdx,
                  layers.length,
                  false,
                  true
                )
              "
              clip="right"
              :is-external-hover="
                hoveredPetal?.layer === layerIdx &&
                hoveredPetal?.index === index
              "
              pointer-events="none"
              :has-shadow="false"
              :rotation-offset="layerRotations[layerIdx]"
              :alpha="1" />
            <!-- Interaction Layer (Top of this petal's stack, Transparent) -->
            <Petal
              :hue="color.h"
              :saturation="color.s"
              :lightness="color.l"
              :index="index"
              :total-petals="layerColors.length"
              :is-expanded="isExpanded"
              :petal-size="petalSize"
              :radius="layerRadii[layerIdx]"
              :animation-duration="animationDuration"
              :stagger-delay="
                layerPrefixCounts[layerIdx] * PETAL_STAGGER +
                index * PETAL_STAGGER
              "
              :z-index="
                (layers.length - layerIdx) * 100 + layerColors.length + 20
              "
              :alpha="0"
              :has-shadow="false"
              :rotation-offset="layerRotations[layerIdx]"
              @click="handlePetalClick(color, layerIdx)"
              @mouseenter="hoveredPetal = { layer: layerIdx, index }"
              @mouseleave="hoveredPetal = null" />
          </template>

          <!-- Normal rendering (Full petal) -->
          <Petal
            v-else
            :hue="color.h"
            :saturation="color.s"
            :lightness="color.l"
            :index="index"
            :total-petals="layerColors.length"
            :is-expanded="isExpanded"
            :petal-size="petalSize"
            :radius="layerRadii[layerIdx]"
            :animation-duration="animationDuration"
            :stagger-delay="
              layerPrefixCounts[layerIdx] * PETAL_STAGGER +
              index * PETAL_STAGGER
            "
            :z-index="
              getPetalZIndex(
                index,
                getBottomIndex(layerColors.length),
                layerColors.length,
                layerIdx,
                layers.length
              )
            "
            :is-external-hover="
              hoveredPetal?.layer === layerIdx && hoveredPetal?.index === index
            "
            :has-shadow="false"
            :rotation-offset="layerRotations[layerIdx]"
            @click="handlePetalClick(color, layerIdx)"
            @mouseenter="hoveredPetal = { layer: layerIdx, index }"
            @mouseleave="hoveredPetal = null" />
        </template>
      </template>

      <!-- Arc Slider -->
      <ArcSlider
        v-if="showAlphaSlider"
        :value="currentValue.saturation"
        :hue="currentValue.hue"
        :base-saturation="baseSaturation"
        :is-expanded="isExpanded"
        :bar-radius="barRadius"
        :bar-width="BAR_WIDTH"
        :slider-offset="SLIDER_OFFSET"
        :animation-duration="animationDuration"
        :position="effectivePosition"
        @change="handleSliderChange" />

      <!-- Core circle -->
      <button
        type="button"
        :disabled="disabled"
        class="relative rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        :style="{
          width: `${coreSize}px`,
          height: `${coreSize}px`,
          backgroundColor: coreColor,
          transform: isExpanded
            ? 'scale(1)'
            : isHovering
            ? 'scale(1.05)'
            : 'scale(1)',
          boxShadow: isExpanded
            ? '0 0 0 2px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.15)',
          transition: `transform ${animationDuration}ms ${BLOOM_EASING}, box-shadow ${animationDuration}ms ${BLOOM_EASING}`,
          zIndex: 1000,
        }"
        :aria-label="`Current color: hue ${currentValue.hue}, alpha ${currentValue.alpha}%`"
        :aria-expanded="isExpanded"
        :tabindex="0"
        @click="handleCoreClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onBeforeUnmount, type Ref } from "vue";
  import type { BlossomColorPickerValue, SliderPosition } from "./types";
  import {
    DEFAULT_COLORS,
    BLOOM_EASING,
    HOVER_DELAY,
    PETAL_STAGGER,
    BAR_GAP,
    BAR_WIDTH,
    SLIDER_OFFSET,
  } from "./constants";
  import {
    lightnessToSliderValue,
    sliderValueToLightness,
    hslToHex,
    hslaToString,
    createColorOutput,
    organizeColorsIntoLayers,
    getVisualSaturation,
    parseColor,
  } from "./utils";
  import {
    calculateLayerRadii,
    calculateLayerRotations,
    calculateBarRadius,
    calculateContainerSize,
    getPetalZIndex,
  } from "./layout";
  import { useAdaptivePosition } from "./hooks/useAdaptivePosition";
  import Petal from "./components/Petal.vue";
  import ColorBar from "./components/ColorBar.vue";
  import ArcSlider from "./components/ArcSlider.vue";

  const props = withDefaults(
    defineProps<{
      value?: BlossomColorPickerValue;
      defaultValue?: BlossomColorPickerValue;
      colors?: string[];
      disabled?: boolean;
      openOnHover?: boolean;
      initialExpanded?: boolean;
      animationDuration?: number;
      showAlphaSlider?: boolean;
      coreSize?: number;
      petalSize?: number;
      showCoreColor?: boolean;
      sliderPosition?: SliderPosition;
      adaptivePositioning?: boolean;
      className?: string;
    }>(),
    {
      defaultValue: () => ({
        hue: 330,
        saturation: 70,
        alpha: 50,
        layer: "outer",
      }),
      disabled: false,
      openOnHover: false,
      initialExpanded: false,
      animationDuration: 300,
      showAlphaSlider: true,
      coreSize: 32,
      petalSize: 32,
      showCoreColor: true,
      adaptivePositioning: true,
      className: "",
    }
  );

  const emit = defineEmits<{
    (e: "change", value: ReturnType<typeof createColorOutput>): void;
    (e: "collapse", value: ReturnType<typeof createColorOutput>): void;
  }>();

  const normalizedColors = computed(() =>
    props.colors && props.colors.length > 0
      ? props.colors.map(parseColor)
      : DEFAULT_COLORS
  );

  const layers = computed(() =>
    organizeColorsIntoLayers(normalizedColors.value)
  );

  const allColors = computed(() => layers.value.flat());

  const layerPrefixCounts = computed(() => {
    const counts: number[] = [0];
    for (let i = 1; i < layers.value.length; i++) {
      counts.push(counts[i - 1] + layers.value[i - 1].length);
    }
    return counts;
  });

  const internalValue = ref<BlossomColorPickerValue>(
    props.value ?? props.defaultValue
  ) as Ref<BlossomColorPickerValue>;

  const currentValue = computed<BlossomColorPickerValue>(
    () => props.value ?? internalValue.value
  );

  const isExpanded = ref(props.initialExpanded);
  const isHovering = ref(false);
  const hoveredPetal = ref<{ layer: number; index: number } | null>(null);

  const hoverTimeoutRef = ref<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = ref<ReturnType<typeof setTimeout> | null>(null);

  const layerRadii = computed(() =>
    calculateLayerRadii(layers.value, props.coreSize, props.petalSize)
  );

  const layerRotations = computed(() => calculateLayerRotations(layers.value));

  const barRadius = computed(() =>
    calculateBarRadius(
      layerRadii.value,
      props.petalSize,
      props.coreSize,
      BAR_GAP
    )
  );

  const containerSize = computed(() =>
    calculateContainerSize(
      barRadius.value,
      BAR_WIDTH,
      props.showAlphaSlider,
      SLIDER_OFFSET
    )
  );

  const containerRef = ref<HTMLDivElement | null>(null);

  const { effectivePosition, shiftOffset } = useAdaptivePosition({
    isExpanded,
    containerRef,
    containerSize,
    sliderPosition: computed(() => props.sliderPosition),
    adaptivePositioning: computed(() => props.adaptivePositioning),
  });

  const prevExpanded = ref(isExpanded.value);

  watch(
    () => props.value,
    (newVal) => {
      if (newVal) {
        internalValue.value = newVal;
      }
    }
  );

  watch(
    () => props.initialExpanded,
    (val) => {
      isExpanded.value = val;
    }
  );

  watch(isExpanded, (expanded) => {
    if (prevExpanded.value && !expanded) {
      const sliderValue = currentValue.value.saturation;
      const lightness = sliderValueToLightness(sliderValue);
      const selectedPetal = allColors.value.find(
        (c) => c.h === currentValue.value.hue
      );
      const pBaseSaturation = selectedPetal?.s ?? 70;
      const visualSaturation = getVisualSaturation(
        sliderValue,
        pBaseSaturation
      );

      emit(
        "collapse",
        createColorOutput(
          currentValue.value.hue,
          sliderValue,
          visualSaturation,
          pBaseSaturation,
          lightness,
          currentValue.value.alpha,
          currentValue.value.layer
        )
      );
    }
    prevExpanded.value = expanded;
  });

  // Click outside to close
  watch(isExpanded, (expanded) => {
    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    if (hoverTimeoutRef.value) clearTimeout(hoverTimeoutRef.value);
    if (closeTimeoutRef.value) clearTimeout(closeTimeoutRef.value);
  });

  const baseSaturation = computed(() => {
    if (currentValue.value.originalSaturation !== undefined) {
      return currentValue.value.originalSaturation;
    }
    const selectedColor = allColors.value.find(
      (c) => c.h === currentValue.value.hue
    );
    return selectedColor?.s ?? 70;
  });

  const currentLightness = computed(
    () =>
      currentValue.value.lightness ??
      (currentValue.value.layer === "inner" ? 85 : 65)
  );

  const coreColor = computed(() => {
    if (isExpanded.value && !props.showCoreColor) return "#FFFFFF";
    const lightness =
      currentValue.value.lightness ??
      sliderValueToLightness(currentValue.value.saturation);
    const saturation =
      currentValue.value.originalSaturation ?? baseSaturation.value;
    return hslToHex(currentValue.value.hue, saturation, lightness);
  });

  function getBottomIndex(totalPetals: number): number {
    return Math.floor(totalPetals / 2);
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
      isExpanded.value = false;
    }
  }

  function handleMouseEnter() {
    if (props.disabled || !props.openOnHover) return;

    if (closeTimeoutRef.value) {
      clearTimeout(closeTimeoutRef.value);
      closeTimeoutRef.value = null;
    }

    isHovering.value = true;
    hoverTimeoutRef.value = setTimeout(() => {
      isExpanded.value = true;
    }, HOVER_DELAY);
  }

  function handleMouseLeave() {
    if (hoverTimeoutRef.value) {
      clearTimeout(hoverTimeoutRef.value);
      hoverTimeoutRef.value = null;
    }

    isHovering.value = false;

    if (props.openOnHover) {
      closeTimeoutRef.value = setTimeout(() => {
        isExpanded.value = false;
      }, 200);
    }
  }

  function handleCoreClick() {
    if (props.disabled) return;
    isExpanded.value = !isExpanded.value;
  }

  function handleSliderChange(sliderValue: number) {
    const lightness = sliderValueToLightness(sliderValue);
    const visualSaturation = getVisualSaturation(
      sliderValue,
      baseSaturation.value
    );

    const newValue: BlossomColorPickerValue = {
      ...currentValue.value,
      saturation: sliderValue,
      lightness,
      originalSaturation: baseSaturation.value,
    };
    internalValue.value = newValue;

    emit(
      "change",
      createColorOutput(
        currentValue.value.hue,
        sliderValue,
        visualSaturation,
        baseSaturation.value,
        lightness,
        currentValue.value.alpha,
        currentValue.value.layer
      )
    );
  }

  function handlePetalClick(
    color: { h: number; s: number; l: number },
    layerIdx: number
  ) {
    const sliderValue = lightnessToSliderValue(color.l);
    const layerStr: "inner" | "outer" = layerIdx === 0 ? "inner" : "outer";
    const visualSaturation = color.s;

    const newValue: BlossomColorPickerValue = {
      ...currentValue.value,
      hue: color.h,
      saturation: sliderValue,
      lightness: color.l,
      originalSaturation: color.s,
      layer: layerStr,
    };
    internalValue.value = newValue;

    emit(
      "change",
      createColorOutput(
        color.h,
        sliderValue,
        visualSaturation,
        color.s,
        color.l,
        currentValue.value.alpha,
        layerStr
      )
    );
  }
</script>
