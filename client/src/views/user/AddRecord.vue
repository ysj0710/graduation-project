<template>
  <div class="user-app-container add-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" circle @click="$router.back()" />
      <span class="title">记一笔</span>
      <el-button type="primary" size="small" @click="saveRecord" :loading="saving">
        保存
      </el-button>
    </div>

    <!-- 金额显示 -->
    <div class="amount-display">
      <div class="type-toggle">
        <el-button 
          :type="record.type === 'income' ? 'success' : 'default'"
          round 
          @click="record.type = 'income'"
        >
          收入
        </el-button>
        <el-button 
          :type="record.type === 'expense' ? 'danger' : 'default'"
          round 
          @click="record.type = 'expense'"
        >
          支出
        </el-button>
      </div>
      <div class="amount-text">
        <span class="currency">¥</span>
        <span class="amount" :class="record.type">{{ displayAmount }}</span>
      </div>
      <el-input
        v-model="record.note"
        placeholder="添加备注..."
        class="note-input"
        clearable
      />
    </div>

    <!-- 分类选择 -->
    <div class="category-section">
      <div class="section-title">选择分类</div>
      <div class="category-grid">
        <div 
          v-for="cat in currentCategories" 
          :key="cat.id"
          class="category-item"
          :class="{ active: record.category === cat.name }"
          :style="{ 
            '--cat-color': cat.color,
            background: record.category === cat.name ? cat.color + '20' : '#F9FAFB' 
          }"
          @click="record.category = cat.name"
        >
          <span class="icon">{{ cat.icon }}</span>
          <span class="name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <!-- 数字键盘 -->
    <div class="keypad">
      <div class="keypad-row">
        <button class="key" @click="inputDigit('7')">7</button>
        <button class="key" @click="inputDigit('8')">8</button>
        <button class="key" @click="inputDigit('9')">9</button>
        <button class="key delete" @click="deleteDigit">
          <el-icon><Backspace /></el-icon>
        </button>
      </div>
      <div class="keypad-row">
        <button class="key" @click="inputDigit('4')">4</button>
        <button class="key" @click="inputDigit('5')">5</button>
        <button class="key" @click="inputDigit('6')">6</button>
        <button class="key action" @click="setToday">今天</button>
      </div>
      <div class="keypad-row">
        <button class="key" @click="inputDigit('1')">1</button>
        <button class="key" @click="inputDigit('2')">2</button>
        <button class="key" @click="inputDigit('3')">3</button>
        <button class="key action" @click="record.type = record.type === 'income' ? 'expense' : 'income'">
          {{ record.type === 'income' ? '支出' : '收入' }}
        </button>
      </div>
      <div class="keypad-row">
        <button class="key" @click="inputDigit('.')">.</button>
        <button class="key" @click="inputDigit('0')">0</button>
        <button class="key" @click="inputDigit('00')">00</button>
        <button class="key confirm" @click="saveRecord">
          <el-icon><Check /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { ArrowLeft, Backspace, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const saving = ref(false)
const amountStr = ref('0')

const record = ref({
  type: 'expense',
  amount: 0,
  category: '餐饮',
  note: '',
  date: new Date().toISOString().split('T')[0]
})

const displayAmount = computed(() => {
  if (amountStr.value === '0' || amountStr.value === '') return '0'
  return amountStr.value
})

const currentCategories = computed(() => {
  return record.value.type === 'income' 
    ? userStore.categories.income 
    : userStore.categories.expense
})

const inputDigit = (digit) => {
  if (digit === '.') {
    if (amountStr.value.includes('.')) return
    amountStr.value += '.'
  } else if (digit === '00') {
    if (amountStr.value === '0') return
    amountStr.value += '00'
  } else {
    if (amountStr.value === '0') {
      amountStr.value = digit
    } else {
      amountStr.value += digit
    }
  }
}

const deleteDigit = () => {
  if (amountStr.value.length > 1) {
    amountStr.value = amountStr.value.slice(0, -1)
  } else {
    amountStr.value = '0'
  }
}

const setToday = () => {
  record.value.date = new Date().toISOString().split('T')[0]
}

const saveRecord = async () => {
  const amount = parseFloat(amountStr.value)
  if (!amount || amount <= 0) {
    ElMessage.warning('请输入金额')
    return
  }
  if (!record.value.category) {
    ElMessage.warning('请选择分类')
    return
  }

  saving.value = true
  try {
    await userStore.addRecord({
      type: record.value.type,
      amount: amount,
      category: record.value.category,
      note: record.value.note,
      date: record.value.date
    })
    ElMessage.success('记账成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '记账失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // 从 URL 参数获取预填信息
  if (route.query.type) {
    record.value.type = route.query.type
  }
  if (route.query.category) {
    record.value.category = route.query.category
  }
})
</script>

<style scoped>
.user-app-container.add-page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #F9FAFB;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.amount-display {
  background: white;
  padding: 24px 20px;
  text-align: center;
}

.type-toggle {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.amount-text {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.currency {
  font-size: 20px;
  color: #6B7280;
}

.amount {
  font-size: 42px;
  font-weight: 700;
  color: #111827;
}

.amount.income {
  color: #10B981;
}

.amount.expense {
  color: #EF4444;
}

.note-input {
  margin-top: 16px;
}

.note-input :deep(.el-input__wrapper) {
  border: none;
  background: #F3F4F6;
  border-radius: 12px;
}

.category-section {
  background: white;
  padding: 16px;
  margin-top: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item.active {
  border: 2px solid var(--cat-color);
}

.category-item .icon {
  font-size: 24px;
}

.category-item .name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.keypad {
  margin-top: auto;
  background: white;
  padding: 16px 12px 24px;
  border-radius: 24px 24px 0 0;
}

.keypad-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.key {
  flex: 1;
  height: 54px;
  border: none;
  border-radius: 14px;
  background: #F3F4F6;
  font-size: 22px;
  font-weight: 500;
  color: #111827;
  cursor: pointer;
  transition: background 0.15s;
}

.key:active {
  background: #E5E7EB;
}

.key.delete, .key.action {
  background: #E5E7EB;
  color: #6B7280;
  font-size: 14px;
}

.key.confirm {
  background: #10B981;
  color: white;
}

.key.confirm:active {
  background: #059669;
}
</style>
