<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>📂 分类管理</h3>
      <div class="category-list">
        <div class="category-item" v-for="cat in categories" :key="cat.id">
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-color" :style="{ background: cat.color }"></span>
          <el-button size="small">编辑</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const categories = ref([
  { id: 1, name: '餐饮', icon: '🍜', color: '#FF3B30' },
  { id: 2, name: '交通', icon: '🚗', color: '#FF9500' },
  { id: 3, name: '购物', icon: '🛍️', color: '#007AFF' },
  { id: 4, name: '娱乐', icon: '🎮', color: '#AF52DE' }
])
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.ios-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #F5F5F7;
  border-radius: 12px;
}

.cat-icon {
  font-size: 22px;
}

.cat-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.cat-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}
</style>
