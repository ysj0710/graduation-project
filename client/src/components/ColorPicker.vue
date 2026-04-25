<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '#6366F1' }
})

const emit = defineEmits(['update:modelValue'])

// 将 hex 转换为 HSL
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

// 将 HSL 转换为 hex
function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const hue = ref(0)
const saturation = ref(80)
const lightness = ref(60)
const initDone = ref(false)

// 预设色板
const presets = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F43F5E', '#6366F1', '#14B8A6',
  '#A855F7', '#D946EF', '#0EA5E9', '#F97316'
]

watch(() => props.modelValue, (newVal) => {
  if (newVal && initDone.value) {
    const hsl = hexToHsl(newVal)
    hue.value = hsl.h
    saturation.value = hsl.s
    lightness.value = hsl.l
  }
}, { immediate: true })

watch([hue, saturation, lightness], () => {
  const hex = hslToHex(hue.value, saturation.value, lightness.value)
  emit('update:modelValue', hex)
  initDone.value = true
}, { immediate: false })

// 初始化
const initHsl = computed(() => {
  const hsl = hexToHsl(props.modelValue)
  hue.value = hsl.h
  saturation.value = hsl.s
  lightness.value = hsl.l
  initDone.value = true
  return hsl
})

// CSS 颜色条背景（色相）
const hueGradient = computed(() => {
  const stops = []
  for (let i = 0; i <= 360; i += 30) {
    stops.push(`hsl(${i}, 100%, 50%)`)
  }
  return `linear-gradient(to right, ${stops.join(', ')})`
})

// 当前颜色预览
const previewColor = computed(() => hslToHex(hue.value, saturation.value, lightness.value))

// 透明度相关（用 lightness 模拟）
const opacity = ref(100)
</script>

<template>
  <div class="color-picker">
    <!-- 预览 + 预设色板 -->
    <div class="picker-top">
      <div class="preview-swatch" :style="{ background: previewColor }"></div>
      <div class="presets-grid">
        <button
          v-for="color in presets"
          :key="color"
          class="preset-dot"
          :class="{ active: previewColor === color }"
          :style="{ background: color }"
          @click="emit('update:modelValue', color); (() => { const h = hexToHsl(color); hue = h.h; saturation = h.s; lightness = h.l; })()"
          type="button"
          :title="color"
        ></button>
      </div>
    </div>

    <!-- 色相滑块 -->
    <div class="slider-row">
      <span class="slider-label">色相</span>
      <div class="slider-track hue-track">
        <div class="hue-gradient"></div>
        <input
          type="range"
          min="0"
          max="360"
          v-model.number="hue"
          class="range-input"
        />
      </div>
      <span class="slider-value">{{ hue }}°</span>
    </div>

    <!-- 饱和度滑块 -->
    <div class="slider-row">
      <span class="slider-label">饱和度</span>
      <div class="slider-track sat-track">
        <div
          class="sat-gradient"
          :style="{ background: `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))` }"
        ></div>
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="saturation"
          class="range-input"
        />
      </div>
      <span class="slider-value">{{ saturation }}%</span>
    </div>

    <!-- 亮度滑块 -->
    <div class="slider-row">
      <span class="slider-label">亮度</span>
      <div class="slider-track light-track">
        <div
          class="light-gradient"
          :style="{ background: `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))` }"
        ></div>
        <input
          type="range"
          min="10"
          max="95"
          v-model.number="lightness"
          class="range-input"
        />
      </div>
      <span class="slider-value">{{ lightness }}%</span>
    </div>

    <!-- 当前颜色 hex 值 -->
    <div class="hex-display">
      <div class="hex-swatch" :style="{ background: previewColor }"></div>
      <input
        type="text"
        :value="previewColor.toUpperCase()"
        @change="emit('update:modelValue', $event.target.value)"
        class="hex-input"
        maxlength="7"
      />
    </div>
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.picker-top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.preview-swatch {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  flex: 1;
}

.preset-dot {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.12s ease;
}

.preset-dot:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.preset-dot.active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--color-primary);
  transform: scale(1.1);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  width: 36px;
  flex-shrink: 0;
}

.slider-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  width: 38px;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.slider-track {
  flex: 1;
  position: relative;
  height: 14px;
  border-radius: 7px;
  overflow: visible;
}

.hue-track { border-radius: 7px; }
.hue-gradient {
  position: absolute;
  inset: 0;
  border-radius: 7px;
  background: linear-gradient(to right,
    hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%),
    hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%),
    hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%),
    hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%), hsl(360,100%,50%)
  );
}

.sat-gradient, .light-gradient {
  position: absolute;
  inset: 0;
  border-radius: 7px;
}

.range-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  padding: 0;
}

/* 滑块拇指样式（使用伪元素覆盖原生样式） */
.slider-track::after {
  content: '';
  position: absolute;
  top: 50%;
  left: calc(var(--thumb-pos, 50) * 1%);
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  pointer-events: none;
  transition: transform 0.1s ease;
}

.slider-track:hover::after {
  transform: translate(-50%, -50%) scale(1.15);
}

/* 由于原生 range 的拇指是隐藏的但仍可拖动，我们需要保留它 */
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  cursor: pointer;
}

.hex-display {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  border: 1px solid var(--color-border);
}

.hex-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.hex-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: 'JetBrains Mono', monospace;
  outline: none;
  letter-spacing: 1px;
}
</style>
