<template>
  <div class="page-container">
    <!-- 支出分类 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <TrendingDown :size="18" :stroke-width="1.5" />
          <span>支出分类</span>
        </div>
        <button class="btn btn-primary" @click="openAddModal('expense')">
          <Plus :size="16" :stroke-width="2" />
          新增分类
        </button>
      </div>
      <div class="card-body">
        <div class="category-list">
          <div class="category-item" v-for="cat in expenseCategories" :key="cat._id">
            <div class="category-icon" :style="{ background: cat.color + '20', color: cat.color }">
              <CategoryIcon :id="cat.iconId" :size="18" />
            </div>
            <span class="cat-name">{{ cat.name }}</span>
            <div class="cat-type-tag expense">支出</div>
            <div class="cat-color" :style="{ background: cat.color }"></div>
            <div class="cat-actions">
              <button class="btn-small" @click="openEditModal(cat)">
                <Edit3 :size="14" :stroke-width="1.5" />
                编辑
              </button>
              <button class="btn-small danger" @click="deleteCategory(cat)">
                <Trash2 :size="14" :stroke-width="1.5" />
                删除
              </button>
            </div>
          </div>
          <div v-if="expenseCategories.length === 0 && !loading" class="empty-hint">
            暂无支出分类，点击右上角新增
          </div>
        </div>
      </div>
    </div>

    <!-- 收入分类 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <TrendingUp :size="18" :stroke-width="1.5" />
          <span>收入分类</span>
        </div>
        <button class="btn btn-primary" @click="openAddModal('income')">
          <Plus :size="16" :stroke-width="2" />
          新增分类
        </button>
      </div>
      <div class="card-body">
        <div class="category-list">
          <div class="category-item" v-for="cat in incomeCategories" :key="cat._id">
            <div class="category-icon" :style="{ background: cat.color + '20', color: cat.color }">
              <CategoryIcon :id="cat.iconId" :size="18" />
            </div>
            <span class="cat-name">{{ cat.name }}</span>
            <div class="cat-type-tag income">收入</div>
            <div class="cat-color" :style="{ background: cat.color }"></div>
            <div class="cat-actions">
              <button class="btn-small" @click="openEditModal(cat)">
                <Edit3 :size="14" :stroke-width="1.5" />
                编辑
              </button>
              <button class="btn-small danger" @click="deleteCategory(cat)">
                <Trash2 :size="14" :stroke-width="1.5" />
                删除
              </button>
            </div>
          </div>
          <div v-if="incomeCategories.length === 0 && !loading" class="empty-hint">
            暂无收入分类，点击右上角新增
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editingCategory ? '编辑分类' : '新增分类' }}</h3>
          <button class="modal-close" @click="closeModal"><X :size="18" /></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">分类名称</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="如：餐饮" required />
          </div>
          <div class="form-group">
            <label class="form-label">分类类型</label>
            <div class="type-tabs">
              <button
                type="button"
                class="type-tab"
                :class="{ active: form.type === 'expense' }"
                @click="form.type = 'expense'"
                :disabled="!!editingCategory"
              >
                <TrendingDown :size="16" />
                支出
              </button>
              <button
                type="button"
                class="type-tab"
                :class="{ active: form.type === 'income' }"
                @click="form.type = 'income'"
                :disabled="!!editingCategory"
              >
                <TrendingUp :size="16" />
                收入
              </button>
            </div>
          </div>

          <!-- 颜色选择 -->
          <div class="form-group">
            <label class="form-label">颜色</label>
            <div class="color-grid">
              <div
                v-for="color in colorOptions"
                :key="color"
                class="color-option"
                :class="{ active: form.color === color }"
                :style="{ background: color }"
                @click="form.color = color"
              ></div>
            </div>
          </div>

          <!-- 图标选择 -->
          <div class="form-group">
            <label class="form-label">图标 <span class="label-hint">（点击选择）</span></label>
            <IconPicker v-model="form.iconId" :category-type="form.type" />
          </div>

          <!-- 预览 -->
          <div class="preview-row" v-if="form.name">
            <div class="preview-label">预览效果</div>
            <div class="category-preview">
              <div class="preview-icon" :style="{ background: form.color + '22', color: form.color }">
                <CategoryIcon :id="form.iconId || form.name" :size="20" />
              </div>
              <span class="preview-name">{{ form.name }}</span>
              <span class="preview-type" :class="form.type">{{ form.type === 'income' ? '收入' : '支出' }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn secondary" @click="closeModal">取消</button>
          <button type="button" class="btn primary" :disabled="saving || !form.name.trim()" @click="saveCategory">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CategoryIcon from '../../components/CategoryIcon.vue'
import IconPicker from '../../components/IconPicker.vue'
import { Tags, Edit3, Trash2, Plus, X, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const categories = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingCategory = ref(null)
const saving = ref(false)

const expenseCategories = computed(() => categories.value.filter(c => c.type === 'expense'))
const incomeCategories = computed(() => categories.value.filter(c => c.type === 'income'))

const colorOptions = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#EC4899', '#F43F5E', '#78716C', '#64748B'
]

const form = ref({ name: '', type: 'expense', color: '#EF4444', iconId: '' })

const fetchCategories = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
    categories.value = res.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
  } finally {
    loading.value = false
  }
}

