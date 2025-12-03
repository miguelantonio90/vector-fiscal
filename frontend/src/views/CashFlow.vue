<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-display font-bold text-white">Análisis de Flujo de Caja</h1>
        <p class="text-slate-400 mt-1">Visualiza tus ingresos, impuestos y pagos mes a mes</p>
      </div>
      <div class="flex items-center gap-3">
        <select 
          v-model="selectedYear"
          @change="loadData"
          class="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
        >
          <option :value="2024">2024</option>
          <option :value="2025">2025</option>
          <option :value="2026">2026</option>
        </select>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <span class="text-xl">💰</span>
          </div>
          <div>
            <p class="text-xs text-slate-400">Ingresos Totales</p>
            <p class="text-lg font-bold text-white font-mono">{{ formatCurrency(cashFlow?.summary?.totalIncome || 0) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <span class="text-xl">📊</span>
          </div>
          <div>
            <p class="text-xs text-slate-400">Impuestos Estimados</p>
            <p class="text-lg font-bold text-white font-mono">{{ formatCurrency(cashFlow?.summary?.totalTaxes || 0) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <span class="text-xl">✅</span>
          </div>
          <div>
            <p class="text-xs text-slate-400">Ya Pagado</p>
            <p class="text-lg font-bold text-emerald-400 font-mono">{{ formatCurrency(cashFlow?.summary?.totalPaid || 0) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <span class="text-xl">🎁</span>
          </div>
          <div>
            <p class="text-xs text-slate-400">Ahorro Bonificaciones</p>
            <p class="text-lg font-bold text-purple-400 font-mono">{{ formatCurrency(cashFlow?.summary?.totalSaved || 0) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights -->
    <div v-if="cashFlow?.insights?.length > 0" class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span class="text-xl">💡</span> Insights del Análisis
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div 
          v-for="(insight, index) in cashFlow.insights" 
          :key="index"
          class="flex items-start gap-3 p-3 rounded-lg"
          :class="{
            'bg-red-500/10 border border-red-500/20': insight.priority === 'high',
            'bg-amber-500/10 border border-amber-500/20': insight.priority === 'medium',
            'bg-slate-700/30': insight.priority === 'low'
          }"
        >
          <span class="text-xl flex-shrink-0">{{ insight.icon }}</span>
          <p class="text-sm text-slate-200">{{ insight.message }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Monthly Chart/Table -->
    <div v-else class="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div class="p-5 border-b border-slate-700/50">
        <h3 class="text-lg font-semibold text-white">Desglose Mensual</h3>
        <p class="text-sm text-slate-400">Haz clic en un mes para ver detalles</p>
      </div>

      <!-- Visual Chart -->
      <div class="p-5 border-b border-slate-700/50">
        <!-- Y-axis labels and chart container -->
        <div class="flex gap-2">
          <!-- Y-axis -->
          <div class="flex flex-col justify-between text-[10px] text-slate-500 font-mono w-12 text-right pr-2 h-40">
            <span>{{ formatCurrency(maxIncome) }}</span>
            <span>{{ formatCurrency(maxIncome * 0.5) }}</span>
            <span>$0</span>
          </div>
          
          <!-- Chart bars -->
          <div class="flex-1 flex items-end justify-between gap-1 h-40 border-l border-b border-slate-700/50 pl-2 pb-2">
            <div 
              v-for="month in cashFlow?.months || []" 
              :key="month.month"
              class="flex-1 flex flex-col items-center group cursor-pointer relative"
              @click="selectedMonth = month"
            >
              <!-- Tooltip on hover -->
              <div class="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 z-10 whitespace-nowrap shadow-lg pointer-events-none">
                <div class="text-xs text-emerald-400 font-mono">{{ formatCurrency(month.income.amount) }}</div>
                <div class="text-xs text-red-400 font-mono">{{ formatCurrency(month.estimatedTaxes?.total || 0) }}</div>
              </div>
              
              <!-- Bars container - side by side -->
              <div class="w-full flex justify-center gap-px flex-1 items-end">
                <!-- Income bar -->
                <div 
                  class="w-3 sm:w-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all group-hover:from-emerald-500 group-hover:to-emerald-300"
                  :style="{ height: `${getBarHeight(month.income.amount, maxIncome)}%`, minHeight: month.income.amount > 0 ? '6px' : '2px' }"
                ></div>
                <!-- Tax bar (scaled 10x for visibility) -->
                <div 
                  class="w-3 sm:w-4 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm transition-all group-hover:from-amber-500 group-hover:to-amber-300"
                  :style="{ height: `${getTaxBarHeight(month.estimatedTaxes?.total || 0, maxIncome)}%`, minHeight: (month.estimatedTaxes?.total || 0) > 0 ? '6px' : '2px' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- X-axis labels -->
        <div class="flex gap-2 mt-1">
          <div class="w-12"></div>
          <div class="flex-1 flex justify-between pl-2">
            <span 
              v-for="month in cashFlow?.months || []" 
              :key="month.month"
              class="flex-1 text-center text-[10px] sm:text-xs font-medium"
              :class="{
                'text-emerald-400 font-bold': month.status === 'current',
                'text-slate-500': month.status === 'past',
                'text-slate-400': month.status === 'future'
              }"
            >
              {{ month.monthName.slice(0, 3) }}
            </span>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex items-center justify-center gap-6 mt-4 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-emerald-400"></div>
            <span class="text-slate-400">Ingresos</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-gradient-to-t from-amber-600 to-amber-400"></div>
            <span class="text-slate-400">Impuestos (10x)</span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Mes</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Ingresos</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Imp. Ventas</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Aporte</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Total Imp.</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Pagado</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr 
              v-for="month in cashFlow?.months || []" 
              :key="month.month"
              class="hover:bg-slate-700/20 transition-colors"
              :class="{
                'bg-emerald-500/5': month.status === 'current',
                'opacity-60': month.status === 'past'
              }"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span 
                    class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-emerald-500': month.status === 'current',
                      'bg-slate-500': month.status === 'past',
                      'bg-blue-500': month.status === 'future'
                    }"
                  ></span>
                  <span class="font-medium text-white">{{ month.monthName }}</span>
                  <span v-if="month.income.isEstimated" class="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Est.</span>
                  <span v-if="month.isHighPressure" class="text-xs text-red-400">🔥</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right font-mono text-slate-300">
                {{ formatCurrency(month.income.amount) }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-slate-400">
                {{ formatCurrency(month.estimatedTaxes?.salesTax || 0) }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-slate-400">
                {{ formatCurrency(month.estimatedTaxes?.incomeAdvance || 0) }}
              </td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-white">
                {{ formatCurrency(month.estimatedTaxes?.total || 0) }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-emerald-400">
                {{ month.payments.totalPaid > 0 ? formatCurrency(month.payments.totalPaid) : '-' }}
              </td>
              <td class="px-4 py-3 text-right font-mono font-semibold" :class="month.balance >= 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ formatCurrency(month.balance) }}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-900/50 font-semibold">
            <tr>
              <td class="px-4 py-3 text-white">Total Anual</td>
              <td class="px-4 py-3 text-right font-mono text-white">{{ formatCurrency(cashFlow?.summary?.totalIncome || 0) }}</td>
              <td class="px-4 py-3 text-right font-mono text-slate-400">-</td>
              <td class="px-4 py-3 text-right font-mono text-slate-400">-</td>
              <td class="px-4 py-3 text-right font-mono text-white">{{ formatCurrency(cashFlow?.summary?.totalTaxes || 0) }}</td>
              <td class="px-4 py-3 text-right font-mono text-emerald-400">{{ formatCurrency(cashFlow?.summary?.totalPaid || 0) }}</td>
              <td class="px-4 py-3 text-right font-mono text-slate-400">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Predictions Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Income Predictions -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span class="text-xl">🔮</span> Predicción de Ingresos
        </h3>
        
        <div v-if="predictions?.income?.predictions?.length > 0" class="space-y-3">
          <div 
            v-for="pred in predictions.income.predictions" 
            :key="`${pred.month}-${pred.year}`"
            class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
          >
            <div>
              <p class="font-medium text-white">{{ pred.monthName }} {{ pred.year }}</p>
              <p class="text-xs text-slate-400">Confianza: {{ pred.confidence }}</p>
            </div>
            <div class="text-right">
              <p class="font-mono font-semibold text-emerald-400">{{ formatCurrency(pred.predictedAmount) }}</p>
              <p class="text-xs text-slate-500">{{ formatCurrency(pred.range.low) }} - {{ formatCurrency(pred.range.high) }}</p>
            </div>
          </div>

          <!-- Trend indicator -->
          <div v-if="predictions.income.trend" class="p-3 rounded-lg" :class="{
            'bg-emerald-500/10 border border-emerald-500/20': predictions.income.trend.direction === 'up',
            'bg-red-500/10 border border-red-500/20': predictions.income.trend.direction === 'down',
            'bg-slate-700/30': predictions.income.trend.direction === 'stable'
          }">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ predictions.income.trend.direction === 'up' ? '📈' : predictions.income.trend.direction === 'down' ? '📉' : '📊' }}</span>
              <span class="text-sm" :class="{
                'text-emerald-400': predictions.income.trend.direction === 'up',
                'text-red-400': predictions.income.trend.direction === 'down',
                'text-slate-300': predictions.income.trend.direction === 'stable'
              }">
                Tendencia {{ predictions.income.trend.direction === 'up' ? 'al alza' : predictions.income.trend.direction === 'down' ? 'a la baja' : 'estable' }}
                <span v-if="predictions.income.trend.percentChange">({{ predictions.income.trend.percentChange > 0 ? '+' : '' }}{{ predictions.income.trend.percentChange }}%)</span>
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6">
          <p class="text-slate-400 text-sm">Registra más ingresos para ver predicciones</p>
        </div>
      </div>

      <!-- Tax Estimates -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span class="text-xl">🧮</span> Estimación de Impuestos
        </h3>
        
        <div v-if="predictions?.taxes?.estimates?.length > 0" class="space-y-3">
          <div 
            v-for="est in predictions.taxes.estimates" 
            :key="`${est.month}-${est.year}`"
            class="p-3 bg-slate-700/30 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="font-medium text-white">{{ est.monthName }} {{ est.year }}</p>
              <p class="font-mono font-semibold text-white">{{ formatCurrency(est.estimatedTax.total) }}</p>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Con bonificación máxima (8%)</span>
              <span class="text-emerald-400 font-mono">{{ formatCurrency(est.withMaxBonus.amount) }}</span>
            </div>
            <div class="flex items-center justify-between text-xs mt-1">
              <span class="text-slate-400">Ahorro potencial</span>
              <span class="text-purple-400 font-mono">{{ formatCurrency(est.withMaxBonus.savings) }}</span>
            </div>
          </div>

          <!-- Summary -->
          <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-300">Total próximos meses</span>
              <span class="font-mono font-semibold text-white">{{ formatCurrency(predictions.taxes.summary?.totalEstimated || 0) }}</span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="text-sm text-emerald-400">Ahorro potencial total</span>
              <span class="font-mono font-semibold text-emerald-400">{{ formatCurrency(predictions.taxes.summary?.potentialSavings || 0) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6">
          <p class="text-slate-400 text-sm">No hay estimaciones disponibles</p>
        </div>
      </div>
    </div>

    <!-- Recommendation -->
    <div class="bg-gradient-to-r from-purple-900/30 to-slate-800/50 rounded-xl p-5 border border-purple-700/30">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span class="text-2xl">💡</span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white mb-1">Recomendación</h3>
          <p class="text-slate-300">
            Basado en tu flujo de caja, te recomendamos reservar 
            <span class="text-purple-400 font-semibold font-mono">
              {{ formatCurrency(Math.ceil((cashFlow?.summary?.avgMonthlyTax || 0) * 1.1)) }}
            </span>
            mensuales para impuestos. Esto incluye un 10% de margen de seguridad.
          </p>
          <p v-if="cashFlow?.summary?.highPressureMonths?.length > 0" class="text-amber-400 text-sm mt-2">
            ⚠️ Presta especial atención a: {{ cashFlow.summary.highPressureMonths.join(', ') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { predictionsApi } from '../services/api'

const loading = ref(true)
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(null)
const cashFlow = ref(null)
const predictions = ref(null)

const maxIncome = computed(() => {
  if (!cashFlow.value?.months) return 1
  return Math.max(...cashFlow.value.months.map(m => m.income.amount || 1))
})

const maxTax = computed(() => {
  if (!cashFlow.value?.months) return 1
  return Math.max(...cashFlow.value.months.map(m => m.estimatedTaxes?.total || 1))
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0).replace('CUP', '$')
}

const getBarHeight = (value, max) => {
  if (!max || max === 0) return 0
  // Asegurar un mínimo visible y escalar correctamente
  const percentage = (value / max) * 100
  return Math.min(100, Math.max(2, percentage))
}

// Para hacer los impuestos más visibles, multiplicamos por 10 (ya que son ~10% de ingresos)
const getTaxBarHeight = (value, maxIncome) => {
  if (!maxIncome || maxIncome === 0) return 0
  // Multiplicar por 10 para hacer visible (impuestos son ~10% de ingresos)
  const scaledValue = value * 10
  const percentage = (scaledValue / maxIncome) * 100
  return Math.min(100, Math.max(2, percentage))
}

const loadData = async () => {
  loading.value = true
  try {
    const [cashFlowRes, summaryRes] = await Promise.all([
      predictionsApi.getCashFlow(selectedYear.value),
      predictionsApi.getSummary(selectedYear.value)
    ])
    
    cashFlow.value = cashFlowRes.data
    predictions.value = {
      income: summaryRes.data.income,
      taxes: summaryRes.data.taxes
    }
  } catch (error) {
    console.error('Error loading cash flow:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

