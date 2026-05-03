<template>
  <div class="page-container">
    <section class="theme-studio" :style="customStudioStyle">
      <div class="studio-backdrop">
        <div class="studio-grid"></div>
        <div class="studio-glow studio-glow-a"></div>
        <div class="studio-glow studio-glow-b"></div>
      </div>

      <div class="studio-header">
        <div>
          <div class="eyebrow">
            <Sparkles :size="14" :stroke-width="1.8" />
            <span>渐变主题</span>
          </div>
          <h1>换一套清新的渐变撞色</h1>
          <p>从柔和奶油色到霓虹夜色，选择一套更干净、更耐看的页面氛围。</p>
        </div>
        <div class="studio-current">
          <span>当前</span>
          <strong>{{ currentThemeName }}</strong>
        </div>
      </div>

      <div class="studio-layout">
        <div class="studio-panel palette-panel">
          <div class="panel-heading">
            <div>
              <div class="section-title">精选主题</div>
              <div class="section-desc">更换后会立即同步到用户端背景和主色</div>
            </div>
            <Palette :size="18" :stroke-width="1.6" />
          </div>
          <div class="theme-grid">
            <div
              v-for="theme in themePresets"
              :key="theme.id"
              class="theme-card"
              :class="{ active: selectedPreset === theme.id }"
              @click="selectPreset(theme)"
            >
              <div class="theme-preview" :style="getThemePreviewStyle(theme)">
                <div class="preview-lines">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="preview-dock">
                  <i :style="{ background: theme.primaryColor }"></i>
                  <i :style="{ background: theme.accentColor || theme.chartColors[1] }"></i>
                </div>
                <div class="theme-check" v-if="selectedPreset === theme.id">
                  <CheckCircle :size="16" :stroke-width="2" />
                </div>
              </div>
              <div class="theme-info">
                <div class="theme-name">{{ theme.name }}</div>
                <div class="theme-desc">{{ theme.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="studio-panel custom-panel">
          <div class="panel-heading">
            <div>
              <div class="section-title">自定义主题</div>
              <div class="section-desc">选择两种颜色，生成一套干净的撞色渐变</div>
            </div>
            <SlidersHorizontal :size="18" :stroke-width="1.6" />
          </div>

          <div class="customizer-layout">
            <div class="customizer-left">
              <div class="custom-color-group">
                <div class="custom-block-title">主色</div>
                <ColorPicker v-model="customPrimaryColor" />
              </div>
              <div class="custom-color-group">
                <div class="custom-block-title">辅助色</div>
                <ColorPicker v-model="customAccentColor" />
              </div>
            </div>
            <div class="customizer-right">
              <div class="preview-box">
                <div class="preview-label">Live Preview</div>
                <div class="preview-theme-card" :style="customPreviewStyle">
                  <div class="preview-card-top">
                    <div class="preview-mood">
                      <div class="mood-icon" :style="{ background: customPrimaryColor + '22', color: customPrimaryColor }">
                        <Wallet :size="20" />
                      </div>
                      <div>
                        <div class="mood-text" :style="{ color: customPrimaryColor }">本月账单</div>
                        <div class="mood-subtitle">May 2026</div>
                      </div>
                    </div>
                    <div class="preview-pill" :style="{ color: customAccentColor, background: customAccentColor + '18' }">Gradient</div>
                  </div>
                  <div class="preview-chart">
                    <span :style="{ height: '42%', background: customPrimaryColor + '66' }"></span>
                    <span :style="{ height: '78%', background: customPrimaryColor }"></span>
                    <span :style="{ height: '56%', background: customAccentColor + 'AA' }"></span>
                    <span :style="{ height: '64%', background: '#10B981' }"></span>
                    <span :style="{ height: '38%', background: '#F97316' }"></span>
                  </div>
                  <div class="mood-stats">
                    <div class="mood-stat">
                      <div class="mood-label">收入</div>
                      <div class="mood-value income">+¥3,200</div>
                    </div>
                    <div class="mood-stat">
                      <div class="mood-label">支出</div>
                      <div class="mood-value expense">-¥1,850</div>
                    </div>
                  </div>
                </div>
                <button class="btn primary small" @click="applyCustomColor" :disabled="themeLoading || !isCustomColorChanged">
                  <Palette :size="14" />
                  {{ themeLoading ? '保存中...' : '应用自定义渐变' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 预算设置卡片 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Settings :size="18" :stroke-width="1.5" />
          <span>预算管理</span>
        </div>
      </div>
      <div class="card-body">
        <div class="budget-form">
          <div class="form-group">
            <label class="form-label">每月预算</label>
            <input v-model.number="budget.monthly" type="number" step="100" class="form-input" placeholder="5000" />
            <span class="form-hint">设定每月消费预算上限</span>
          </div>
          <div class="form-group">
            <label class="form-label">每年预算</label>
            <input v-model.number="budget.yearly" type="number" step="1000" class="form-input" placeholder="60000" />
            <span class="form-hint">设定每年消费预算上限（用于年视图统计）</span>
          </div>
          <div class="form-group">
            <label class="form-label">提醒阈值</label>
            <div class="threshold-row">
              <input v-model.number="budget.alertThreshold" type="number" min="50" max="100" step="5" class="form-input" />
              <span class="threshold-suffix">%</span>
            </div>
            <span class="form-hint">当消费达到预算的 {{ budget.alertThreshold }}% 时发送提醒</span>
          </div>
          <button class="btn primary" @click="updateBudget" :disabled="budgetLoading">
            <Save :size="16" :stroke-width="2" />
            {{ budgetLoading ? '保存中...' : '保存预算设置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'
import { Palette, CheckCircle, Wallet, Settings, Save, Sparkles, SlidersHorizontal } from 'lucide-vue-next'
import axios from 'axios'
import { THEME_PRESETS } from '../../styles/themes.js'
import ColorPicker from '../../components/ColorPicker.vue'

const userStore = useUserStore()

const themeLoading = ref(false)
const budgetLoading = ref(false)
const selectedPreset = ref('')  // 当前选中主题，空=自定义配色
const savedPresetId = ref('')          // 已保存的主题ID
const savedPrimaryColor = ref('')     // 已保存的主色调（用于判断自定义配色是否变化）
const savedAccentColor = ref('')
const customPrimaryColor = ref('#D85C8A')
const customAccentColor = ref('#8ECDF8')

// 自定义配色是否已变化（与上次保存的值不同）
const isCustomColorChanged = computed(() => {
  return customPrimaryColor.value !== savedPrimaryColor.value ||
    customAccentColor.value !== savedAccentColor.value
})

const budget = reactive({
  monthly: 5000,
  yearly: 60000,
  alertThreshold: 80
})

const themePresets = THEME_PRESETS

const currentThemeName = computed(() => {
  if (!selectedPreset.value) return '自定义配色'
  return themePresets.find(theme => theme.id === selectedPreset.value)?.name || '自定义配色'
})

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// 自定义颜色预览
const customPreviewStyle = computed(() => ({
  background: `radial-gradient(circle at 14% 10%, ${customPrimaryColor.value}2E, transparent 32%), radial-gradient(circle at 86% 12%, ${customAccentColor.value}35, transparent 30%), linear-gradient(145deg, rgba(255,255,255,0.92), ${customPrimaryColor.value}12 46%, ${customAccentColor.value}18)`,
  borderColor: `${customPrimaryColor.value}38`,
  boxShadow: `0 18px 42px ${customPrimaryColor.value}20`
}))

const customStudioStyle = computed(() => ({
  '--studio-color': customPrimaryColor.value,
  '--studio-accent': customAccentColor.value
}))

function getCustomGradient(primary = customPrimaryColor.value, accent = customAccentColor.value) {
  return `radial-gradient(circle at 16% 18%, ${primary}36, transparent 30%), radial-gradient(circle at 88% 12%, ${accent}4A, transparent 28%), linear-gradient(135deg, #FFFFFF 0%, ${primary}18 42%, ${accent}38 100%)`
}

function isHexColor(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || '')
}

function extractAccentFromGradient(background, primary) {
  const colors = String(background || '').match(/#[0-9A-Fa-f]{6}/g) || []
  return colors.find(color => color.toLowerCase() !== String(primary || '').toLowerCase()) || ''
}

function getThemePreviewStyle(theme) {
  return {
    backgroundImage: theme.gradient,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  }
}

function selectPreset(theme) {
  selectedPreset.value = theme.id
  customPrimaryColor.value = theme.primaryColor
  customAccentColor.value = theme.accentColor || theme.chartColors?.[1] || theme.primaryColor
  // 切换主题时立即保存到服务端，确保持久化
  saveTheme({
    name: theme.name,
    id: theme.id,
    gradient: theme.gradient,
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor || theme.chartColors?.[1],
    pattern: theme.pattern
  })
}

function applyCustomColor() {
  const gradient = getCustomGradient()
  // 清空主题选中状态（自定义配色与预设主题互斥）
  selectedPreset.value = ''
  savedPresetId.value = ''
  savedPrimaryColor.value = customPrimaryColor.value
  savedAccentColor.value = customAccentColor.value
  saveTheme({
    name: '自定义配色',
    id: 'custom',
    gradient,
    primaryColor: customPrimaryColor.value,
    accentColor: customAccentColor.value,
    pattern: 'none'
  })
}

async function saveTheme(theme) {
  themeLoading.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/user/settings/theme', {
      background: theme.gradient,
      primaryColor: theme.primaryColor || customPrimaryColor.value,
      pattern: 'none',
      presetId: theme.id,
      customBgUrl: theme.accentColor || ''
    }, { headers: { Authorization: `Bearer ${token}` } })

    userStore.updateTheme({
      background: theme.gradient,
      primaryColor: theme.primaryColor || customPrimaryColor.value,
      accentColor: theme.accentColor || customAccentColor.value,
      pattern: 'none',
      presetId: theme.id,
      customBgUrl: theme.accentColor || ''
    })
    savedPresetId.value = theme.id
    savedPrimaryColor.value = theme.primaryColor || customPrimaryColor.value
    savedAccentColor.value = theme.accentColor || customAccentColor.value
    ElMessage.success('配色已保存')
  } catch (error) {
    ElMessage.error('主题切换失败')
  } finally {
    themeLoading.value = false
  }
}

async function fetchSettings() {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/user/settings', {
      headers: { Authorization: `Bearer ${token}` }
    })

    const settings = response.data.settings
    const theme = settings.theme || {}

    budget.monthly = settings.budget?.monthly || 5000
    budget.yearly = settings.budget?.yearly || 60000
    budget.alertThreshold = settings.budget?.alertThreshold || 80

    if (theme.presetId && themePresets.find(t => t.id === theme.presetId)) {
      selectedPreset.value = theme.presetId
      savedPresetId.value = theme.presetId
      const preset = themePresets.find(t => t.id === theme.presetId)
      customAccentColor.value = preset?.accentColor || preset?.chartColors?.[1] || '#8ECDF8'
      savedAccentColor.value = customAccentColor.value
    } else if (theme.presetId === 'custom' || theme.primaryColor) {
      // 自定义配色：presetId为custom或不在预设列表中
      selectedPreset.value = ''
      savedPresetId.value = ''
      const accent = isHexColor(theme.customBgUrl)
        ? theme.customBgUrl
        : extractAccentFromGradient(theme.background, theme.primaryColor)
      if (accent) {
        customAccentColor.value = accent
        savedAccentColor.value = accent
      }
    }
    if (theme.primaryColor) {
      customPrimaryColor.value = theme.primaryColor
      savedPrimaryColor.value = theme.primaryColor
    }
    userStore.applyThemeSettings(settings)
  } catch (error) {
    budget.monthly = 5000
    budget.alertThreshold = 80
  }
}

