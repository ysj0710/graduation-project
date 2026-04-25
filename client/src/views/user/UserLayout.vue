<template>
  <div class="user-layout" :style="pageBgStyle">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <Wallet :size="24" :stroke-width="1.8" />
          <span>{{ systemName }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <component
            :is="getNavIcon(item.icon)"
            :size="18"
            :stroke-width="1.8"
          />
          <span>{{ item.label }}</span>
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
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 悬浮记账按钮 -->
    <button class="fab-button" @click="showAddSheet = true">
      <Plus :size="24" :stroke-width="2" />
    </button>

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
            <Receipt :size="20" :stroke-width="1.8" />
            <span>记一笔</span>
          </div>
          <button class="close-btn" @click="showAddSheet = false">
            <X :size="20" :stroke-width="2" />
          </button>
        </div>
        <div class="sheet-body">
          <div class="type-tabs">
            <button
              class="type-tab"
              :class="{ active: record.type === 'expense' }"
              @click="record.type = 'expense'"
            >
              支出
            </button>
            <button
              class="type-tab"
              :class="{ active: record.type === 'income' }"
              @click="record.type = 'income'"
            >
              收入
            </button>
          </div>
          <div class="bill-list">
            <div
              v-for="(item, index) in billItems"
              :key="index"
              class="bill-item"
            >
              <div class="bill-item-left">
                <div class="bill-item-category">{{ item.category }}</div>
                <div v-if="item.note" class="bill-item-note">
                  {{ item.note }}
                </div>
              </div>
              <div class="bill-item-right">
                <div class="bill-item-amount" :class="record.type">
                  ¥{{ formatNumber(item.amount) }}
                </div>
                <button class="bill-item-delete" @click="removeItem(index)">
                  <Trash2 :size="16" :stroke-width="2" />
                </button>
              </div>
            </div>
            <div v-if="billItems.length === 0" class="bill-empty">
              <Receipt :size="48" :stroke-width="1" />
              <p>还没有添加项目</p>
            </div>
          </div>
          <div class="bill-total" v-if="billItems.length > 0">
            <span>合计</span>
            <div class="total-amount" :class="record.type">
              ¥{{ formatNumber(billTotal) }}
            </div>
          </div>
          <div class="add-item-section">
            <div class="add-item-header">选择分类</div>
            <div class="category-grid">
              <div
                v-for="cat in currentCategories"
                :key="cat.id"
                class="category-item"
                :class="{ selected: newItem.category === cat.name }"
                @click="newItem.category = cat.name"
              >
                <CategoryIcon :id="cat.id" :name="cat.name" :size="20" />
                <span>{{ cat.name }}</span>
              </div>
            </div>
            <div class="amount-input">
              <div class="input-label">金额</div>
              <input
                v-model.number="newItem.amount"
                type="number"
                placeholder="0.00"
                class="amount-field"
                @keyup.enter="addItem"
              />
            </div>
            <div class="note-input">
              <div class="input-label">备注</div>
              <input
                v-model="newItem.note"
                type="text"
                placeholder="选填"
                class="note-field"
              />
            </div>
            <div class="date-input">
              <div class="input-label">日期</div>
              <input v-model="record.date" type="date" class="date-field" />
            </div>
          </div>
          <button
            class="add-btn"
            @click="addItem"
            :disabled="!newItem.category || !newItem.amount"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
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
  Trash2,
  X,
  Bell as BellIcon,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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

const record = ref({
  type: "expense",
  date: new Date().toISOString().split("T")[0],
});
const newItem = ref({ category: "", amount: null, note: "" });
const billItems = ref([]);

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

const iconMap = { Home, ListOrdered, BarChart3, TrendingUp, Palette, Bell };
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

const expenseCategories = [
  { id: "food", name: "餐饮" },
  { id: "transport", name: "交通" },
  { id: "shopping", name: "购物" },
  { id: "entertainment", name: "娱乐" },
  { id: "medical", name: "医疗" },
  { id: "education", name: "教育" },
  { id: "housing", name: "住房" },
  { id: "communication", name: "通讯" },
  { id: "utilities", name: "生活缴费" },
  { id: "insurance", name: "保险" },
  { id: "recharge", name: "充值" },
  { id: "daily", name: "日用百货" },
  { id: "sports", name: "运动户外" },
  { id: "other-expense", name: "其他支出" },
];
const incomeCategories = [
  { id: "salary", name: "工资" },
  { id: "bonus", name: "奖金" },
  { id: "investment", name: "理财" },
  { id: "parttime", name: "兼职" },
  { id: "other-income", name: "其他收入" },
];
const currentCategories = computed(() =>
  record.value.type === "expense" ? expenseCategories : incomeCategories,
);

const billTotal = computed(() =>
  billItems.value.reduce((sum, i) => sum + Number(i.amount || 0), 0),
);

const formatNumber = (n) =>
  Number(n || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const addItem = () => {
  if (!newItem.value.category || !newItem.value.amount) return;
  billItems.value.push({ ...newItem.value });
  newItem.value = { category: "", amount: null, note: "" };
};

const removeItem = (idx) => billItems.value.splice(idx, 1);

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
});
</script>

<style scoped>
.user-layout {
  display: flex;
  min-height: 100vh;
}

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
}
.user-avatar-image {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  object-fit: cover;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
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
}

.main-content {
  flex: 1;
  margin-left: 220px;
  min-height: 100vh;
}

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
  align-items: flex-end;
  z-index: 500;
}
.sheet-container {
  background: var(--color-surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom, 16px);
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}
.sheet-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
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
.sheet-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.type-tab {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
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

.bill-list {
  margin-bottom: 16px;
}
.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}
.bill-item-left {
  flex: 1;
}
.bill-item-category {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.bill-item-note {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.bill-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bill-item-amount {
  font-size: 15px;
  font-weight: 700;
}
.bill-item-amount.expense {
  color: var(--color-expense);
}
.bill-item-amount.income {
  color: var(--color-income);
}
.bill-item-delete {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  padding: 4px;
}
.bill-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.bill-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 2px solid var(--color-border);
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.total-amount {
  font-size: 18px;
}
.total-amount.expense {
  color: var(--color-expense);
}
.total-amount.income {
  color: var(--color-income);
}

.add-item-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.add-item-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 11px;
  color: var(--color-text-secondary);
}
.category-item:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.category-item.selected {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

.amount-input,
.note-input,
.date-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.input-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}
.amount-field {
  font-size: 18px;
  font-weight: 700;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-primary);
  width: 100%;
  outline: none;
}
.note-field,
.date-field {
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-primary);
  width: 100%;
  outline: none;
}
.amount-field:focus,
.note-field:focus,
.date-field:focus {
  border-color: var(--color-primary);
}

.add-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-top: 8px;
}
.add-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.15s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  .sidebar-header {
    padding: 16px 12px;
  }
  .logo span {
    display: none;
  }
  .nav-item span {
    display: none;
  }
  .sidebar-footer .user-info {
    display: none;
  }
  .main-content {
    margin-left: 60px;
  }
}
</style>
