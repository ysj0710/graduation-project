<script setup>
import { computed } from 'vue'
import {
  Wallet, Gift, TrendingUp, Briefcase, Banknote,
  Utensils, Car, ShoppingBag, Gamepad2, Home,
  Pill, BookOpen, Package, Star, Plane,
  Heart, Baby, Trophy, Phone, Film,
  Coffee, Wrench, Dog, GraduationCap,
  CreditCard, ArrowDownLeft, ArrowUpRight, Receipt, HelpCircle,
  ShoppingCart, Pizza, Apple, Milk, Shirt,
  Scissors, Palette, Camera, Music, Tv,
  Wifi, Zap, Droplet, Flame, Carrot,
  Beer, Wine, Gamepad, Cpu, Book,
  Newspaper, Stethoscope, Glasses, Syringe,
  Building, Hotel, Building2,
  Train, Bus, Rocket, Navigation, MapPin,
  Cat, Bird, Fish, PawPrint, Leaf, Sun, Cloud,
  Trash2, Package2, Hammer, Drill,
  Cake, Music2, Tv2,
  Laptop, Smartphone, Watch, Speaker,
  Headphones, Mic, Printer, HardDrive,
  Calculator, Landmark, PiggyBank,
  TrendingDown, DollarSign, Coins, Percent,
  BarChart3, PieChart, Activity,
  Users, User, UserPlus, UserCheck,
  Calendar, Clock, Timer, AlarmClock, Bell,
  Shield, Target, Flag, Award, Medal,
  IceCream, Cookie, Umbrella, TreePine, Flower2,
  Truck, Ship, Bike, Crosshair,
  Footprints, Dumbbell
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  categoryType: { type: String, default: 'expense' }
})

const emit = defineEmits(['update:modelValue'])

// 所有图标库（确保每个都有对应组件）
const allIcons = {
  Wallet, Gift, TrendingUp, Briefcase, Banknote,
  Utensils, Car, ShoppingBag, Gamepad2, Home,
  Pill, BookOpen, Package, Star, Plane,
  Heart, Baby, Trophy, Phone, Film,
  Coffee, Wrench, Dog, GraduationCap,
  CreditCard, ArrowDownLeft, ArrowUpRight, Receipt, HelpCircle,
  ShoppingCart, Pizza, Apple, Milk, Shirt,
  Scissors, Palette, Camera, Music, Tv,
  Wifi, Zap, Droplet, Flame, Carrot,
  Beer, Wine, Gamepad, Cpu, Book,
  Newspaper, Stethoscope, Glasses, Syringe,
  Building, Hotel, Building2,
  Train, Bus, Rocket, Navigation, MapPin,
  Cat, Bird, Fish, PawPrint, Leaf, Sun, Cloud,
  Trash2, Package2, Hammer, Drill,
  Cake, Music2, Tv2,
  Laptop, Smartphone, Watch, Speaker,
  Headphones, Mic, Printer, HardDrive,
  Calculator, Landmark, PiggyBank,
  TrendingDown, DollarSign, Coins, Percent,
  BarChart3, PieChart, Activity,
  Users, User, UserPlus, UserCheck,
  Calendar, Clock, Timer, AlarmClock, Bell,
  Shield, Target, Flag, Award, Medal,
  IceCream, Cookie, Umbrella, TreePine, Flower2,
  Truck, Ship, Bike, Crosshair,
  Footprints, Dumbbell
}

// 推荐的图标按分类分组
const iconGroups = computed(() => {
  if (props.categoryType === 'income') {
    return [
      {
        label: '收入',
        icons: ['Wallet', 'Gift', 'TrendingUp', 'Briefcase', 'Banknote', 'DollarSign', 'Coins', 'PiggyBank', 'Landmark', 'Award', 'Medal', 'Package', 'ShoppingBag', 'CreditCard', 'Receipt', 'ArrowDownLeft']
      },
      {
        label: '转账',
        icons: ['ArrowDownLeft', 'ArrowUpRight', 'Landmark', 'Banknote', 'Coins', 'DollarSign', 'Receipt', 'Calculator']
      }
    ]
  }
  return [
    {
      label: '餐饮',
      icons: ['Utensils', 'Pizza', 'Coffee', 'Apple', 'Milk', 'Beer', 'Wine', 'Cookie', 'IceCream', 'Carrot', 'Cake', 'ShoppingCart']
    },
    {
      label: '购物',
      icons: ['ShoppingBag', 'ShoppingCart', 'Package', 'Shirt', 'Watch', 'Glasses', 'Palette', 'Camera', 'Laptop', 'Smartphone']
    },
    {
      label: '交通',
      icons: ['Car', 'Train', 'Bus', 'Bike', 'Plane', 'Rocket', 'Ship', 'Truck', 'Navigation', 'MapPin', 'Zap', 'Crosshair']
    },
    {
      label: '居住',
      icons: ['Home', 'Building', 'Hotel', 'Building2', 'Droplet', 'Flame', 'Wifi', 'Hammer', 'Wrench', 'Umbrella']
    },
    {
      label: '娱乐',
      icons: ['Gamepad', 'Gamepad2', 'Film', 'Music', 'Music2', 'Tv', 'Tv2', 'Book', 'Newspaper', 'Headphones', 'Speaker', 'Mic']
    },
    {
      label: '健康',
      icons: ['Pill', 'Stethoscope', 'Syringe', 'Glasses', 'Building', 'Heart', 'Activity', 'Droplet']
    },
    {
      label: '教育',
      icons: ['BookOpen', 'GraduationCap', 'Cpu', 'Book', 'Calculator', 'Target']
    },
    {
      label: '运动户外',
      icons: ['Trophy', 'Bike', 'Dumbbell', 'Footprints', 'PawPrint', 'TreePine', 'Leaf', 'Sun', 'Plane']
    },
    {
      label: '家庭',
      icons: ['Baby', 'Dog', 'Cat', 'Bird', 'Fish', 'Package2', 'Gift', 'Cake', 'Heart', 'Users', 'UserPlus']
    },
    {
      label: '通讯',
      icons: ['Phone', 'Smartphone', 'Bell', 'Wifi', 'Printer']
    },
    {
      label: '其他',
      icons: ['Star', 'Heart', 'Gift', 'Scissors', 'TreePine', 'Flower2', 'Shield', 'Flag', 'Award', 'Coins', 'DollarSign', 'HelpCircle', 'Trash2', 'HardDrive']
    }
  ]
})

const selectedIcon = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function selectIcon(iconName) {
  selectedIcon.value = iconName
}
</script>

<template>
  <div class="icon-picker">
    <div class="icon-group" v-for="group in iconGroups" :key="group.label">
      <div class="group-label">{{ group.label }}</div>
      <div class="icon-grid">
        <button
          v-for="iconName in group.icons"
          :key="iconName"
          class="icon-btn"
          :class="{ active: selectedIcon === iconName }"
          @click="selectIcon(iconName)"
          :title="iconName"
          type="button"
        >
          <component :is="allIcons[iconName]" :size="20" :stroke-width="1.8" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.icon-picker::-webkit-scrollbar {
  width: 4px;
}
.icon-picker::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: 2px;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
}

.icon-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: scale(1.05);
}

.icon-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

@media (max-width: 480px) {
  .icon-grid { grid-template-columns: repeat(6, 1fr); }
  .icon-btn { width: 36px; height: 36px; }
}
</style>