async function updateBudget() {
  if (budget.monthly < 0) {
    ElMessage.warning('预算金额不能为负数')
    return
  }
  if (budget.alertThreshold < 0 || budget.alertThreshold > 100) {
    ElMessage.warning('提醒阈值必须在 0-100 之间')
    return
  }

  budgetLoading.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/user/settings/budget', {
      monthly: budget.monthly,
      yearly: budget.yearly,
      alertThreshold: budget.alertThreshold
    }, { headers: { Authorization: `Bearer ${token}` } })

    userStore.updateBudget({ monthly: budget.monthly, yearly: budget.yearly, alertThreshold: budget.alertThreshold })
    ElMessage.success('预算设置已保存')
  } catch (error) {
    ElMessage.error('保存预算失败')
  } finally {
    budgetLoading.value = false
  }
}

onMounted(async () => {
  await fetchSettings()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; padding: 28px 32px; max-width: 1180px; margin: 0 auto; width: 100%; overflow-x: hidden; }

.theme-studio {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 24px;
  padding: 26px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72)),
    radial-gradient(circle at 20% 16%, color-mix(in srgb, var(--studio-color) 24%, transparent), transparent 30%);
  box-shadow: 0 24px 70px rgba(28, 25, 23, 0.12);
  isolation: isolate;
}

