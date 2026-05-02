<template>
  <div class="user-layout" :style="pageBgStyle">
    <!-- 移动端顶部栏 -->
    <header class="mobile-header">
      <div class="mobile-header-left">
        <Wallet :size="20" :stroke-width="1.8" class="mobile-logo-icon" />
        <span class="mobile-logo-text">{{ systemName }}</span>
      </div>
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <Menu v-if="!isMobileMenuOpen" :size="22" />
        <X v-else :size="22" />
      </button>
    </header>

    <!-- 移动端侧边栏遮罩 -->
    <div
      v-if="isMobileMenuOpen"
      class="sidebar-overlay"
      @click="closeMobileMenu"
    ></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'sidebar--open': isMobileMenuOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <Wallet :size="24" :stroke-width="1.8" />
          <span class="logo-text">{{ systemName }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="closeMobileMenu"
        >
          <component
            :is="getNavIcon(item.icon)"
            :size="18"
            :stroke-width="1.8"
          />
          <span class="nav-label">{{ item.label }}</span>
          <span
            v-if="item.id === 'notifications' && unreadCount > 0"
            class="nav-badge"
            >{{ unreadCount }}</span
          >
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link
          to="/profile"
          class="user-card"
          :class="{ active: route.path === '/profile' }"
          @click="closeMobileMenu"
        >
          <img
            v-if="userStore.profile.avatar"
            :src="userStore.profile.avatar"
            class="user-avatar-image"
          />
          <div v-else class="user-avatar">
            {{ userStore.profile.nickname?.charAt(0) || "U" }}
          </div>
          <div class="user-info">
            <div class="user-name">
              {{ userStore.profile.nickname || userStore.profile.username }}
            </div>
            <div class="user-role">普通用户</div>
          </div>
        </router-link>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
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
    </main>

    <!-- 桌面端 FAB 记账按钮 -->
    <button class="fab-button" @click="showAddSheet = true">
      <Plus :size="24" :stroke-width="2.5" />
    </button>

    <!-- 移动端底部导航 -->
    <nav class="mobile-bottom-nav">
      <router-link
        to="/dashboard"
        class="mobile-nav-item"
        :class="{ active: isMobileActive('/dashboard') }"
      >
        <Home :size="20" :stroke-width="1.8" />
        <span>总览</span>
      </router-link>
      <!-- 中间记账按钮 -->
      <div class="mobile-add-wrapper">
        <button class="mobile-add-btn" @click="showAddSheet = true">
          <Plus :size="24" :stroke-width="2.5" />
        </button>
        <span class="mobile-add-label">记一笔</span>
      </div>
      <router-link
        to="/profile"
        class="mobile-nav-item"
        :class="{ active: isMobileActive('/profile') }"
      >
        <User :size="20" :stroke-width="1.8" />
        <span>我的</span>
      </router-link>
    </nav>

    <!-- 登录通知弹窗 -->
    <div
      v-if="showNotificationPopup"
      class="popup-overlay"
      @click.self="closePopup"
    >
      <div class="popup-card">
        <div class="popup-header">
          <div class="popup-title">
            <Bell :size="18" :stroke-width="1.5" />
            <span>系统通知</span>
          </div>
          <button class="popup-close" @click="closePopup">
            <X :size="18" />
          </button>
        </div>
        <div class="popup-body">
          <div v-if="popupNotifications.length === 0" class="popup-empty">
            <CheckCircle2 :size="40" :stroke-width="1" />
            <p>暂无新通知</p>
          </div>
          <div
            v-for="notif in popupNotifications"
            :key="notif._id"
            class="popup-item"
            :class="notif.type"
            @click="markAsRead(notif)"
          >
            <div class="popup-item-icon">
              <AlertTriangle v-if="notif.type === 'risk_warning'" :size="16" />
              <Bell v-else :size="16" />
            </div>
            <div class="popup-item-content">
              <div class="popup-item-title">{{ notif.title }}</div>
              <div class="popup-item-text">{{ notif.content }}</div>
            </div>
            <div v-if="!notif.isRead" class="unread-dot"></div>
          </div>
        </div>
        <div class="popup-footer">
          <button
            class="popup-btn"
            @click="
              $router.push('/notifications');
              closePopup();
            "
          >
            查看全部
          </button>
        </div>
      </div>
    </div>

    <!-- 记账面板 -->
    <div
      v-if="showAddSheet"
      class="sheet-overlay"
      @click="showAddSheet = false"
    >
      <div class="sheet-container" @click.stop>
        <div class="sheet-header">
          <div class="sheet-title">
            <Receipt :size="18" :stroke-width="1.8" />
            <span>记一笔</span>
          </div>
          <button class="close-btn" @click="showAddSheet = false">
            <X :size="18" :stroke-width="2" />
          </button>
        </div>

        <!-- 主体：单列纵向布局 -->
        <div class="sheet-body">
          <!-- 顶部：日期 + 类型切换 -->
          <div class="sheet-top-row">
            <input v-model="record.date" type="date" class="sheet-date-field" />
            <div class="type-tabs">
              <button
                class="type-tab"
                :class="{ active: record.type === 'expense' }"
                @click="record.type = 'expense'"
              >支出</button>
              <button
                class="type-tab"
                :class="{ active: record.type === 'income', income: record.type === 'income' }"
                @click="record.type = 'income'"
              >收入</button>
            </div>
          </div>

          <!-- 分类选择：横向滚动标签 -->
          <div class="category-row-section">
            <div class="category-row">
              <button
                v-for="cat in currentCategories"
                :key="cat.id"
                class="cat-tag"
                :class="{ selected: newItem.category === cat.name }"
                @click="newItem.category = cat.name"
              >
                <CategoryIcon :id="cat.id" :name="cat.name" :size="14" />
                <span>{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- 金额 + 添加按钮 横向排列 -->
          <div class="input-row">
            <div class="input-group amount-group">
              <span class="input-prefix">¥</span>
              <input
                v-model.number="newItem.amount"
                type="number"
                placeholder="0.00"
                class="compact-field"
                @keyup.enter="addItem"
              />
            </div>
            <button
              class="add-btn-compact"
              :disabled="!newItem.category || !newItem.amount"
              @click="addItem"
            >
              <Plus :size="16" :stroke-width="2.5" />
              <span>添加</span>
            </button>
          </div>

          <!-- 备注单独一行 -->
          <div class="note-row">
            <input
              v-model="newItem.note"
              type="text"
              placeholder="添加备注（可选）"
              class="note-field-full"
            />
          </div>

          <!-- 账单小计列表 -->
          <div class="bill-list" ref="billListRef">
            <div
              v-for="item in currentBillItems"
              :key="item.id"
              class="bill-item"
            >
              <div class="bill-item-left">
                <span class="bill-item-category">{{ item.category }}</span>
                <span v-if="item.note" class="bill-item-note">{{ item.note }}</span>
              </div>
              <div class="bill-item-right">
                <span class="bill-item-amount" :class="item.type">
                  ¥{{ formatNumber(item.amount) }}
                </span>
                <button class="bill-item-delete" @click="removeItem(item.id)">
                  <X :size="14" :stroke-width="2" />
                </button>
              </div>
            </div>
            <div v-if="currentBillItems.length === 0" class="bill-empty">
              <p>暂无项目，选择分类并输入金额后添加</p>
            </div>
          </div>

          <!-- 底部合计 + 确认 -->
          <div class="bill-footer" v-if="currentBillItems.length > 0">
            <div class="bill-total">
              <span>合计</span>
              <span class="total-amount" :class="record.type">¥{{ formatNumber(billTotal) }}</span>
            </div>
            <button class="confirm-btn" @click="confirmAdd">
              确认记账 ({{ currentBillItems.length }}笔)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Wallet,
  Home,
  ListOrdered,
  BarChart3,
  TrendingUp,
  Palette,
  Bell,
  Plus,
  Receipt,
  X,
  AlertTriangle,
  CheckCircle2,
  Menu,
  User,
} from "lucide-vue-next";
import { useUserStore } from "../../stores/user.js";
import axios from "axios";
import { ElMessage } from "element-plus";
import CategoryIcon from "../../components/CategoryIcon.vue";
import { THEME_PRESETS, PATTERNS } from "../../styles/themes.js";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const systemName = ref("随手记");
const unreadCount = ref(0);
const showAddSheet = ref(false);
const showNotificationPopup = ref(false);
const popupNotifications = ref([]);

// 移动端菜单状态
const isMobileMenuOpen = ref(false);
const isMobile = ref(false);

// 移动端底部导航：左总览，中记账，右个人中心（直接在模板中定义）

const isMobileActive = (path) => {
  if (path === "/dashboard") return route.path === "/dashboard";
  if (path === "/profile") return route.path === "/profile";
  return route.path.startsWith(path);
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) {
    isMobileMenuOpen.value = false;
  }
};

