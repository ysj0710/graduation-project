<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Settings :size="18" :stroke-width="1.5" />
          <span>基础配置</span>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveSettings" class="form">
          <div class="form-group">
            <label class="form-label">系统名称</label>
            <input v-model="settings.systemName" type="text" class="form-input" placeholder="输入系统名称" />
            <span class="form-hint">设置后将在用户端侧边栏显示此名称</span>
          </div>
          <div class="form-group">
            <label class="form-label">默认货币</label>
            <input v-model="settings.currency" type="text" class="form-input" placeholder="CNY" />
            <span class="form-hint">货币符号，如 CNY、USD</span>
          </div>
          <div class="form-group">
            <label class="form-label">默认月度预算</label>
            <div class="input-with-unit">
              <input v-model.number="settings.defaultBudget" type="number" :min="0" class="form-input" />
              <span class="unit">元</span>
            </div>
            <span class="form-hint">新用户的默认月度预算</span>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <Save :size="16" :stroke-width="2" />
              {{ saving ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Settings, Save } from 'lucide-vue-next'
import axios from 'axios'

const settings = ref({ systemName: '随手记', currency: 'CNY', defaultBudget: 5000 })
const saving = ref(false)

const fetchSettings = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/system-settings', {
      headers: { Authorization: `Bearer ${token}` }
    })
    settings.value = res.data.settings
  } catch (error) {
    console.error('获取设置失败:', error)
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/admin/system-settings', settings.value, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  max-width: 600px;
}
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.card-body { padding: 24px; }

.form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: all var(--transition-fast);
  outline: none;
}
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.form-hint { font-size: 12px; color: var(--color-text-muted); }

.input-with-unit { display: flex; align-items: center; gap: 8px; }
.input-with-unit .form-input { flex: 1; }
.unit { font-size: 14px; color: var(--color-text-muted); font-weight: 500; }

.form-actions { margin-top: 8px; }
.btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-ui);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary { border: none; background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); }
</style>