import { ref, watch, type Ref } from 'vue';
import { BAR_WIDTH, SLIDER_OFFSET } from '../constants';

type SliderPosition = 'top' | 'bottom' | 'left' | 'right';

interface UseAdaptivePositionOptions {
  isExpanded: Ref<boolean>;
  containerRef: Ref<HTMLDivElement | null>;
  containerSize: Ref<number>;
  sliderPosition?: Ref<SliderPosition | undefined>;
  adaptivePositioning: Ref<boolean>;
}

interface UseAdaptivePositionResult {
  effectivePosition: Ref<SliderPosition>;
  shiftOffset: Ref<{ x: number; y: number }>;
}

/**
 * Composable that handles viewport auto-positioning for the color picker.
 * Shifts the picker to stay within viewport bounds and determines
 * the best arc slider position based on available space.
 */
export function useAdaptivePosition({
  isExpanded,
  containerRef,
  containerSize,
  sliderPosition,
  adaptivePositioning,
}: UseAdaptivePositionOptions): UseAdaptivePositionResult {
  const effectivePosition = ref<SliderPosition>(
    sliderPosition?.value || 'right'
  ) as Ref<SliderPosition>;
  const shiftOffset = ref({ x: 0, y: 0 });

  watch(
    [
      isExpanded,
      () => sliderPosition?.value,
      containerSize,
      adaptivePositioning,
    ],
    () => {
      if (isExpanded.value && containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const halfSize = containerSize.value / 2;
        const centerX = rect.left + rect.width / 2 - shiftOffset.value.x;
        const centerY = rect.top + rect.height / 2 - shiftOffset.value.y;

        let newShiftX = 0;
        let newShiftY = 0;

        if (adaptivePositioning.value) {
          const padding = 10;

          if (centerX + halfSize > windowWidth - padding) {
            newShiftX = windowWidth - padding - (centerX + halfSize);
          } else if (centerX - halfSize < padding) {
            newShiftX = padding - (centerX - halfSize);
          }

          if (centerY + halfSize > windowHeight - padding) {
            newShiftY = windowHeight - padding - (centerY + halfSize);
          } else if (centerY - halfSize < padding) {
            newShiftY = padding - (centerY - halfSize);
          }

          shiftOffset.value = { x: newShiftX, y: newShiftY };
        } else {
          shiftOffset.value = { x: 0, y: 0 };
        }

        if (sliderPosition?.value) {
          effectivePosition.value = sliderPosition.value;
          return;
        }

        const spaceRight = windowWidth - (centerX + newShiftX + halfSize);
        const spaceLeft = centerX + newShiftX - halfSize;
        const spaceTop = centerY + newShiftY - halfSize;
        const spaceBottom = windowHeight - (centerY + newShiftY + halfSize);

        const threshold = SLIDER_OFFSET + BAR_WIDTH + 20;

        if (spaceRight < threshold && spaceLeft > spaceRight) {
          effectivePosition.value = 'left';
        } else if (spaceLeft < threshold && spaceRight > spaceLeft) {
          effectivePosition.value = 'right';
        } else if (spaceBottom < threshold && spaceTop > spaceBottom) {
          effectivePosition.value = 'top';
        } else if (spaceTop < threshold && spaceBottom > spaceTop) {
          effectivePosition.value = 'bottom';
        } else {
          effectivePosition.value = 'right';
        }
      } else if (!isExpanded.value) {
        shiftOffset.value = { x: 0, y: 0 };
      }
    },
    { flush: 'post' }
  );

  return { effectivePosition, shiftOffset };
}
