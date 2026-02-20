<template>
  <div class="user-page">
    <div class="page-header">
      <h2>💳 账户管理</h2>
      <el-button type="primary" size="small">+ 添加账户</el-button>
    </div>
    
    <div class="accounts-list">
      <div class="account-card" v-for="account in accounts" :key="account.id">
        <div class="account-icon" :style="{ background: account.color + '15' }">
          {{ account.icon }}
        </div>
        <div class="account-info">
          <div class="account-name">{{ account.name }}</div>
          <div class="account-type">{{ account.type }}</div>
        </div>
        <div class="account-balance">¥{{ formatNumber(account.balance) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const accounts = ref([
  { id: 1, name: '现金', type: '现金', icon: '💵', balance: 2500, color: '#34C759' },
  { id: 2, name: '银行卡', type: '储蓄卡', icon: '💳', balance: 15000, color: '#007AFF' },
  { id: 3, name: '支付宝', type: '电子钱包', icon: '📱', balance: 5000, color: '#5856D6' },
  { id: 4, name: '微信', type: '电子钱包', icon: '💬', balance: 1200, color: '#07BE63' }
])

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
</script>

<style scoped>
.user-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: white;
  border-radius: 16px;
}

.account-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.account-type {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 2px;
}

.account-balance {
  font-size: 18px;
  font-weight: 700;
  color: #000;
}
</style>
