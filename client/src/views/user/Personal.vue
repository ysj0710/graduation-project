<template>
  <div class="page-container">
    <!-- 主题设置卡片 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Palette :size="18" :stroke-width="1.5" />
          <span>主题设置</span>
        </div>
      </div>
      <div class="card-body">

        <!-- 主题预设 -->
        <div class="settings-section">
          <div class="section-title">选择主题</div>
          <div class="section-desc">多种风格任你挑选，切换主题后自动应用</div>
          <div class="theme-grid">
            <div
              v-for="theme in themePresets"
              :key="theme.id"
              class="theme-card"
              :class="{ active: selectedPreset === theme.id }"
              @click="selectPreset(theme)"
            >
              <div class="theme-preview" :style="getThemePreviewStyle(theme)">
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

        <!-- 自定义主题配色 -->
        <div class="settings-section">
          <div class="section-title">自定义主题配色</div>
          <div class="section-desc">完全独立的配色方案，不影响上方已选主题</div>
          <div class="customizer-layout">
            <div class="customizer-left">
              <div class="custom-color-label">选择主色调</div>
              <ColorPicker v-model="customPrimaryColor" />
            </div>
            <div class="customizer-right">
              <div class="preview-box">
                <div class="preview-label">效果预览</div>
                <div class="preview-theme-card" :style="customPreviewStyle">
                  <div class="preview-mood">
                    <div class="mood-icon" :style="{ background: customPrimaryColor + '22', color: customPrimaryColor }">
                      <Wallet :size="20" />
                    </div>
                    <div class="mood-text" :style="{ color: customPrimaryColor }">记账</div>
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
                  {{ themeLoading ? '保存中...' : '应用自定义配色' }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

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
import { Palette, CheckCircle, Wallet, Settings, Save } from 'lucide-vue-next'
import axios from 'axios'
import { THEME_PRESETS } from '../../styles/themes.js'
import ColorPicker from '../../components/ColorPicker.vue'

const userStore = useUserStore()

const themeLoading = ref(false)
const budgetLoading = ref(false)
const selectedPreset = ref('')  // 当前选中主题，空=自定义配色
const savedPresetId = ref('')          // 已保存的主题ID
const savedPrimaryColor = ref('')     // 已保存的主色调（用于判断自定义配色是否变化）
const customPrimaryColor = ref('#667eea')

// 自定义配色是否已变化（与上次保存的值不同）
const isCustomColorChanged = computed(() => {
  return customPrimaryColor.value !== savedPrimaryColor.value
})

const budget = reactive({
  monthly: 5000,
  yearly: 60000,
  alertThreshold: 80
})

const themePresets = THEME_PRESETS

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// 自定义颜色预览
const customPreviewStyle = computed(() => ({
  background: `linear-gradient(135deg, ${customPrimaryColor.value}33, ${customPrimaryColor.value}11)`,
  borderColor: `${customPrimaryColor.value}44`
}))

function getThemePreviewStyle(theme) {
  return { background: theme.gradient, backgroundSize: 'cover', backgroundPosition: 'center' }
}

function selectPreset(theme) {
  selectedPreset.value = theme.id
  customPrimaryColor.value = theme.primaryColor
  // 仅切换主题预览，不自动保存配色
  userStore.updateTheme({
    background: theme.gradient,
    primaryColor: theme.primaryColor,
    pattern: 'dots',
    presetId: theme.id,
    customBgUrl: ''
  })
}

function applyCustomColor() {
  const gradient = `linear-gradient(135deg, ${customPrimaryColor.value} 0%, ${customPrimaryColor.value}99 100%)`
  // 清空主题选中状态（自定义配色与预设主题互斥）
  selectedPreset.value = ''
  savedPresetId.value = ''
  savedPrimaryColor.value = customPrimaryColor.value
  saveTheme({
    name: '自定义配色',
    id: 'custom',
    gradient,
    primaryColor: customPrimaryColor.value
  })
}

async function saveTheme(theme) {
  themeLoading.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/user/settings/theme', {
      background: theme.gradient,
      primaryColor: theme.primaryColor || customPrimaryColor.value,
      pattern: 'dots',
      presetId: theme.id,
      customBgUrl: ''
    }, { headers: { Authorization: `Bearer ${token}` } })

    userStore.updateTheme({
      background: theme.gradient,
      primaryColor: theme.primaryColor || customPrimaryColor.value,
      pattern: 'dots',
      presetId: theme.id,
      customBgUrl: ''
    })
    savedPresetId.value = theme.id
    savedPrimaryColor.value = theme.primaryColor || customPrimaryColor.value
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
    } else if (theme.presetId === 'custom' || theme.primaryColor) {
      // 自定义配色：presetId为custom或不在预设列表中
      selectedPreset.value = ''
      savedPresetId.value = ''
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
.page-container { display: flex; flex-direction: column; gap: 24px; }

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
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.theme-card {
  cursor: pointer;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--color-border);
  transition: all 0.2s ease;
}

.theme-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--color-text-muted); }
.theme-card.active { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }

.theme-preview {
  height: 72px;
  position: relative;
  overflow: hidden;
}

.theme-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.theme-info { padding: 10px 12px; background: var(--color-surface-hover); }
.theme-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.theme-desc { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 自定义颜色布局 */
.customizer-layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  align-items: start;
}

.customizer-left { flex: 1; }

.customizer-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-box {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
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
  letter-spacing: 0.5px;
}

.preview-theme-card {
  border-radius: var(--radius-md);
  padding: 14px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.preview-mood {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.mood-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-text { font-size: 16px; font-weight: 700; transition: color 0.3s ease; }

.mood-stats { display: flex; gap: 12px; }
.mood-stat { flex: 1; background: rgba(255,255,255,0.5); border-radius: var(--radius-sm); padding: 8px 10px; }
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
  .theme-grid { grid-template-columns: repeat(2, 1fr); }
  .customizer-layout { grid-template-columns: 1fr; }
  .customizer-right { order: -1; }
}
</style>
