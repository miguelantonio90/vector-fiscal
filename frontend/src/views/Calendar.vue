<template>
  <div class="space-y-8">
    <!-- Calendar Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="previousMonth" class="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="text-2xl font-display font-bold text-white">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </h2>
        <button @click="nextMonth" class="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          @click="goToToday" 
          class="btn btn-secondary text-sm"
        >
          Hoy
        </button>
        <select 
          v-model="currentYear" 
          class="input w-24 text-sm py-2"
        >
          <option :value="2025">2025</option>
          <option :value="2026">2026</option>
        </select>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-6 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-amber-500"></div>
        <span class="text-slate-400">Pendiente</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
        <span class="text-slate-400">Pagado</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-red-500"></div>
        <span class="text-slate-400">Vencido</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
        <span class="text-slate-400">Trimestral</span>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="card p-0 overflow-hidden">
      <!-- Days of week header -->
      <div class="grid grid-cols-7 bg-slate-900/50">
        <div 
          v-for="day in dayNames" 
          :key="day" 
          class="py-3 text-center text-sm font-semibold text-slate-400 border-b border-slate-700/50"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar days -->
      <div class="grid grid-cols-7">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="min-h-[120px] p-2 border-b border-r border-slate-700/30 transition-colors"
          :class="{
            'bg-slate-900/30': !day.isCurrentMonth,
            'bg-slate-800/20': day.isCurrentMonth,
            'bg-onat-red/10 border-onat-red/30': day.isToday
          }"
        >
          <div class="flex items-start justify-between mb-2">
            <span 
              class="text-sm font-medium"
              :class="{
                'text-slate-600': !day.isCurrentMonth,
                'text-slate-300': day.isCurrentMonth && !day.isToday,
                'text-onat-red font-bold': day.isToday
              }"
            >
              {{ day.date }}
            </span>
            <span 
              v-if="day.obligations.length > 0"
              class="text-xs px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300"
            >
              {{ day.obligations.length }}
            </span>
          </div>

          <!-- Obligations for this day -->
          <div class="space-y-1">
            <div
              v-for="obligation in day.obligations.slice(0, 3)"
              :key="obligation._id"
              @click="selectObligation(obligation)"
              class="text-xs p-1.5 rounded cursor-pointer transition-all hover:scale-[1.02]"
              :class="getObligationClass(obligation)"
            >
              <p class="truncate font-medium">{{ getShortDescription(obligation) }}</p>
              <p class="text-[10px] opacity-75">{{ formatCurrency(obligation.amount) }}</p>
            </div>
            <div 
              v-if="day.obligations.length > 3"
              class="text-xs text-slate-400 text-center py-1"
            >
              +{{ day.obligations.length - 3 }} más
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Obligation Detail -->
    <div 
      v-if="selectedObligation" 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="selectedObligation = null"
    >
      <div class="card w-full max-w-md animate-fade-in">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h3 class="text-xl font-display font-bold text-white">{{ selectedObligation.description }}</h3>
            <p class="text-sm text-slate-400">{{ selectedObligation.period }}</p>
          </div>
          <button @click="selectedObligation = null" class="text-slate-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div class="flex justify-between items-center py-3 border-b border-slate-700/50">
            <span class="text-slate-400">Código de barras</span>
            <span class="font-mono text-white">{{ selectedObligation.barcode }}</span>
          </div>
          <div class="flex justify-between items-center py-3 border-b border-slate-700/50">
            <span class="text-slate-400">Código tributo</span>
            <span class="font-mono text-white">{{ selectedObligation.tributeCode }}</span>
          </div>
          <div class="flex justify-between items-center py-3 border-b border-slate-700/50">
            <span class="text-slate-400">Fecha límite</span>
            <span class="text-white">{{ formatDate(selectedObligation.dueDate) }}</span>
          </div>
          <div class="flex justify-between items-center py-3 border-b border-slate-700/50">
            <span class="text-slate-400">Monto</span>
            <span class="text-2xl font-display font-bold text-white">{{ formatCurrency(selectedObligation.amount) }}</span>
          </div>
          <div class="flex justify-between items-center py-3">
            <span class="text-slate-400">Estado</span>
            <span :class="getStatusBadge(selectedObligation)" class="badge">{{ selectedObligation.status }}</span>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <router-link 
            v-if="selectedObligation.status !== 'pagado'"
            :to="`/payments?obligationId=${selectedObligation._id}`"
            class="flex-1 btn btn-success text-center"
          >
            Registrar Pago
          </router-link>
          <button @click="selectedObligation = null" class="flex-1 btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Upcoming List -->
    <div class="card">
      <h3 class="text-lg font-display font-bold text-white mb-4">
        Obligaciones de {{ monthNames[currentMonth] }}
      </h3>
      
      <div v-if="monthObligations.length === 0" class="text-center py-8">
        <p class="text-slate-400">No hay obligaciones este mes</p>
      </div>

      <div v-else class="divide-y divide-slate-700/50">
        <div 
          v-for="obligation in monthObligations" 
          :key="obligation._id"
          @click="selectObligation(obligation)"
          class="flex items-center gap-4 py-4 cursor-pointer hover:bg-slate-800/30 -mx-6 px-6 transition-colors"
        >
          <div 
            class="w-2 h-2 rounded-full"
            :class="getStatusDot(obligation)"
          ></div>
          <div class="flex-1">
            <p class="text-white font-medium">{{ obligation.description }}</p>
            <p class="text-sm text-slate-400">{{ obligation.period }}</p>
          </div>
          <div class="text-right">
            <p class="font-mono text-white">{{ formatCurrency(obligation.amount) }}</p>
            <p class="text-xs text-slate-400">{{ formatDate(obligation.dueDate) }}</p>
          </div>
          <span :class="getStatusBadge(obligation)" class="badge">{{ obligation.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { obligationsApi } from '../services/api'

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(2025)
const obligations = ref([])
const selectedObligation = ref(null)
const loading = ref(true)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startDay = firstDay.getDay()
  const totalDays = lastDay.getDate()

  // Previous month days
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      obligations: []
    })
  }

  // Current month days
  const today = new Date()
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dayObligations = obligations.value.filter(o => {
      const oDate = new Date(o.dueDate)
      return oDate.getDate() === i && 
             oDate.getMonth() === currentMonth.value && 
             oDate.getFullYear() === currentYear.value
    })

    days.push({
      date: i,
      isCurrentMonth: true,
      isToday: today.getDate() === i && 
               today.getMonth() === currentMonth.value && 
               today.getFullYear() === currentYear.value,
      obligations: dayObligations
    })
  }

  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      obligations: []
    })
  }

  return days
})

