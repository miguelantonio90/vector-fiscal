<template>
  <div class="space-y-8">
    <!-- Progress Overview -->
    <div class="card bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 class="text-2xl font-display font-bold text-white mb-2">Resumen Fiscal 2025</h2>
          <p class="text-slate-400">Progreso de tus obligaciones tributarias</p>
        </div>
        
        <!-- Progress Ring -->
        <div class="flex items-center gap-8">
          <div class="relative w-32 h-32">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" stroke-width="8"/>
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="url(#progressGradient)" 
                stroke-width="8"
                :stroke-dasharray="`${progressPercent * 2.51} 251`"
                stroke-linecap="round"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#10b981"/>
                  <stop offset="100%" stop-color="#059669"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-display font-bold text-white">{{ progressPercent.toFixed(0) }}%</span>
              <span class="text-xs text-slate-400">completado</span>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span class="text-slate-300">{{ summary.paid }} pagados</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <span class="text-slate-300">{{ summary.pending }} pendientes</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span class="text-slate-300">{{ summary.overdue }} vencidos</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Obligaciones -->
      <div class="card border-l-4 border-l-onat-red">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-slate-400 text-sm">Total Obligaciones 2025</p>
            <p class="text-2xl font-display font-bold text-white mt-1">
              {{ formatCurrency(summary.totalAmount) }}
            </p>
            <p class="text-xs text-slate-500 mt-1">{{ summary.total }} obligaciones</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-onat-red/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-onat-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Ya Pagado -->
      <div class="card border-l-4 border-l-emerald-500">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-slate-400 text-sm">Ya Pagado</p>
            <p class="text-2xl font-display font-bold text-emerald-400 mt-1">
              {{ formatCurrency(summary.paidAmount) }}
            </p>
            <p class="text-xs text-emerald-500/70 mt-1">{{ paidPercent.toFixed(1) }}% del total</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Pendiente -->
      <div class="card border-l-4 border-l-amber-500">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-slate-400 text-sm">Pendiente por Pagar</p>
            <p class="text-2xl font-display font-bold text-amber-400 mt-1">
              {{ formatCurrency(pendingAmount) }}
            </p>
            <p class="text-xs text-amber-500/70 mt-1">{{ summary.pending }} obligaciones</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Ahorro Bonificaciones -->
      <div class="card border-l-4 border-l-blue-500">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-slate-400 text-sm">Ahorro Bonificaciones</p>
            <p class="text-2xl font-display font-bold text-blue-400 mt-1">
              {{ formatCurrency(paymentsSummary.totalBonus) }}
            </p>
            <p class="text-xs text-blue-500/70 mt-1">{{ paymentsSummary.totalPayments }} pagos realizados</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Pending Obligations -->
      <div class="lg:col-span-2 card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-display font-bold text-white">Obligaciones Pendientes</h3>
            <p class="text-sm text-slate-400">Próximos pagos a realizar</p>
          </div>
          <router-link to="/calendario" class="text-onat-red hover:text-onat-accent text-sm font-medium flex items-center gap-1">
            Ver calendario
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-2 border-onat-red border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else-if="pendingObligations.length === 0" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-emerald-400 font-medium">¡Todas las obligaciones al día!</p>
          <p class="text-slate-500 text-sm mt-1">No tienes pagos pendientes</p>
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="obligation in pendingObligations" 
            :key="obligation._id"
            class="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-slate-800/50"
            :class="getDaysUntilDue(obligation) <= 7 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-800/30'"
          >
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="obligation.tributeCode === '0820132' ? 'bg-blue-500/20' : 'bg-onat-red/20'"
            >
              <span class="text-lg font-bold" :class="obligation.tributeCode === '0820132' ? 'text-blue-400' : 'text-onat-red'">
                {{ obligation.tributeCode === '0820132' ? 'T' : 'M' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-medium">{{ obligation.description }}</p>
              <p class="text-sm text-slate-400">{{ obligation.period }}</p>
            </div>
            <div class="text-right">
              <p class="text-white font-mono font-semibold text-lg">
                {{ formatCurrency(getObligationAmount(obligation)) }}
              </p>
              <p v-if="!obligation.amount && obligation.tributeCode === '0114022'" class="text-xs text-amber-400">
                ~estimado
              </p>
              <p class="text-xs font-medium" :class="getDaysColor(obligation)">
                {{ getDaysText(obligation) }}
              </p>
            </div>
            <router-link 
              :to="`/pagos?obligationId=${obligation._id}`"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Pagar
            </router-link>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card">
          <h3 class="text-lg font-display font-bold text-white mb-4">Acciones Rápidas</h3>
          <div class="space-y-3">
            <router-link to="/pagos" class="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Registrar Pago
            </router-link>
            <router-link to="/calculadora" class="w-full btn btn-secondary flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculadora
            </router-link>
            <router-link to="/reportes" class="w-full btn btn-secondary flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ver Reportes
            </router-link>
          </div>
        </div>

        <!-- AI Insights Panel -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span class="text-xl">🔮</span>
              </div>
              <h3 class="text-lg font-display font-bold text-white">Insights IA</h3>
            </div>
            <router-link to="/flujo-caja" class="text-xs text-purple-400 hover:text-purple-300">
              Ver análisis →
            </router-link>
          </div>
          <InsightsPanel 
            :insights="insights" 
            :loading="insightsLoading"
            @action="handleInsightAction"
          />
        </div>

        <!-- Bonuses Info -->
        <div class="card bg-gradient-to-br from-emerald-900/30 to-slate-800/50 border-emerald-700/30">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h3 class="text-lg font-display font-bold text-white">Bonificaciones</h3>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center p-2 bg-slate-800/30 rounded-lg">
              <span class="text-slate-300">Pago anticipado</span>
              <span class="text-emerald-400 font-semibold">5%</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-slate-800/30 rounded-lg">
              <span class="text-slate-300">Transfermóvil</span>
              <span class="text-blue-400 font-semibold">3%</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <span class="text-slate-300">Combinado</span>
              <span class="text-purple-400 font-semibold">8%</span>
            </div>
          </div>
        </div>

        <!-- Next Payment Alert -->
        <div v-if="nextObligation" class="card bg-gradient-to-br from-amber-900/30 to-slate-800/50 border-amber-700/30">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-amber-400 font-medium text-sm">Próximo vencimiento</span>
          </div>
          <p class="text-white font-medium">{{ nextObligation.description }}</p>
          <p class="text-slate-400 text-sm">{{ nextObligation.period }}</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-amber-700/30">
            <div>
              <span class="text-2xl font-display font-bold text-white">{{ formatCurrency(getObligationAmount(nextObligation)) }}</span>
              <span v-if="!nextObligation.amount && nextObligation.tributeCode === '0114022'" class="text-xs text-amber-400 ml-2">~est.</span>
            </div>
            <span class="text-amber-400 font-medium">{{ getDaysText(nextObligation) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div 
      v-if="toast.show"
      class="fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg animate-slide-in z-50"
      :class="toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'"
    >
      <p class="text-white font-medium">{{ toast.message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { obligationsApi, paymentsApi, predictionsApi } from '../services/api'
import InsightsPanel from '../components/InsightsPanel.vue'

const loading = ref(true)
const importing = ref(false)
const allObligations = ref([])
const summary = ref({ pending: 0, paid: 0, overdue: 0, total: 0, totalAmount: 0, paidAmount: 0 })
const paymentsSummary = ref({ totalPaid: 0, totalBonus: 0, totalPayments: 0 })
const toast = ref({ show: false, message: '', type: 'success' })
const insights = ref([])
const insightsLoading = ref(true)

const pendingObligations = computed(() => {
  return allObligations.value
    .filter(o => {
      // Solo mostrar obligaciones pendientes
      if (o.status !== 'pendiente') return false
      // Excluir obligaciones condicionales (0510122) con monto 0
      // ya que solo aplican si los ingresos superan el mínimo exento
      if (o.tributeCode === '0510122' && (!o.amount || o.amount === 0)) return false
      return true
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

const nextObligation = computed(() => {
  return pendingObligations.value[0] || null
})

const progressPercent = computed(() => {
  if (!summary.value.total) return 0
  return (summary.value.paid / summary.value.total) * 100
})

const paidPercent = computed(() => {
  if (!summary.value.totalAmount) return 0
  return (summary.value.paidAmount / summary.value.totalAmount) * 100
})

const pendingAmount = computed(() => {
  return summary.value.pendingAmount || ((summary.value.totalAmount || 0) - (summary.value.paidAmount || 0))
})

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

function getDaysUntilDue(obligation) {
  const today = new Date()
  const dueDate = new Date(obligation.dueDate)
  const diffTime = dueDate - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDaysText(obligation) {
  const days = getDaysUntilDue(obligation)
  if (days < 0) return `Vencido hace ${Math.abs(days)} días`
  if (days === 0) return '¡Vence hoy!'
  if (days === 1) return 'Vence mañana'
  return `Vence en ${days} días`
}

function getDaysColor(obligation) {
  const days = getDaysUntilDue(obligation)
  if (days < 0) return 'text-red-400'
  if (days <= 3) return 'text-red-400'
  if (days <= 7) return 'text-amber-400'
  return 'text-slate-400'
}

function getObligationAmount(obligation) {
  // Si tiene monto definido, usarlo
  if (obligation.amount && obligation.amount > 0) {
    return obligation.amount
  }
  // Para obligaciones mensuales sin monto, usar el promedio de pagos mensuales
  if (obligation.tributeCode === '0114022' && summary.value.avgMonthlyPayment) {
    return summary.value.avgMonthlyPayment
  }
  return 0
}

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

async function loadData() {
  loading.value = true
  try {
    const [obligationsRes, summaryRes, paymentsSummaryRes] = await Promise.all([
      obligationsApi.getAll(),
      obligationsApi.getSummary(2025),
      paymentsApi.getSummary(2025)
    ])
    allObligations.value = obligationsRes.data
    summary.value = summaryRes.data
    paymentsSummary.value = paymentsSummaryRes.data
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

async function loadInsights() {
  insightsLoading.value = true
  try {
    const response = await predictionsApi.getInsights()
    insights.value = response.data.insights || []
  } catch (error) {
    console.error('Error loading insights:', error)
    insights.value = []
  } finally {
    insightsLoading.value = false
  }
}

function handleInsightAction(insight) {
  if (insight.id === 'next-payment') {
    // Redirigir a pagos
    window.location.href = '/pagos'
  } else if (insight.id === 'heavy-month-alert') {
    // Redirigir a flujo de caja
    window.location.href = '/flujo-caja'
  }
}

async function importObligations() {
  importing.value = true
  try {
    const res = await obligationsApi.importVectorFiscal()
    showToast(`Vector Fiscal importado: ${res.data.total} obligaciones`, 'success')
    await loadData()
  } catch (error) {
    showToast('Error al importar: ' + error.message, 'error')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadData()
  loadInsights()
})
</script>