.studio-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.studio-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(28, 25, 23, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(28, 25, 23, 0.055) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(180deg, rgba(0,0,0,0.7), transparent 82%);
}

.studio-glow {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.5;
}

.studio-glow-a { top: -120px; right: 8%; background: color-mix(in srgb, var(--studio-color) 36%, white); }
.studio-glow-b { bottom: -150px; left: -80px; background: rgba(20, 184, 166, 0.2); }

.studio-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border: 1px solid color-mix(in srgb, var(--studio-color) 24%, transparent);
  border-radius: 999px;
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  margin-bottom: 12px;
}

.studio-header h1 {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 750;
  letter-spacing: 0;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.studio-header p {
  color: var(--color-text-secondary);
  font-size: 14px;
  max-width: 520px;
}

.studio-current {
  min-width: 150px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-sm);
}

.studio-current span {
  display: block;
  color: var(--color-text-muted);
  font-size: 12px;
  margin-bottom: 4px;
}

.studio-current strong {
  color: var(--color-text-primary);
  font-size: 16px;
}

.studio-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(340px, 0.7fr);
  gap: 18px;
  align-items: start;
}

.studio-panel {
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 12px 36px rgba(28, 25, 23, 0.08);
  backdrop-filter: blur(16px);
  padding: 18px;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  color: var(--color-primary);
}

