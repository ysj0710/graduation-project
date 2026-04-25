<script setup>
import { computed } from 'vue'
import {
  Wallet, Gift, TrendingUp, Briefcase, Banknote,
  Utensils, Car, ShoppingBag, Gamepad2, Home,
  Pill, BookOpen, Package, Star, Plane,
  Heart, Baby, Trophy, Phone, Film,
  Coffee, Wrench, Dog, GraduationCap,
  CreditCard, ArrowDownLeft, ArrowUpRight, Receipt, HelpCircle,
  Shield,
  ShoppingCart, Pizza, Apple, Milk, Shirt,
  Scissors, Palette, Camera, Music, Tv,
  Wifi, Zap, Droplet, Flame, Carrot,
  Beer, Wine, Cigarette, Gamepad, Cpu,
  Book, Newspaper, Stethoscope, Glasses, Syringe,
  Building, Hotel, Building2,
  Train, Bus, Rocket, Navigation, MapPin,
  Cat, Bird, Fish, PawPrint, Leaf,
  Sun, Moon, Cloud, Umbrella, CloudRain,
  Trash2, Package2, Hammer, Drill,
  Cake, Music2, Tv2,
  Laptop, Smartphone, Watch, Speaker,
  Headphones, Mic, Printer, HardDrive,
  Calculator, Landmark, PiggyBank,
  TrendingDown, DollarSign, Coins, Percent,
  BarChart3, PieChart, Activity,
  Users, User, UserPlus, UserCheck,
  Calendar, Clock, Timer, AlarmClock, Bell
} from 'lucide-vue-next'

const props = defineProps({
  name: { type: String, default: '' },
  id: { type: String, default: '' },
  type: { type: String, default: 'expense' },
  size: { type: Number, default: 18 }
})

const iconMap = {
  // === 收入类 ===
  salary: Wallet,
  bonus: Gift,
  investment: TrendingUp,
  parttime: Briefcase,
  other_income: Banknote,
  wage: Wallet,
  red_packet: Gift,
  refund: CreditCard,
  subsidy: Gift,
  dividend: TrendingUp,
  '工资': Wallet,
  '奖金': Gift,
  '投资': TrendingUp,
  '兼职': Briefcase,
  '理财': TrendingUp,
  '分红': TrendingUp,
  '补贴': Gift,
  '退款': CreditCard,
  '红包': Gift,
  '其他收入': Banknote,

  // === 支出类：餐饮 ===
  food: Utensils,
  dining: Utensils,
  snacks: Pizza,
  drinks: Coffee,
  coffee: Coffee,
  fruit: Apple,
  groceries: ShoppingCart,
  dairy: Milk,
  '餐饮': Utensils,
  '餐饮零食': Pizza,
  '饮品': Coffee,
  '水果': Apple,
  '日用百货': ShoppingCart,
  '乳制品': Milk,

  // === 支出类：交通 ===
  transport: Car,
  transport2: Car,
  commute: Car,
  taxi: Navigation,
  parking: Car,
  fuel: Zap,
  gas: Flame,
  '交通': Car,
  '打车': Navigation,
  '停车': Car,
  '加油': Zap,

  // === 支出类：购物 ===
  shopping: ShoppingBag,
  shopping2: ShoppingBag,
  clothes: Shirt,
  bag: ShoppingBag,
  shoes: Shirt,
  skincare: Palette,
  makeup: Palette,
  '购物': ShoppingBag,
  '服装': Shirt,
  '日用品': ShoppingCart,
  '美妆': Palette,

  // === 支出类：娱乐 ===
  entertainment: Gamepad2,
  gaming: Gamepad,
  movies: Film,
  music: Music,
  karaoke: Music2,
  bar: Beer,
  hotel: Hotel,
  travel: Plane,
  flight: Rocket,
  '娱乐': Gamepad2,
  '游戏': Gamepad,
  '电影': Film,
  '音乐': Music,
  '旅行': Plane,

  // === 支出类：住房 ===
  housing: Home,
  rent: Building,
  utilities: Zap,
  water: Droplet,
  electricity: Zap,
  gas_bill: Flame,
  broadband: Wifi,
  property: Building2,
  '住房': Home,
  '房租': Building,
  '水电费': Droplet,
  '燃气': Flame,
  '宽带': Wifi,
  '物业': Building2,

  // === 支出类：医疗健康 ===
  medical: Pill,
  health: Stethoscope,
  hospital: Building,
  pharmacy: Pill,
  glasses: Glasses,
  dental: Syringe,
  '医疗': Pill,
  '健康': Stethoscope,
  '医院': Building,
  '药品': Pill,

  // === 支出类：教育 ===
  education: BookOpen,
  training: GraduationCap,
  books: Book,
  course: GraduationCap,
  '教育': BookOpen,
  '培训': GraduationCap,
  '书籍': Book,

  // === 支出类：通讯 ===
  communication: Phone,
  phone_bill: Smartphone,
  '通讯': Phone,

  // === 支出类：家庭 ===
  baby: Baby,
  kids: Baby,
  pets: Dog,
  pet: Dog,
  '育儿': Baby,
  '宠物': Dog,

  // === 支出类：运动 ===
  sports: Trophy,
  fitness: Trophy,
  '运动': Trophy,

  // === 支出类：其他 ===
  other: HelpCircle,
  other_expense: HelpCircle,
  social: Heart,
  gift: Gift,
  hair: Scissors,
  lottery: Star,
  tips: Coins,
  '其他': HelpCircle,
  '社交': Heart,
  '礼物': Gift,
  '理发': Scissors,
  '彩票': Star,
  '小费': Coins,

  // === 特殊 ===
  '充值': CreditCard,
  '退款': CreditCard,
  '转账': Landmark,
  '收入': ArrowDownLeft,
  '支出': ArrowUpRight,
  '日用百货': Package,
  '生活缴费': Home,
  '保险': Shield,
  '运动户外': Trophy,
  '通讯': Phone,
  '投资理财': TrendingUp,
  '红包': Gift,
}

const icon = computed(() => iconMap[props.id] || iconMap[props.name] || HelpCircle)
</script>

<template>
  <component :is="icon" :size="size" :stroke-width="1.8" />
</template>
