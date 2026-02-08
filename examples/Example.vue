<template>
  <div
    class="min-h-screen w-full bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 space-y-16 overflow-x-hidden transition-colors duration-300"
  >
    <!-- Header -->
    <header
      class="fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-slate-800 px-4"
    >
      <div class="relative h-full flex items-center justify-between w-full">
        <div class="flex items-center">
          <span class="text-2xl" role="img" aria-label="blossom">🌸</span>
          <span class="text-lg md:text-xl font-bold pl-4 whitespace-nowrap">
            Blossom Color Picker
          </span>
        </div>
      </div>
    </header>

    <!-- Basic Example -->
    <div
      class="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl dark:shadow-2xl/20 w-full max-w-sm border border-gray-100 dark:border-slate-800"
    >
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Color
        </span>

        <BlossomColorPicker
          :value="color"
          @change="color = $event"
          :coreSize="36"
          :petalSize="36"
          :adaptivePositioning="true"
        />
      </div>
    </div>

    <!-- Multi Layer -->
    <div
      class="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl dark:shadow-2xl/20 w-full max-w-sm border border-gray-100 dark:border-slate-800"
    >
      <div class="flex flex-col">
        <div class="flex items-center justify-between mb-24">
          <div>
            <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Multi-Layer Bloom
            </div>
            <div class="text-xs text-gray-400">
              {{ colorCount }} colors auto-distributed
            </div>
            <div class="text-xs text-gray-400">
              Adaptive Positioning on mobile
            </div>
          </div>

          <BlossomColorPicker
            :colors="dynamicPalette"
            :value="multiLayerColor"
            @change="multiLayerColor = $event"
            :sliderPosition="activePos"
            :initialExpanded="isPickerExpanded"
            :coreSize="40"
            :petalSize="32"
            @collapse="isPickerExpanded = false"
          />
        </div>

        <!-- Controls -->
        <div class="space-y-4">
          <!-- Count -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Color Count
            </span>

            <div class="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                class="px-3 py-1 font-bold"
                @click="
                  colorCount = Math.max(1, colorCount - 1);
                  isPickerExpanded = true;
                "
              >
                -
              </button>

              <input
                type="number"
                class="w-12 bg-transparent text-center text-sm font-mono focus:outline-none"
                :value="colorCount"
                @input="
                  colorCount = Math.max(
                    1,
                    Math.min(
                      colorPalette.length,
                      Number(
                        ($event.target as HTMLInputElement | null)?.value ?? 0
                      )
                    )
                  );
                  isPickerExpanded = true;
                "
              />

              <button
                class="px-3 py-1 font-bold"
                @click="
                  colorCount = Math.min(colorPalette.length, colorCount + 1);
                  isPickerExpanded = true;
                "
              >
                +
              </button>
            </div>
          </div>

          <!-- Position Tabs -->
          <div class="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              v-for="pos in ['top', 'bottom', 'left', 'right']"
              :key="pos"
              class="flex-1 py-1.5 text-xs rounded-lg transition-all"
              :class="
                activePos === pos
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              "
              @click="
                activePos = pos as any;
                isPickerExpanded = true;
              "
            >
              {{ pos.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BlossomColorPicker } from '../src';
import type { BlossomColorPickerValue } from '../src/types';

/* ---------------- palette ---------------- */

const colorPalette = [
  '#E67700',
  '#D9480F',
  '#C92A2A',
  '#A61E4D',
  '#862E9C',
  '#5F3DC4',
  '#364FC7',
  '#1864AB',
  '#0B7285',
  '#087F5B',
  '#2B8A3E',
  '#5C940D',

  '#FCC419',
  '#FF922B',
  '#FF6B6B',
  '#F06595',
  '#CC5DE8',
  '#845EF7',
  '#5C7CFA',
  '#339AF0',
  '#22B8CF',
  '#20C997',
  '#51CF66',
  '#94D82D',

  '#FFE066',
  '#FFC078',
  '#FFA8A8',
  '#FCC2D7',
  '#E599F7',
  '#B197FC',
  '#91A7FF',
  '#74C0FC',
  '#66D9E8',
  '#63E6BE',
  '#8CE99A',
  '#C0EB75',

  '#FFF9DB',
  '#FFF5F5',
  '#F3D9FA',
  '#E7F5FF',
  '#E6FCF5',
  '#F4FCE3',
];

/* ---------------- state ---------------- */

const color = ref<BlossomColorPickerValue>({
  hue: 92,
  saturation: 45,
  lightness: 69,
  alpha: 100,
  layer: 'outer',
});

const activePos = ref<'top' | 'bottom' | 'left' | 'right'>('left');
const colorCount = ref(42);
const isPickerExpanded = ref(false);

const multiLayerColor = ref<BlossomColorPickerValue>({
  hue: 330,
  saturation: 10,
  lightness: 92,
  alpha: 100,
  layer: 'outer',
});

/* ---------------- computed ---------------- */

const dynamicPalette = computed(() => colorPalette.slice(0, colorCount.value));
</script>