.panel-heading .section-desc { margin-bottom: 0; }

/* 通用卡片 */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.card-body { padding: 24px; }

.settings-section { margin-bottom: 36px; }
.settings-section:last-child { margin-bottom: 0; }

.section-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; }
.section-desc { font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px; }

/* 主题网格 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  cursor: pointer;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(214, 211, 209, 0.75);
  background: rgba(255,255,255,0.84);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.theme-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(28, 25, 23, 0.12); border-color: color-mix(in srgb, var(--color-primary) 42%, var(--color-border)); }
.theme-card.active { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft), 0 14px 34px rgba(28, 25, 23, 0.1); }

.theme-preview {
  height: 96px;
  position: relative;
  overflow: hidden;
  padding: 12px;
}

.theme-preview::after {
  content: "";
  position: absolute;
  inset: auto 12px 12px 12px;
  height: 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(12px);
}

.preview-lines {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 6px;
  width: 50%;
}

.preview-lines span {
  display: block;
  height: 6px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.62);
}

.preview-lines span:nth-child(2) { width: 74%; }
.preview-lines span:nth-child(3) { width: 46%; }

.preview-dock {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 2;
  display: flex;
  gap: 5px;
}

.preview-dock i {
  width: 10px;
  height: 18px;
  border-radius: 99px;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.4);
}

.theme-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.theme-info { padding: 11px 12px 12px; background: rgba(255,255,255,0.82); }
.theme-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.theme-desc { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 自定义颜色布局 */
.customizer-layout {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: start;
}

.customizer-left { width: 100%; }

.custom-color-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-color-group + .custom-color-group {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(214, 211, 209, 0.62);
}