onMounted(() => {
  fetchNotifications();
  userStore.fetchCategories();
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const record = ref({
  type: "expense",
  date: new Date().toISOString().split("T")[0],
});
const newItem = ref({ category: "", amount: null, note: "" });
const billItems = ref([]);
const billListRef = ref(null);

const navItems = [
  { id: "dashboard", icon: "Home", label: "总览", path: "/dashboard" },
  {
    id: "transactions",
    icon: "ListOrdered",
    label: "交易记录",
    path: "/transactions",
  },
  {
    id: "statistics",
    icon: "BarChart3",
    label: "统计分析",
    path: "/statistics",
  },
  {
    id: "consumption",
    icon: "TrendingUp",
    label: "消费分析",
    path: "/consumption",
  },
  { id: "personal", icon: "Palette", label: "个性设置", path: "/personal" },
  {
    id: "notifications",
    icon: "Bell",
    label: "消息中心",
    path: "/notifications",
  },
];

const iconMap = { Home, ListOrdered, BarChart3, TrendingUp, Palette, Bell, User };
const getNavIcon = (name) => iconMap[name] || Home;

const isActive = (path) => {
  if (path === "/dashboard") return route.path === "/dashboard";
  return route.path.startsWith(path);
};

const pageBgStyle = computed(() => {
  const theme = userStore.theme;
  const patternKey = theme?.pattern || "dots";
  const pattern = PATTERNS[patternKey] || PATTERNS.dots;
  const bg =
    pattern.svg && pattern.svg !== "none"
      ? `${theme.background}, ${pattern.svg}`
      : theme.background;
  const bgSize =
    pattern.svg && pattern.svg !== "none" && pattern.bgSize !== "0"
      ? `cover, ${pattern.bgSize}`
      : "cover";
  return {
    background: bg,
    backgroundSize: bgSize,
    backgroundPosition: "center",
  };
});

watch(
  () => userStore.theme,
  (theme) => {
    if (!theme) return;
    const preset = THEME_PRESETS.find((t) => t.id === theme.presetId);
    const primary = theme.primaryColor || preset?.primaryColor || "#667eea";
    document.documentElement.style.setProperty("--color-primary", primary);
    document.documentElement.style.setProperty(
      "--color-primary-soft",
      `${primary}22`,
    );
    document.documentElement.style.setProperty(
      "--color-primary-light",
      `${primary}AA`,
    );
  },
  { immediate: true },
);

const currentCategories = computed(() =>
  record.value.type === "expense" ? userStore.categories.expense : userStore.categories.income,
);

const currentBillItems = computed(() =>
  billItems.value.filter(i => i.type === record.value.type),
);

const billTotal = computed(() =>
  currentBillItems.value.reduce((sum, i) => sum + Number(i.amount || 0), 0),
);

const formatNumber = (n) =>
  Number(n || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const addItem = () => {
  if (!newItem.value.category || !newItem.value.amount) return;
  billItems.value.push({
    ...newItem.value,
    type: record.value.type,
    id: Date.now(),
  });
  newItem.value = { category: "", amount: null, note: "" };
  // 滚动账单列表到顶部
  nextTick(() => {
    if (billListRef.value) {
      billListRef.value.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
};

const removeItem = (id) => {
  const idx = billItems.value.findIndex(i => i.id === id);
  if (idx !== -1) billItems.value.splice(idx, 1);
};

const confirmAdd = async () => {
  const itemsToSubmit = currentBillItems.value;
  if (itemsToSubmit.length === 0) return;
  try {
    const formattedItems = itemsToSubmit.map(item => ({
      category: item.category,
      amount: Number(item.amount),
      note: item.note || '',
      type: item.type
    }));
    const payload = {
      type: record.value.type,
      date: record.value.date,
      items: formattedItems,
    };
    console.log('[confirmAdd] 发送数据:', JSON.stringify(payload, null, 2));
    const res = await userStore.addRecord(payload);
    console.log('[confirmAdd] 响应:', res);
    ElMessage.success(`成功添加 ${itemsToSubmit.length} 笔记录`);
    billItems.value = billItems.value.filter(i => i.type !== record.value.type);
    showAddSheet.value = false;
  } catch (e) {
    console.error('[confirmAdd] 完整错误:', e);
    console.error('[confirmAdd] 响应数据:', e.response?.data);
    const msg = e.response?.data?.message || e.message || "添加失败";
    ElMessage.error(msg);
  }
};

const markAsRead = async (notif) => {
  if (notif.isRead) return;
  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `/api/notifications/${notif._id}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    notif.isRead = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (e) {
    console.error(e);
  }
};

const closePopup = () => {
  showNotificationPopup.value = false;
};

const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/notifications?page=1&pageSize=5", {
      headers: { Authorization: `Bearer ${token}` },
    });
    popupNotifications.value = res.data.notifications || [];
    unreadCount.value = res.data.unread || 0;
    if (popupNotifications.value.some((n) => !n.isRead)) {
      setTimeout(() => {
        showNotificationPopup.value = true;
      }, 1000);
    }
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchNotifications();
  userStore.fetchCategories();
});
</script>

<style scoped>
.user-layout {
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
  width: 100%;
}

/* ============================================
   Mobile Header (隐藏在桌面端)
   ============================================ */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}

.mobile-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-logo-icon {
  color: var(--color-primary);
}

.mobile-logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
}

.mobile-menu-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

/* ============================================
   Sidebar Overlay (移动端遮罩)
   ============================================ */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 150;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================
   Sidebar
   ============================================ */
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 50;
  overflow-y: auto;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--color-border);
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
}

.logo-text {
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  position: relative;
}

.nav-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}
.nav-item.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--color-border);
}
.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
  text-decoration: none;
  color: inherit;
}
.user-card:hover,
.user-card.active {
  background: var(--color-surface-hover);
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.user-avatar-image {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role {
  font-size: 11px;
  color: var(--color-text-muted);
}

.nav-badge {
  margin-left: auto;
  background: var(--color-expense);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* ============================================
   Main Content
   ============================================ */
.main-content {
  flex: 1;
  margin-left: 220px;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

/* ============================================
   Mobile Bottom Navigation (隐藏在桌面端)
   ============================================ */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  z-index: 100;
  padding: 0 24px;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: env(safe-area-inset-bottom, 8px);
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 24px;
  color: var(--color-text-muted);
  font-size: 10px;
  text-decoration: none;
  transition: color var(--transition-fast);
  border-radius: var(--radius-md);
  min-width: 64px;
}

.mobile-nav-item.active {
  color: var(--color-primary);
}

.mobile-nav-item:active {
  background: var(--color-surface-hover);
}

/* 中间记账按钮 */
.mobile-add-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: -20px;
}

.mobile-add-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  animation: addBtnPulse 2.5s ease-in-out infinite;
}

.mobile-add-btn:active {
  transform: scale(0.95);
  animation: none;
}

.mobile-add-label {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 500;
  line-height: 1;
}

@keyframes addBtnPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
  50% { transform: scale(1.08); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5); }
}

/* ============================================
   FAB Button
   ============================================ */
.fab-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
  z-index: 200;
}
.fab-button:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  z-index: 500;
  padding: 80px 24px 24px;
}
.popup-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}
.popup-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.popup-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  padding: 4px;
}
.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.popup-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--color-text-muted);
  font-size: 14px;
}
.popup-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
  margin-bottom: 4px;
}
.popup-item:hover {
  background: var(--color-surface-hover);
}
.popup-item-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.popup-item-content {
  flex: 1;
}
.popup-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}
.popup-item-text {
  font-size: 12px;
  color: var(--color-text-muted);
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-expense);
  flex-shrink: 0;
  margin-top: 4px;
}
.popup-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--color-border);
}
.popup-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.popup-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}
.sheet-container {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.sheet-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  padding: 4px;
}

/* 单列纵向布局 */
.sheet-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  min-height: 0;
  overflow: hidden;
}

/* 顶部行：日期 + 类型 */
.sheet-top-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.sheet-date-field {
  font-size: 13px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
  flex-shrink: 0;
}
.sheet-date-field:focus {
  border-color: var(--color-primary);
}

.type-tabs {
  display: flex;
  gap: 6px;
  flex: 1;
}
.type-tab {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}
.type-tab.active {
  background: var(--color-expense);
  border-color: var(--color-expense);
  color: white;
}
.type-tab.active.income {
  background: var(--color-income);
  border-color: var(--color-income);
}

/* 分类选择：横向滚动标签行 */
.category-row-section {
  flex-shrink: 0;
  margin-bottom: 10px;
  min-width: 0;
  overflow: hidden;
}
.category-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.category-row::-webkit-scrollbar {
  height: 4px;
}
.category-row::-webkit-scrollbar-track {
  background: transparent;
}
.category-row::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}
.category-row::-webkit-scrollbar {
  display: none;
}
.cat-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}
.cat-tag:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.cat-tag.selected {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

/* 输入行：金额 + 添加按钮 横向 */
.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.input-group {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}
.input-group:focus-within {
  border-color: var(--color-primary);
}
.input-prefix {
  padding: 0 6px 0 8px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
}
.amount-group {
  flex: 1;
  min-width: 0;
}
.compact-field {
  font-size: 14px;
  padding: 7px 8px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  width: 100%;
  outline: none;
  min-width: 0;
}
.amount-group .compact-field {
  font-weight: 700;
  font-size: 15px;
}
.add-btn-compact {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.add-btn-compact:hover:not(:disabled) {
  opacity: 0.9;
}
.add-btn-compact:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 备注单独一行 */
.note-row {
  margin-bottom: 10px;
  flex-shrink: 0;
}
.note-field-full {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 7px 10px;
  font-size: 13px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
  box-sizing: border-box;
}
.note-field-full:focus {
  border-color: var(--color-primary);
}

/* 账单小计列表 */
.bill-list {
  flex: 1;
  overflow-y: auto;
  min-height: 60px;
  max-height: 300px;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 10px;
}
.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}
.bill-item:last-child {
  border-bottom: none;
}
.bill-item-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.bill-item-category {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.bill-item-note {
  font-size: 11px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bill-item-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.bill-item-amount {
  font-size: 14px;
  font-weight: 700;
}
.bill-item-amount.expense { color: var(--color-expense); }
.bill-item-amount.income { color: var(--color-income); }
.bill-item-delete {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  padding: 2px;
  opacity: 0.6;
}
.bill-item-delete:hover { opacity: 1; }
.bill-empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-muted);
  font-size: 12px;
}

/* 底部合计 + 确认 */
.bill-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
  margin-top: 8px;
  flex-shrink: 0;
}
.bill-total {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.total-amount {
  font-size: 16px;
  font-weight: 700;
}
.total-amount.expense { color: var(--color-expense); }
.total-amount.income { color: var(--color-income); }
.confirm-btn {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}
.confirm-btn:hover {
  opacity: 0.9;
}

/* ============================================
   Sheet Responsive - Mobile
   ============================================ */
@media (max-width: 640px) {
  .sheet-overlay {
    padding: 0;
  }
  .sheet-container {
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }
  .sheet-body {
    padding: 10px 12px;
  }
  .sheet-top-row {
    margin-bottom: 8px;
  }
  .category-row-section {
    margin-bottom: 8px;
  }
  .input-row {
    margin-bottom: 8px;
  }
  .bill-list {
    max-height: none;
    flex: 1;
  }
}

@media (max-width: 400px) {
  .cat-tag {
    padding: 4px 8px;
    font-size: 11px;
  }
}

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

/* 页面加载骨架屏 */
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

/* ============================================
   Responsive Styles - iPad/Tablet
   iPad 横竖屏均保留侧边栏+菜单名称
   ============================================ */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .sidebar-header {
    padding: 16px 14px;
  }

  .logo-text {
    font-size: 14px;
  }

  .sidebar-nav {
    padding: 8px 8px;
    gap: 2px;
  }

  .nav-item {
    padding: 8px 10px;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 2px;
  }

  .nav-label {
    font-size: 13px;
  }

  .user-card {
    padding: 8px 10px;
  }

  .user-name {
    font-size: 12px;
  }

  .user-role {
    font-size: 10px;
  }

  .main-content {
    margin-left: 200px;
  }
}

/* iPad Mini / 竖屏小尺寸 */
@media (max-width: 860px) and (min-width: 769px) {
  .sidebar {
    width: 180px;
  }

  .sidebar-header {
    padding: 14px 12px;
  }

  .nav-item {
    padding: 7px 8px;
    gap: 6px;
    font-size: 12px;
  }

  .nav-label {
    font-size: 12px;
  }

  .main-content {
    margin-left: 180px;
  }
}

/* ============================================
   Responsive Styles - Mobile
   ============================================ */
@media (max-width: 768px) {
  /* 隐藏桌面侧边栏，显示移动端组件 */
  .sidebar {
    width: 260px;
    transform: translateX(-100%);
    z-index: 200;
  }

  .sidebar--open {
    transform: translateX(0);
  }

  /* 恢复移动端侧边栏菜单文字显示 */
  .logo-text,
  .nav-label,
  .user-info {
    display: block !important;
  }

  .nav-badge {
    display: block !important;
  }

  .nav-item {
    justify-content: flex-start;
    padding: 12px 16px;
  }

  .user-card {
    justify-content: flex-start;
    padding: 10px 12px;
  }

  .sidebar-header {
    padding: 20px 16px 12px;
  }

  .sidebar-overlay {
    display: block;
  }

  .mobile-header {
    display: flex;
  }

  .main-content {
    margin-left: 0;
    padding-top: 56px;
    padding-bottom: 72px;
    overflow-x: hidden;
    max-width: 100vw;
  }

  .mobile-bottom-nav {
    display: flex;
  }

  /* 隐藏桌面端 FAB，在移动端用底部导航 */
  .fab-button {
    display: none;
  }
}

/* ============================================
   Responsive Styles - Small Mobile
   ============================================ */
@media (max-width: 480px) {
  .mobile-header {
    padding: 0 12px;
  }

  .mobile-logo-text {
    font-size: 15px;
  }

  .mobile-nav-item {
    padding: 6px 16px;
    min-width: 56px;
    font-size: 10px;
  }

  .mobile-add-btn {
    width: 44px;
    height: 44px;
  }

  .mobile-add-wrapper {
    margin-top: -18px;
  }
}
</style>