const monthObligations = computed(() => {
  return obligations.value.filter(o => {
    const date = new Date(o.dueDate)
    return date.getMonth() === currentMonth.value && date.getFullYear() === currentYear.value
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToToday() {
  const today = new Date()
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
}

function selectObligation(obligation) {
  selectedObligation.value = obligation
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getShortDescription(obligation) {
  if (obligation.tributeCode === '0820132') return 'Trimestral'
  if (obligation.tributeCode === '0114022') return 'Ventas'
  if (obligation.tributeCode === '0510122') return 'Ingresos'
  if (obligation.tributeCode === '0530222') return 'Anual'
  return obligation.description.split(' ').slice(0, 2).join(' ')
}

function getObligationClass(obligation) {
  if (obligation.status === 'pagado') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
  if (obligation.status === 'vencido') return 'bg-red-500/20 text-red-300 border border-red-500/30'
  if (obligation.tributeCode === '0820132') return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
  return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
}

function getStatusDot(obligation) {
  if (obligation.status === 'pagado') return 'bg-emerald-500'
  if (obligation.status === 'vencido') return 'bg-red-500'
  return 'bg-amber-500'
}

function getStatusBadge(obligation) {
  if (obligation.status === 'pagado') return 'badge-paid'
  if (obligation.status === 'vencido') return 'badge-overdue'
  return 'badge-pending'
}

async function loadObligations() {
  loading.value = true
  try {
    const res = await obligationsApi.getAll({ year: currentYear.value })
    obligations.value = res.data
  } catch (error) {
    console.error('Error loading obligations:', error)
  } finally {
    loading.value = false
  }
}

watch(currentYear, () => {
  loadObligations()
})

onMounted(() => {
  loadObligations()
})
</script>