const openAddModal = (type) => {
  editingCategory.value = null
  form.value = { name: '', type, color: '#EF4444', iconId: '' }
  showModal.value = true
}

const openEditModal = (cat) => {
  editingCategory.value = cat
  form.value = { name: cat.name, type: cat.type, color: cat.color, iconId: cat.iconId || '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
}

const saveCategory = async () => {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  saving.value = true
  try {
    const token = localStorage.getItem('token')
    if (editingCategory.value) {
      await axios.put(`/api/admin/categories/${editingCategory.value._id}`, {
        name: form.value.name,
        color: form.value.color,
        iconId: form.value.iconId || form.value.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      ElMessage.success('分类已更新')
    } else {
      await axios.post('/api/admin/categories', {
        name: form.value.name,
        type: form.value.type,
        color: form.value.color,
        iconId: form.value.iconId || form.value.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      ElMessage.success('分类已创建')
    }
    closeModal()
    fetchCategories()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (cat) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类「${cat.name}」吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const token = localStorage.getItem('token')
    await axios.delete(`/api/admin/categories/${cat._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('分类已删除')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.card-body { padding: 24px; }

.category-list { display: flex; flex-direction: column; gap: 12px; }
.category-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}
.category-item:hover { background: var(--color-surface-active); }

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cat-name { flex: 1; font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.cat-type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.cat-type-tag.expense { background: var(--color-expense-soft); color: var(--color-expense); }
.cat-type-tag.income { background: var(--color-income-soft); color: var(--color-income); }
.cat-color { width: 24px; height: 24px; border-radius: var(--radius-sm); flex-shrink: 0; }
.cat-actions { display: flex; gap: 8px; }
.empty-hint { font-size: 14px; color: var(--color-text-muted); text-align: center; padding: 24px; }

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
}
.btn.primary { background: var(--color-primary); color: white; }
.btn.primary:hover { background: var(--color-primary-dark); }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn.secondary { background: var(--color-surface-hover); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.btn.secondary:hover { background: var(--color-surface-active); }

.btn-small {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-small:hover { background: var(--color-surface-hover); color: var(--color-primary); border-color: var(--color-primary); }
.btn-small.danger { color: var(--color-expense); }
.btn-small.danger:hover { background: var(--color-expense-bg); border-color: var(--color-expense); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal {
  width: 520px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.modal-lg { width: 600px; }
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.modal-header h3 { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-surface-hover);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}
.modal-close:hover { background: var(--color-surface-active); color: var(--color-text-primary); }
.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-body::-webkit-scrollbar { width: 4px; }
.modal-body::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 2px; }
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.label-hint { font-size: 11px; color: var(--color-text-muted); font-weight: 400; }
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

.type-tabs { display: flex; gap: 8px; }
.type-tab {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-ui);
}
.type-tab:hover:not(:disabled) { border-color: var(--color-text-muted); }
.type-tab.active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }
.type-tab:disabled { opacity: 0.5; cursor: not-allowed; }

.color-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.color-option {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}
.color-option:hover { transform: scale(1.1); }
.color-option.active { border-color: var(--color-text-primary); box-shadow: 0 0 0 2px white; }

/* 预览 */
.preview-row {
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  border: 1px solid var(--color-border);
}
.preview-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}
.category-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); flex: 1; }
.preview-type {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}
.preview-type.expense { background: var(--color-expense-soft); color: var(--color-expense); }
.preview-type.income { background: var(--color-income-soft); color: var(--color-income); }
</style>