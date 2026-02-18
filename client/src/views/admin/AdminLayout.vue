<template>
  <div class="admin-layout flex min-h-screen bg-gray-100">
    <!-- 侧边栏 -->
    <el-aside width="260px" class="bg-white border-r border-gray-200 flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center px-5 border-b border-gray-100">
        <span class="text-2xl mr-2">💰</span>
        <span class="text-lg font-semibold text-gray-800">财务管理系统</span>
      </div>
      
      <!-- 菜单 -->
      <el-menu
        :default-active="currentRoute"
        class="flex-1 border-none"
        :collapse="false"
        :ellipsis="false"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        
        <el-sub-menu index="user">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/admin/users">用户列表</el-menu-item>
          <el-menu-item index="/admin/risk">
            <span>风险监控</span>
            <el-badge :value="12" class="ml-2" type="danger" />
          </el-menu-item>
          <el-menu-item index="/admin/users-add">新增用户</el-menu-item>
          <el-menu-item index="/admin/users-batch">批量操作</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="finance">
          <template #title>
            <el-icon><Money /></el-icon>
            <span>财务数据</span>
          </template>
          <el-menu-item index="/admin/finance-stats">消费统计</el-menu-item>
          <el-menu-item index="/admin/finance-category">分类分析</el-menu-item>
          <el-menu-item index="/admin/finance-trend">趋势报表</el-menu-item>
          <el-menu-item index="/admin/finance-export">导出中心</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="settings">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/admin/settings-basic">基础配置</el-menu-item>
          <el-menu-item index="/admin/settings-category">分类管理</el-menu-item>
          <el-menu-item index="/admin/settings-message">消息模板</el-menu-item>
          <el-menu-item index="/admin/settings-log">操作日志</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/admin/notifications">
          <el-icon><Bell /></el-icon>
          <span>消息中心</span>
          <el-badge :value="5" class="ml-2" type="danger" />
        </el-menu-item>
      </el-menu>
      
      <!-- 版本 -->
      <div class="h-12 flex items-center justify-center border-t border-gray-100 text-xs text-gray-400">
        版本 v1.0.0
      </div>
    </el-aside>
    
    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部导航 -->
      <el-header class="bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>控制台</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
        
        <div class="flex items-center gap-4">
          <el-badge :value="3">
            <el-button :icon="Bell" circle />
          </el-badge>
          <el-dropdown trigger="click">
            <div class="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100">
              <el-avatar :size="32" style="background: #10B981;">Admin</el-avatar>
              <span class="text-sm text-gray-600">Admin</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 页面内容 -->
      <el-main class="p-6">
        <router-view />
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataAnalysis,
  User,
  Money,
  Setting,
  Bell,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const currentRoute = computed(() => route.path)

const menuItems = {
  '/admin/dashboard': '数据概览',
  '/admin/users': '用户列表',
  '/admin/risk': '风险监控',
  '/admin/users/add': '新增用户',
  '/admin/users/batch': '批量操作',
  '/admin/finance/stats': '消费统计',
  '/admin/finance/category': '分类分析',
  '/admin/finance/trend': '趋势报表',
  '/admin/finance/export': '导出中心',
  '/admin/settings/basic': '基础配置',
  '/admin/settings/category': '分类管理',
  '/admin/settings/message': '消息模板',
  '/admin/settings/log': '操作日志',
  '/admin/notifications': '消息中心'
}

const currentPageTitle = computed(() => menuItems[currentRoute.value] || '')

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style>
.el-menu {
  border-right: none !important;
}

.el-menu-item,
.el-sub-menu__title {
  height: 44px !important;
  line-height: 44px !important;
}

.el-menu-item.is-active {
  background-color: #ecfdf5 !important;
  color: #059669 !important;
}

.el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #10b981;
  border-radius: 0 2px 2px 0;
}

.el-sub-menu.is-active > .el-sub-menu__title {
  color: #059669 !important;
}

.el-sub-menu .el-menu-item {
  padding-left: 52px !important;
}
</style>
