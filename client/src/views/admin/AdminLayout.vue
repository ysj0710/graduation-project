<template>
  <div class="admin-layout">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">💰</span>
          <span class="logo-text">财务管理系统</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a 
          href="/admin/dashboard"
          class="nav-item"
          :class="{ active: currentPath === '/admin/dashboard' }"
        >
          <span class="nav-icon">📊</span>
          <span class="nav-label">数据概览</span>
        </a>
        
        <!-- 用户管理 -->
        <div class="nav-group">
          <div class="nav-group-title">用户管理</div>
          <a 
            href="/admin/users"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/users' }"
          >
            <span>👥</span> 用户列表
          </a>
          <a 
            href="/admin/risk"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/risk' }"
          >
            <span>⚠️</span> 风险监控
          </a>
          <a 
            href="/admin/users-add"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/users-add' }"
          >
            <span>➕</span> 新增用户
          </a>
          <a 
            href="/admin/users-batch"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/users-batch' }"
          >
            <span>📋</span> 批量操作
          </a>
        </div>
        
        <!-- 财务数据 -->
        <div class="nav-group">
          <div class="nav-group-title">财务数据</div>
          <a 
            href="/admin/finance-stats"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/finance-stats' }"
          >
            <span>💳</span> 消费统计
          </a>
          <a 
            href="/admin/finance-category"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/finance-category' }"
          >
            <span>📁</span> 分类分析
          </a>
          <a 
            href="/admin/finance-trend"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/finance-trend' }"
          >
            <span>📈</span> 趋势报表
          </a>
          <a 
            href="/admin/finance-export"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/finance-export' }"
          >
            <span>📤</span> 导出中心
          </a>
        </div>
        
        <!-- 系统设置 -->
        <div class="nav-group">
          <div class="nav-group-title">系统设置</div>
          <a 
            href="/admin/settings-basic"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/settings-basic' }"
          >
            <span>⚙️</span> 基础配置
          </a>
          <a 
            href="/admin/settings-category"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/settings-category' }"
          >
            <span>📂</span> 分类管理
          </a>
          <a 
            href="/admin/settings-message"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/settings-message' }"
          >
            <span>📝</span> 消息模板
          </a>
          <a 
            href="/admin/settings-log"
            class="nav-item sub"
            :class="{ active: currentPath === '/admin/settings-log' }"
          >
            <span>📜</span> 操作日志
          </a>
        </div>
        
        <a 
          href="/admin/notifications"
          class="nav-item"
          :class="{ active: currentPath === '/admin/notifications' }"
        >
          <span class="nav-icon">🔔</span>
          <span class="nav-label">消息中心</span>
          <span class="nav-badge">5</span>
        </a>
      </nav>
      
      <!-- 底部用户信息 -->
      <div class="sidebar-footer">
        <div class="admin-info">
          <el-avatar :size="40" style="background: #10B981;">Admin</el-avatar>
          <div class="admin-detail">
            <div class="admin-name">管理员</div>
            <div class="admin-role">超级管理员</div>
          </div>
          <el-button :icon="SwitchButton" circle size="small" @click="handleLogout" />
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <el-badge :value="3">
            <el-button :icon="Bell" circle />
          </el-badge>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, SwitchButton } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => route.path)

const pageTitles = {
  '/admin/dashboard': '数据概览',
  '/admin/users': '用户列表',
  '/admin/risk': '风险监控',
  '/admin/users-add': '新增用户',
  '/admin/users-batch': '批量操作',
  '/admin/finance-stats': '消费统计',
  '/admin/finance-category': '分类分析',
  '/admin/finance-trend': '趋势报表',
  '/admin/finance-export': '导出中心',
  '/admin/settings-basic': '基础配置',
  '/admin/settings-category': '分类管理',
  '/admin/settings-message': '消息模板',
  '/admin/settings-log': '操作日志',
  '/admin/notifications': '消息中心'
}

const pageTitle = computed(() => pageTitles[currentPath.value] || '管理控制台')

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #F5F5F7;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #000;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  color: #3C3C43;
  text-decoration: none;
  margin: 4px 0;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  background: rgba(0, 122, 255, 0.08);
}

.nav-item.active {
  background: rgba(0, 122, 255, 0.15);
  color: #007AFF;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #007AFF;
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
}

.nav-badge {
  margin-left: auto;
  background: #FF3B30;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.nav-group {
  margin-top: 16px;
}

.nav-group-title {
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 16px;
}

.nav-item.sub {
  padding-left: 32px;
  font-size: 14px;
}

.nav-item.sub span:first-child {
  font-size: 14px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0, 122, 255, 0.08);
}

.admin-detail {
  flex: 1;
}

.admin-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.admin-role {
  font-size: 12px;
  color: #8E8E93;
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: 280px;
  min-height: 100vh;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.page-content {
  padding: 32px;
}
</style>
