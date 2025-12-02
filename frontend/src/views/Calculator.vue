<template>
  <div class="space-y-8">
    <!-- Calculator Card -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Input Form -->
      <div class="card">
        <h3 class="text-xl font-display font-bold text-white mb-6">
          <span class="text-onat-red">📊</span> Calculadora de Impuestos Mensuales
        </h3>
        
        <div class="space-y-6">
          <!-- Gross Income -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Ingreso Bruto Mensual (CUP)
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                v-model.number="grossIncome"
                type="number"
                min="0"
                step="0.01"
                class="input pl-8"
                placeholder="Ej: 3500.00"
                @input="calculate"
              />
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Mínimo exento mensual: <span class="text-emerald-400 font-semibold">{{ formatCurrency(3260) }}</span>
            </p>
          </div>

          <!-- Quick Amounts -->
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="amount in [2000, 2500, 3000, 3500, 4000, 5000]" 
              :key="amount"
              @click="grossIncome = amount; calculate()"
              class="px-3 py-1.5 text-sm bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
            >
              {{ formatCurrency(amount) }}
            </button>
          </div>

          <!-- Bonuses -->
          <div class="space-y-3 pt-4 border-t border-slate-700/50">
            <p class="text-sm font-medium text-slate-300">Bonificaciones disponibles</p>
            
            <label class="flex items-center gap-3 cursor-pointer group">
              <input 
                v-model="isEarlyPayment" 
                type="checkbox" 
                class="w-5 h-5 rounded border-slate-600 bg-slate-800 text-onat-red focus:ring-onat-red"
                @change="calculate"
              />
              <span class="text-slate-300 group-hover:text-white transition-colors">
                Pago anticipado (antes del vencimiento)
                <span class="text-emerald-400 font-semibold ml-2">-5%</span>
              </span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer group">
              <input 
                v-model="useTransfermovil" 
                type="checkbox" 
                class="w-5 h-5 rounded border-slate-600 bg-slate-800 text-onat-red focus:ring-onat-red"
                @change="calculate"
              />
              <span class="text-slate-300 group-hover:text-white transition-colors">
                Pago por Transfermóvil/EnZona
                <span class="text-emerald-400 font-semibold ml-2">-3%</span>
              </span>
            </label>
          </div>

          <!-- Calculate Button -->
          <button 
            @click="calculate" 
            :disabled="!grossIncome || calculating"
            class="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="calculating" class="flex items-center justify-center gap-2">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Calculando...
            </span>
            <span v-else>Calcular Impuestos</span>
          </button>
        </div>
      </div>

      <!-- Results -->
      <div class="card bg-gradient-to-br from-slate-800/80 to-slate-900/80">
        <h3 class="text-xl font-display font-bold text-white mb-6">Resultado del Cálculo</h3>

        <div v-if="!result" class="text-center py-12">
          <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p class="text-slate-400">Ingresa tu ingreso mensual para calcular</p>
        </div>

        <div v-else class="space-y-4 animate-fade-in">
          <!-- Income Info -->
          <div class="p-4 bg-slate-900/50 rounded-lg">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-slate-400">Ingreso bruto mensual</span>
              <span class="text-white font-mono font-semibold">{{ formatCurrency(result.grossIncome) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Mínimo exento mensual</span>
              <span class="text-emerald-400 font-mono">{{ formatCurrency(result.minimumExempt) }}</span>
            </div>
          </div>

          <!-- Impuesto sobre Ventas (0114022) -->
          <div class="p-4 bg-amber-900/20 rounded-lg border border-amber-700/30">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded">0114022</span>
              <span class="text-amber-300 font-medium">{{ result.taxes.salesTax.name }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 text-sm">10% sobre ingreso bruto</span>
              <span class="text-amber-400 font-mono font-bold text-lg">{{ formatCurrency(result.taxes.salesTax.amount) }}</span>
            </div>
          </div>

          <!-- Aporte Ingresos Personales (0510122) -->
          <div 
            class="p-4 rounded-lg border"
            :class="result.taxes.incomeAdvance.applies 
              ? 'bg-orange-900/20 border-orange-700/30' 
              : 'bg-slate-800/50 border-slate-700/30'"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-0.5 text-xs font-mono rounded"
                :class="result.taxes.incomeAdvance.applies ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-600/20 text-slate-500'"
              >0510122</span>
              <span :class="result.taxes.incomeAdvance.applies ? 'text-orange-300' : 'text-slate-500'" class="font-medium">
                {{ result.taxes.incomeAdvance.name }}
              </span>
            </div>
            
            <div v-if="result.taxes.incomeAdvance.applies">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-400">Exceso sobre mínimo exento</span>
                <span class="text-slate-300 font-mono">{{ formatCurrency(result.taxes.incomeAdvance.excess) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400 text-sm">5% sobre el exceso</span>
                <span class="text-orange-400 font-mono font-bold text-lg">{{ formatCurrency(result.taxes.incomeAdvance.amount) }}</span>
              </div>
            </div>
            <div v-else class="text-sm text-slate-500">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ result.taxes.incomeAdvance.message }}
              </span>
            </div>
          </div>

          <!-- Total sin bonificación -->
          <div class="p-4 bg-slate-900/50 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-slate-300 font-medium">Total impuestos mensuales</span>
              <span class="text-onat-red font-mono font-bold text-xl">{{ formatCurrency(result.totalMonthlyTax) }}</span>
            </div>
          </div>

          <!-- Bonus Applied -->
          <div v-if="bonusResult && bonusResult.bonusPercent > 0" class="p-4 bg-emerald-900/30 rounded-lg border border-emerald-700/30">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-emerald-400 font-medium">Bonificación: {{ bonusResult.bonusPercent }}%</span>
            </div>
            <div class="space-y-2 text-sm">
              <div v-for="bonus in bonusResult.bonuses" :key="bonus.type" class="flex justify-between text-slate-400">
                <span>{{ bonus.type }} ({{ bonus.percent }}%)</span>
                <span class="text-emerald-400 font-mono">-{{ formatCurrency(bonus.amount) }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-emerald-700/30">
                <span class="text-white font-medium">💰 Total a pagar</span>
                <span class="text-emerald-400 font-mono font-bold text-xl">{{ formatCurrency(bonusResult.finalAmount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tax Rates Info -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Impuestos Mensuales -->
      <div class="card">
        <h3 class="text-xl font-display font-bold text-white mb-6">📋 Impuestos Mensuales TCP</h3>
        
        <div class="space-y-4">
          <div class="p-4 bg-amber-900/20 rounded-lg border border-amber-700/30">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded">0114022</span>
              <span class="text-white font-medium">Impuesto s/ Ventas y Servicios</span>
            </div>
            <p class="text-slate-400 text-sm">
              <strong class="text-amber-400">10%</strong> sobre los ingresos brutos mensuales. 
              Se paga siempre, sin importar el monto de ingresos.
            </p>
          </div>

          <div class="p-4 bg-orange-900/20 rounded-lg border border-orange-700/30">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-mono rounded">0510122</span>
              <span class="text-white font-medium">Aporte a cuenta Imp. Ingresos Personales</span>
            </div>
            <p class="text-slate-400 text-sm">
              <strong class="text-orange-400">5%</strong> sobre ingresos que excedan 
              <strong class="text-emerald-400">{{ formatCurrency(3260) }}</strong> mensuales (mínimo exento).
              Solo aplica si superas este monto.
            </p>
          </div>

          <div class="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">0820132</span>
              <span class="text-white font-medium">Pago Trimestral</span>
            </div>
            <p class="text-slate-400 text-sm">
              Monto fijo de <strong class="text-blue-400">{{ formatCurrency(1200) }}</strong> por trimestre.
              Se paga 4 veces al año (abril, julio, octubre, enero).
            </p>
          </div>
        </div>
      </div>

      <!-- Escala Progresiva Anual -->
      <div class="card">
        <h3 class="text-xl font-display font-bold text-white mb-6">📈 Escala Progresiva Anual (Ley 174/2025)</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-700/50">
                <th class="text-left py-2 text-slate-400 font-medium">Base Imponible (CUP)</th>
                <th class="text-right py-2 text-slate-400 font-medium">Tasa</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bracket in taxBrackets" :key="bracket.min" class="border-b border-slate-700/30">
                <td class="py-2 text-slate-300 font-mono text-xs">
                  {{ formatNumber(bracket.min) }} - {{ bracket.max === Infinity ? '∞' : formatNumber(bracket.max) }}
                </td>
                <td class="py-2 text-right">
                  <span class="px-2 py-0.5 bg-onat-red/20 text-onat-red rounded text-xs font-semibold">
                    {{ bracket.rate * 100 }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 p-3 bg-slate-900/50 rounded-lg">
          <p class="text-xs text-slate-400">
            <strong class="text-slate-300">Mínimo exento anual:</strong> 
            <span class="text-emerald-400 font-semibold">{{ formatCurrency(39120) }}</span>
            <br>
            Esta escala aplica a la Declaración Jurada anual, no a los pagos mensuales.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { calculatorApi } from '../services/api'

const grossIncome = ref(null)
const isEarlyPayment = ref(true) // Por defecto marcado ya que usualmente paga anticipado
const useTransfermovil = ref(true) // Por defecto marcado ya que usa Transfermóvil
const calculating = ref(false)
const result = ref(null)
const bonusResult = ref(null)

const taxBrackets = ref([
  { min: 0, max: 25000, rate: 0.05 },
  { min: 25000, max: 50000, rate: 0.10 },
  { min: 50000, max: 75000, rate: 0.15 },
  { min: 75000, max: 100000, rate: 0.20 },
  { min: 100000, max: 150000, rate: 0.25 },
  { min: 150000, max: 200000, rate: 0.30 },
  { min: 200000, max: 350000, rate: 0.35 },
  { min: 350000, max: 500000, rate: 0.40 },
  { min: 500000, max: 1000000, rate: 0.45 },
  { min: 1000000, max: Infinity, rate: 0.50 }
])

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

function formatNumber(num) {
  return new Intl.NumberFormat('es-CU').format(num)
}

async function calculate() {
  if (!grossIncome.value) return

  calculating.value = true
  try {
    // Calculate monthly taxes
    const taxRes = await calculatorApi.calculateMonthly(grossIncome.value)
    result.value = taxRes.data

    // Calculate bonus if applicable
    if (isEarlyPayment.value || useTransfermovil.value) {
      const bonusRes = await calculatorApi.calculateBonus(
        result.value.totalMonthlyTax,
        isEarlyPayment.value,
        useTransfermovil.value
      )
      bonusResult.value = bonusRes.data
    } else {
      bonusResult.value = null
    }
  } catch (error) {
    console.error('Error calculating:', error)
  } finally {
    calculating.value = false
  }
}

async function loadRates() {
  try {
    const res = await calculatorApi.getRates()
    if (res.data.annualIncomeTax?.brackets) {
      taxBrackets.value = res.data.annualIncomeTax.brackets
    }
  } catch (error) {
    console.error('Error loading rates:', error)
  }
}

onMounted(() => {
  loadRates()
})
</script>
