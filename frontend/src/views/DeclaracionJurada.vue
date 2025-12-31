<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-display font-bold text-white flex items-center gap-3">
          <span class="text-3xl">📋</span>
          Declaración Jurada Anual (DJ-08)
        </h1>
        <p class="text-slate-400 mt-1">Impuesto sobre Ingresos Personales - Año Fiscal {{ selectedYear }}</p>
      </div>
      <div class="flex items-center gap-3">
        <select 
          v-model="selectedYear"
          @change="loadData"
          class="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
        >
          <option :value="2023">2023</option>
          <option :value="2024">2024</option>
          <option :value="2025">2025</option>
        </select>
      </div>
    </div>

    <!-- Status Banner -->
    <div 
      v-if="declaration"
      class="rounded-xl p-4 border"
      :class="{
        'bg-emerald-500/10 border-emerald-500/30': declaration.result.status === 'SALDADO',
        'bg-amber-500/10 border-amber-500/30': declaration.result.status === 'A FAVOR',
        'bg-red-500/10 border-red-500/30': declaration.result.status === 'A PAGAR'
      }"
    >
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <span class="text-3xl">
            {{ declaration.result.status === 'SALDADO' ? '✅' : declaration.result.status === 'A FAVOR' ? '🎉' : '⚠️' }}
          </span>
          <div>
            <p class="font-semibold text-lg" :class="{
              'text-emerald-400': declaration.result.status === 'SALDADO',
              'text-amber-400': declaration.result.status === 'A FAVOR',
              'text-red-400': declaration.result.status === 'A PAGAR'
            }">
              {{ declaration.result.status }}
            </p>
            <p class="text-slate-300 text-sm">{{ declaration.result.message }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">Fecha límite de presentación</p>
          <p class="font-mono font-semibold text-white">{{ declaration.status.deadline }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="declaration" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span class="text-xl">💰</span>
            </div>
            <div>
              <p class="text-xs text-slate-400">Ingresos Anuales</p>
              <p class="text-lg font-bold text-white font-mono">{{ formatCurrency(declaration.incomes.total) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span class="text-xl">📊</span>
            </div>
            <div>
              <p class="text-xs text-slate-400">Base Imponible</p>
              <p class="text-lg font-bold text-white font-mono">{{ formatCurrency(declaration.calculation.taxableBase) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span class="text-xl">🧮</span>
            </div>
            <div>
              <p class="text-xs text-slate-400">Impuesto Anual</p>
              <p class="text-lg font-bold text-white font-mono">{{ formatCurrency(declaration.calculation.grossTax) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span class="text-xl">✅</span>
            </div>
            <div>
              <p class="text-xs text-slate-400">Aportes Pagados</p>
              <p class="text-lg font-bold text-emerald-400 font-mono">{{ formatCurrency(declaration.result.advancesPaid) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ingresos Mensuales -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div class="p-5 border-b border-slate-700/50">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <span class="text-xl">📅</span> Ingresos por Mes
            </h3>
            <p class="text-sm text-slate-400">{{ declaration.status.monthsWithIncome }} de 12 meses registrados</p>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <div 
                v-for="month in declaration.incomes.monthly" 
                :key="month.month"
                class="p-3 rounded-lg text-center"
                :class="{
                  'bg-emerald-500/10 border border-emerald-500/30': month.hasData,
                  'bg-slate-700/30': !month.hasData
                }"
              >
                <p class="text-xs text-slate-400">{{ month.monthName.slice(0, 3) }}</p>
                <p class="font-mono text-sm font-semibold" :class="month.hasData ? 'text-emerald-400' : 'text-slate-500'">
                  {{ month.hasData ? formatCurrency(month.amount) : '-' }}
                </p>
              </div>
            </div>
            
            <!-- Total -->
            <div class="mt-4 p-3 bg-slate-700/30 rounded-lg flex justify-between items-center">
              <span class="text-slate-300">Total Anual</span>
              <span class="font-mono font-bold text-white text-lg">{{ formatCurrency(declaration.incomes.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Cálculo del Impuesto -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div class="p-5 border-b border-slate-700/50">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <span class="text-xl">🧮</span> Cálculo del Impuesto
            </h3>
            <p class="text-sm text-slate-400">Escala progresiva según Ley 174/2025</p>
          </div>
          <div class="p-4 space-y-3">
            <!-- Deducciones -->
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-400">Ingresos Brutos</span>
                <span class="font-mono text-white">{{ formatCurrency(declaration.incomes.total) }}</span>
              </div>
              <div class="flex justify-between text-red-400">
                <span>(-) Mínimo Exento</span>
                <span class="font-mono">{{ formatCurrency(declaration.deductions.minimumExempt) }}</span>
              </div>
              <div class="flex justify-between text-red-400">
                <span>(-) Gastos Deducibles (40%)</span>
                <span class="font-mono">{{ formatCurrency(declaration.deductions.estimatedExpenses) }}</span>
              </div>
              <div class="border-t border-slate-700/50 pt-2 flex justify-between font-semibold">
                <span class="text-white">Base Imponible</span>
                <span class="font-mono text-white">{{ formatCurrency(declaration.calculation.taxableBase) }}</span>
              </div>
            </div>

            <!-- Escala Progresiva -->
            <div v-if="declaration.calculation.brackets?.length > 0" class="mt-4">
              <p class="text-xs text-slate-400 mb-2">Aplicación de Escala Progresiva:</p>
              <div class="space-y-1">
                <div 
                  v-for="(bracket, index) in declaration.calculation.brackets" 
                  :key="index"
                  class="flex items-center justify-between text-xs p-2 rounded bg-slate-700/30"
                >
                  <span class="text-slate-400">{{ bracket.range }} ({{ bracket.rate }})</span>
                  <div class="text-right">
                    <span class="text-slate-500 mr-2">{{ formatCurrency(bracket.taxable) }} ×</span>
                    <span class="font-mono text-amber-400">{{ formatCurrency(bracket.tax) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Impuesto -->
            <div class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-slate-300">Impuesto Bruto</span>
                <span class="font-mono font-bold text-red-400 text-lg">{{ formatCurrency(declaration.calculation.grossTax) }}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">Tasa efectiva: {{ declaration.calculation.effectiveRate }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagos a Cuenta y Resultado -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Pagos a Cuenta -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="text-xl">💳</span> Pagos a Cuenta Realizados
          </h3>
          
          <div class="space-y-3">
            <div class="p-3 bg-slate-700/30 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-white">{{ declaration.paymentsOnAccount.salesTax.name }}</p>
                  <p class="text-xs text-slate-500">{{ declaration.paymentsOnAccount.salesTax.note }}</p>
                </div>
                <span class="font-mono text-slate-400">{{ formatCurrency(declaration.paymentsOnAccount.salesTax.paid) }}</span>
              </div>
            </div>
            
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-white">{{ declaration.paymentsOnAccount.incomeAdvance.name }}</p>
                  <p class="text-xs text-emerald-400">{{ declaration.paymentsOnAccount.incomeAdvance.note }}</p>
                </div>
                <span class="font-mono text-emerald-400 font-bold">{{ formatCurrency(declaration.paymentsOnAccount.incomeAdvance.paid) }}</span>
              </div>
            </div>
            
            <div class="p-3 bg-slate-700/30 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-white">{{ declaration.paymentsOnAccount.quarterly.name }}</p>
                  <p class="text-xs text-slate-500">{{ declaration.paymentsOnAccount.quarterly.note }}</p>
                </div>
                <span class="font-mono text-slate-400">{{ formatCurrency(declaration.paymentsOnAccount.quarterly.paid) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resultado Final -->
        <div 
          class="rounded-xl p-5 border"
          :class="{
            'bg-emerald-500/10 border-emerald-500/30': declaration.result.status === 'SALDADO',
            'bg-amber-500/10 border-amber-500/30': declaration.result.status === 'A FAVOR',
            'bg-red-500/10 border-red-500/30': declaration.result.status === 'A PAGAR'
          }"
        >
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="text-xl">📝</span> Resultado de la Declaración
          </h3>
          
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Impuesto Anual a Pagar</span>
              <span class="font-mono text-white">{{ formatCurrency(declaration.result.annualTaxDue) }}</span>
            </div>
            <div class="flex justify-between text-sm text-emerald-400">
              <span>(-) Aportes a Cuenta Pagados</span>
              <span class="font-mono">{{ formatCurrency(declaration.result.advancesPaid) }}</span>
            </div>
            <div class="border-t border-slate-700/50 pt-3">
              <div class="flex justify-between items-center">
                <span class="font-semibold text-white">DEUDA PENDIENTE</span>
                <div class="text-right">
                  <span 
                    class="font-mono font-bold text-2xl"
                    :class="{
                      'text-emerald-400': declaration.result.status === 'SALDADO',
                      'text-amber-400': declaration.result.status === 'A FAVOR',
                      'text-red-400': declaration.result.status === 'A PAGAR'
                    }"
                  >
                    {{ declaration.result.hasToPay ? formatCurrency(declaration.result.balance) : declaration.result.hasRefund ? '+' + formatCurrency(declaration.result.balance) : '$0' }}
                  </span>
                  <p class="text-xs mt-1 font-medium" :class="{
                    'text-emerald-400': declaration.result.status === 'SALDADO',
                    'text-amber-400': declaration.result.status === 'A FAVOR',
                    'text-red-400': declaration.result.status === 'A PAGAR'
                  }">
                    {{ declaration.result.status === 'SALDADO' ? '¡SIN DEUDAS!' : declaration.result.status === 'A FAVOR' ? 'SALDO A TU FAVOR' : 'PENDIENTE DE PAGO' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Explanation -->
          <div class="mt-4 p-3 rounded-lg" :class="{
            'bg-emerald-500/20': declaration.result.status === 'SALDADO',
            'bg-amber-500/20': declaration.result.status === 'A FAVOR',
            'bg-red-500/20': declaration.result.status === 'A PAGAR'
          }">
            <p class="text-sm" :class="{
              'text-emerald-300': declaration.result.status === 'SALDADO',
              'text-amber-300': declaration.result.status === 'A FAVOR',
              'text-red-300': declaration.result.status === 'A PAGAR'
            }">
              <template v-if="declaration.result.status === 'SALDADO'">
                <span class="font-semibold">✓ No tienes deudas con la ONAT.</span>
                <span v-if="declaration.calculation.taxableBase <= 0"> Tus ingresos no superan el mínimo exento anual.</span>
                <span v-else> Has pagado todos los impuestos correspondientes.</span>
              </template>
              <template v-else-if="declaration.result.status === 'A FAVOR'">
                <span class="font-semibold">🎉 Tienes un saldo a favor.</span> Puedes solicitar devolución o compensación.
              </template>
              <template v-else>
                <span class="font-semibold">⚠️ Tienes una deuda pendiente.</span> Debes pagar antes del {{ declaration.status.deadline }}.
              </template>
            </p>
          </div>

          <!-- Action Button -->
          <div class="mt-4 pt-4 border-t border-slate-700/50">
            <button 
              v-if="declaration.result.hasToPay"
              class="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              Pagar Deuda de {{ formatCurrency(declaration.result.balance) }}
            </button>
            <button 
              v-else-if="declaration.result.hasRefund"
              class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
            >
              Solicitar Devolución de {{ formatCurrency(declaration.result.balance) }}
            </button>
            <div v-else class="text-center text-emerald-400 py-2 flex items-center justify-center gap-2">
              <span class="text-xl">🎉</span>
              <span class="font-semibold">¡Estás al día con tus obligaciones!</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Información Legal -->
      <div class="bg-gradient-to-r from-blue-900/30 to-slate-800/50 rounded-xl p-5 border border-blue-700/30">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">ℹ️</span>
          </div>
          <div class="space-y-2">
            <h3 class="text-lg font-semibold text-white">Información Importante</h3>
            <ul class="text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>La Declaración Jurada (DJ-08) debe presentarse antes del <strong class="text-white">30 de Abril</strong> del año siguiente.</li>
              <li>El mínimo exento anual es de <strong class="text-white">$39,120 CUP</strong>.</li>
              <li>Los gastos deducibles requieren 80% de justificación documental.</li>
              <li>Los aportes a cuenta (0510122) pagados mensualmente se descuentan del impuesto anual.</li>
              <li>En caso de saldo a favor, puede solicitar devolución o compensación.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { predictionsApi } from '../services/api'

const loading = ref(true)
// Por defecto mostrar el año actual (donde probablemente hay datos)
const selectedYear = ref(new Date().getFullYear())
const declaration = ref(null)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0).replace('CUP', '$')
}

const loadData = async () => {
  loading.value = true
  try {
    const response = await predictionsApi.getAnnualDeclaration(selectedYear.value)
    declaration.value = response.data
  } catch (error) {
    console.error('Error loading annual declaration:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

