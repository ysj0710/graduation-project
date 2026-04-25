<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <MessageSquare :size="18" :stroke-width="1.5" />
          <span>消息模板设置</span>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveTemplates" class="form">
          <div class="form-group">
            <label class="form-label">
              <span class="risk-tag low">低风险</span>
              提醒模板
            </label>
            <textarea v-model="templates.low" rows="3" class="form-textarea" placeholder="输入低风险用户提醒内容..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">
              <span class="risk-tag medium">中风险</span>
              提醒模板
            </label>
            <textarea v-model="templates.medium" rows="3" class="form-textarea" placeholder="输入中风险用户提醒内容..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">
              <span class="risk-tag high">高风险</span>
              提醒模板
            </label>
            <textarea v-model="templates.high" rows="3" class="form-textarea" placeholder="输入高风险用户提醒内容..."></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving || !isDirty">
              <Save :size="16" :stroke-width="2" />
              {{ saving ? '保存中...' : '保存模板' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { MessageSquare, Save } from 'lucide-vue-next'
import axios from 'axios'

const templates = ref({
  low: '您的消费状况良好，请继续保持理性消费习惯。',
  medium: '本月消费状况可控，但已接近预算阈值，建议适当控制支出。',
  high: '本月消费过高，已严重超出预算，请立即调整消费行为，避免财务风险。'
})
const templatesOriginal = ref({ ...templates.value }) // 保存加载时的原始值
const saving = ref(false)
const isDirty = ref(false)

// 监听模板变化，标记脏状态
watch(templates, (val) => {
  isDirty.value =
    val.low !== templatesOriginal.value.low ||
    val.medium !== templatesOriginal.value.medium ||
    val.high !== templatesOriginal.value.high
}, { deep: true })

const fetchTemplates = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/message-templates', {
      headers: { Authorization: `Bearer ${token}` }
    })
    templates.value = res.data.templates
    templatesOriginal.value = { ...res.data.templates }
    isDirty.value = false
  } catch (error) {
    console.error('获取模板失败:', error)
  }
}

const saveTemplates = async () => {
  saving.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/admin/message-templates', templates.value, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('模板已保存')
    templatesOriginal.value = { ...templates.value }
    isDirty.value = false
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  max-width: 700px;
}
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.card-body { padding: 24px; }

.form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.risk-tag {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}
.risk-tag.low { background: var(--color-income-bg); color: var(--color-income); }
.risk-tag.medium { background: var(--color-warning-soft); color: var(--color-warning); }
.risk-tag.high { background: var(--color-expense-bg); color: var(--color-expense); }

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  background: var(--color-surface);
  resize: vertical;
  outline: none;
  transition: all var(--transition-fast);
}
.form-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.form-textarea::placeholder { color: var(--color-text-muted); }

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
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
</style>