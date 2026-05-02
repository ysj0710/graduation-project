<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <Wallet :size="22" :stroke-width="1.5" />
          </div>
          <span class="logo-text">财务管理系统</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a href="/admin/dashboard" class="nav-item" :class="{ active: currentPath === '/admin/dashboard' }">
          <LayoutDashboard :size="18" :stroke-width="1.5" />
          <span class="nav-label">数据概览</span>
        </a>

        <div class="nav-section">
          <div class="nav-section-title">用户管理</div>
          <a href="/admin/users" class="nav-item sub" :class="{ active: currentPath === '/admin/users' }">
            <Users :size="16" :stroke-width="1.5" />
            <span class="nav-label">用户列表</span>
          </a>
          <a href="/admin/risk" class="nav-item sub" :class="{ active: currentPath === '/admin/risk' }">
            <AlertTriangle :size="16" :stroke-width="1.5" />
            <span class="nav-label">风险监控</span>
          </a>
          <a href="/admin/users-add" class="nav-item sub" :class="{ active: currentPath === '/admin/users-add' }">
            <UserPlus :size="16" :stroke-width="1.5" />
            <span class="nav-label">新增用户</span>
          </a>
          <a href="/admin/users-batch" class="nav-item sub" :class="{ active: currentPath === '/admin/users-batch' }">
            <Layers :size="16" :stroke-width="1.5" />
            <span class="nav-label">批量操作</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">财务数据</div>
          <a href="/admin/finance-stats" class="nav-item sub" :class="{ active: currentPath === '/admin/finance-stats' }">
            <CreditCard :size="16" :stroke-width="1.5" />
            <span class="nav-label">消费统计</span>
          </a>
          <a href="/admin/finance-category" class="nav-item sub" :class="{ active: currentPath === '/admin/finance-category' }">
            <FolderOpen :size="16" :stroke-width="1.5" />
            <span class="nav-label">分类分析</span>
          </a>
          <a href="/admin/finance-trend" class="nav-item sub" :class="{ active: currentPath === '/admin/finance-trend' }">
            <TrendingUp :size="16" :stroke-width="1.5" />
            <span class="nav-label">趋势报表</span>
          </a>
          <a href="/admin/finance-export" class="nav-item sub" :class="{ active: currentPath === '/admin/finance-export' }">
            <Download :size="16" :stroke-width="1.5" />
            <span class="nav-label">导出中心</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">系统设置</div>
          <a href="/admin/settings-basic" class="nav-item sub" :class="{ active: currentPath === '/admin/settings-basic' }">
            <Settings :size="16" :stroke-width="1.5" />
            <span class="nav-label">基础配置</span>
          </a>
          <a href="/admin/settings-category" class="nav-item sub" :class="{ active: currentPath === '/admin/settings-category' }">
            <Tags :size="16" :stroke-width="1.5" />
            <span class="nav-label">分类管理</span>
          </a>
          <a href="/admin/settings-message" class="nav-item sub" :class="{ active: currentPath === '/admin/settings-message' }">
            <MessageSquare :size="16" :stroke-width="1.5" />
            <span class="nav-label">消息模板</span>
          </a>
          <a href="/admin/settings-log" class="nav-item sub" :class="{ active: currentPath === '/admin/settings-log' }">
            <ScrollText :size="16" :stroke-width="1.5" />
            <span class="nav-label">操作日志</span>
          </a>
        </div>

        <a href="/admin/send-notification" class="nav-item" :class="{ active: currentPath === '/admin/send-notification' }">
          <Send :size="18" :stroke-width="1.5" />
          <span class="nav-label">发送通知</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-card">
          <div class="admin-avatar">A</div>
          <div class="admin-info">
            <div class="admin-name">管理员</div>
            <div class="admin-role">超级管理员</div>
          </div>
          <button class="logout-btn" @click="handleLogout" title="退出登录">
            <LogOut :size="16" :stroke-width="1.5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <!-- extra header buttons removed -->
        </div>
      </header>

      <div class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-slide" mode="out-in">
            <suspense>
              <template #default>
                <component :is="Component" :key="$route.path" />
              </template>
              <template #fallback>
                <div class="page-loading">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
              </template>
            </suspense>
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Wallet, LayoutDashboard, Users, AlertTriangle, UserPlus, Layers,
  CreditCard, FolderOpen, TrendingUp, Download, Settings, Tags,
  MessageSquare, ScrollText, LogOut, Send
} from 'lucide-vue-next'

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
  '/admin/notifications': '消息中心',
  '/admin/send-notification': '发送通知'
}
const pageTitle = computed(() => pageTitles[currentPath.value] || '管理控制台')

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('username')
  localStorage.removeItem('user_theme')
  localStorage.removeItem('user_budget')
  localStorage.removeItem('user_category_colors')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);
  margin-bottom: 4px;
  position: relative;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.nav-item.sub {
  padding: 10px 14px 10px 38px;
  font-size: 13px;
}

.nav-section {
  margin-top: 16px;
  margin-bottom: 8px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
  padding: 8px 14px;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Footer */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.admin-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
}

.admin-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #F97316 0%, #FB923C 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.admin-info {
  flex: 1;
  min-width: 0;
}

.admin-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-role {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
  white-space: nowrap;
}

.logout-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.logout-btn:hover {
  background: var(--color-surface-active);
  color: var(--color-expense);
}

/* Main */
.main-content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* Header */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Content */
.page-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 100%;
}

/* 路由切换过渡动画 */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 页面加载动画 */
.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>