.custom-block-title {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.customizer-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-box {
  width: 100%;
  background: rgba(255,255,255,0.58);
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0;
}

.preview-theme-card {
  border-radius: 18px;
  padding: 16px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.preview-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.preview-mood {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mood-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-text { font-size: 16px; font-weight: 750; transition: color 0.3s ease; }
.mood-subtitle { margin-top: 2px; color: var(--color-text-muted); font-size: 11px; }

.preview-pill {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.preview-chart {
  display: flex;
  align-items: end;
  gap: 7px;
  height: 70px;
  padding: 10px 0 6px;
}

.preview-chart span {
  flex: 1;
  min-width: 0;
  border-radius: 999px 999px 4px 4px;
}

.mood-stats { display: flex; gap: 12px; }
.mood-stat { flex: 1; background: rgba(255,255,255,0.68); border: 1px solid rgba(255,255,255,0.72); border-radius: 12px; padding: 8px 10px; }
.mood-label { font-size: 11px; color: rgba(0,0,0,0.5); margin-bottom: 2px; }
.mood-value { font-size: 14px; font-weight: 700; }
.mood-value.income { color: #059669; }
.mood-value.expense { color: #DC2626; }

/* 预算表单 */
.budget-form { display: flex; flex-direction: column; gap: 20px; max-width: 480px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.threshold-row { display: flex; align-items: center; gap: 8px; }
.threshold-suffix { font-size: 16px; font-weight: 600; color: var(--color-text-secondary); }
.form-hint { font-size: 12px; color: var(--color-text-muted); }

/* 输入框 */
.form-input {
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  outline: none;
  transition: all var(--transition-fast);
  font-family: var(--font-ui);
}

.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }

/* 按钮 */
.btn {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  font-family: var(--font-ui);
}

.btn.primary { background: var(--color-primary); color: white; }
.btn.primary:hover { background: var(--color-primary-dark); }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn.primary.small { padding: 8px 14px; font-size: 13px; }

@media (max-width: 768px) {
  .theme-studio { padding: 16px; border-radius: 18px; }
  .studio-header { flex-direction: column; gap: 14px; margin-bottom: 16px; }
  .studio-header h1 { font-size: 22px; }
  .studio-header p { font-size: 13px; }
  .studio-current { width: 100%; }
  .studio-layout { grid-template-columns: 1fr; gap: 12px; }
  .studio-panel { padding: 12px; border-radius: 14px; }
  .panel-heading { margin-bottom: 12px; }
  .theme-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .page-container { padding: 12px; gap: 12px; }
  .card-body { padding: 12px; }
  .customizer-left { width: 100%; overflow: hidden; }
  .customizer-right { width: 100%; overflow: hidden; }
  .preview-box { padding: 10px; }
  .preview-theme-card { padding: 10px; }
  .mood-stats { flex-wrap: wrap; gap: 8px; }
  .mood-stat { padding: 6px 8px; }
  .budget-form { max-width: 100%; }
  .section-title { font-size: 14px; }
  .section-desc { font-size: 11px; }
  .theme-preview { height: 74px; padding: 10px; }
  .theme-preview::after { inset: auto 10px 10px 10px; height: 24px; }
  .preview-dock { right: 14px; bottom: 14px; gap: 4px; }
  .preview-dock i { width: 8px; height: 14px; }
  .theme-info { padding: 6px 8px; }
  .theme-name { font-size: 11px; }
  .theme-desc { font-size: 9px; }
  .settings-section { margin-bottom: 24px; }
  .preview-mood { margin-bottom: 8px; gap: 8px; }
  .mood-icon { width: 32px; height: 32px; }
  .mood-text { font-size: 13px; }
  .mood-value { font-size: 12px; }
  .mood-label { font-size: 10px; }
  .btn.primary.small { font-size: 12px; padding: 6px 10px; }

  /* ColorPicker 响应式 */
  .presets-grid { grid-template-columns: repeat(8, 1fr); gap: 4px; }
  .preset-dot { width: 24px; height: 24px; }
  .preview-swatch { width: 40px; height: 40px; }
  .slider-row { gap: 6px; }
}
</style>
