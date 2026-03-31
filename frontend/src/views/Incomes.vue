<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="card bg-gradient-to-r from-blue-900/30 to-slate-800/50 border-blue-700/30">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-display font-bold text-white mb-2">
            <span class="text-blue-400">💰</span> Registro de Ingresos {{ currentFiscalYear }}
          </h2>
          <p class="text-slate-400">Control de tus ingresos mensuales para cálculo de impuestos</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-slate-400 text-sm">Total Anual</p>
            <p class="text-2xl font-display font-bold text-blue-400">{{ formatCurrency(totalAnual) }}</p>
          </div>
          <div class="text-right">
            <p class="text-slate-400 text-sm">Promedio Mensual</p>
            <p class="text-xl font-display font-bold text-white">{{ formatCurrency(promedioMensual) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card border-l-4 border-l-emerald-500">
        <p class="text-slate-400 text-sm">Meses Registrados</p>
        <p class="text-2xl font-bold text-white">{{ mesesConIngreso }}</p>
      </div>
      <div class="card border-l-4 border-l-blue-500">
        <p class="text-slate-400 text-sm">Mes Más Alto</p>
        <p class="text-xl font-bold text-blue-400">{{ formatCurrency(mesMaximo.amount) }}</p>
        <p class="text-xs text-slate-500">{{ mesMaximo.nombre }}</p>
      </div>
      <div class="card border-l-4 border-l-amber-500">
        <p class="text-slate-400 text-sm">Mes Más Bajo</p>
        <p class="text-xl font-bold text-amber-400">{{ formatCurrency(mesMinimo.amount) }}</p>
        <p class="text-xs text-slate-500">{{ mesMinimo.nombre }}</p>
      </div>
      <div class="card border-l-4" :class="superaMinimo ? 'border-l-orange-500' : 'border-l-emerald-500'">
        <p class="text-slate-400 text-sm">Meses > Mínimo Exento</p>
        <p class="text-2xl font-bold" :class="superaMinimo ? 'text-orange-400' : 'text-emerald-400'">{{ mesesSobreMinimo }}</p>
        <p class="text-xs text-slate-500">Mínimo: {{ formatCurrency(3260) }}</p>
      </div>
    </div>

    <!-- Monthly Grid -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-display font-bold text-white">Ingresos por Mes</h3>
        <div class="flex items-center gap-2 text-sm">
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded bg-emerald-500"></span>
            <span class="text-slate-400">Bajo mínimo</span>
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded bg-orange-500"></span>
            <span class="text-slate-400">Sobre mínimo</span>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
          v-for="mes in mesesDelAno" 
          :key="mes.numero"
          class="relative p-4 rounded-xl border transition-all cursor-pointer hover:scale-105"
          :class="getMonthClass(mes)"
          @click="editarMes(mes)"
        >
          <!-- Month Header -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-lg font-bold" :class="mes.ingreso ? 'text-white' : 'text-slate-500'">
              {{ mes.nombre }}
            </span>
            <span 
              v-if="mes.ingreso && mes.ingreso.amount > 3260" 
              class="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full"
            >
              +0510122
            </span>
          </div>

          <!-- Amount -->
          <div v-if="mes.ingreso" class="space-y-2">
            <p class="text-2xl font-display font-bold" :class="mes.ingreso.amount > 3260 ? 'text-orange-400' : 'text-emerald-400'">
              {{ formatCurrency(mes.ingreso.amount) }}
            </p>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between text-slate-400">
                <span>0114022 (10%)</span>
                <span class="text-amber-400">{{ formatCurrency(mes.ingreso.amount * 0.10) }}</span>
              </div>
              <div v-if="mes.ingreso.amount > 3260" class="flex justify-between text-slate-400">
                <span>0510122 (5%)</span>
                <span class="text-orange-400">{{ formatCurrency((mes.ingreso.amount - 3260) * 0.05) }}</span>
              </div>
            </div>
          </div>

          <!-- No Income -->
          <div v-else class="text-center py-4">
            <svg class="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p class="text-slate-500 text-sm">Sin registro</p>
          </div>

          <!-- Edit Icon -->
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="card">
      <h3 class="text-xl font-display font-bold text-white mb-6">📈 Evolución de Ingresos</h3>
      
      <!-- Chart Container -->
      <div class="relative">
        <!-- Línea del mínimo exento -->
        <div 
          class="absolute left-0 right-0 border-t-2 border-dashed border-orange-500/50 z-10"
          :style="{ bottom: getBarHeight(3260) + 32 + 'px' }"
        >
          <span class="absolute -top-5 right-0 text-xs text-orange-400 bg-slate-800 px-2">Mínimo $3,260</span>
        </div>
        
        <!-- Bars -->
        <div class="flex items-end gap-3 h-64 px-2">
          <div 
            v-for="mes in mesesDelAno" 
            :key="'chart-' + mes.numero"
            class="flex-1 flex flex-col items-center"
          >
            <!-- Bar container -->
            <div class="w-full h-52 flex items-end justify-center">
              <div 
                class="w-full max-w-12 rounded-t-lg transition-all duration-500 ease-out relative group cursor-pointer"
                :class="[
                  mes.ingreso?.amount > 3260 ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 'bg-gradient-to-t from-blue-600 to-blue-400',
                  !mes.ingreso ? 'bg-slate-700/50' : ''
                ]"
                :style="{ height: getBarHeight(mes.ingreso?.amount || 0) + 'px' }"
              >
                <!-- Tooltip -->
                <div class="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                  <p class="text-white font-bold text-sm">{{ formatCurrency(mes.ingreso?.amount || 0) }}</p>
                  <p class="text-slate-400 text-xs">{{ mes.nombre }}</p>
                </div>
              </div>
            </div>
            <!-- Month label -->
            <span class="text-xs text-slate-400 mt-2 font-medium">{{ mes.nombre.slice(0, 3) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="flex justify-center mt-6 pt-4 border-t border-slate-700/50">
        <div class="flex items-center gap-6 text-sm">
          <span class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-gradient-to-t from-blue-600 to-blue-400"></span>
            <span class="text-slate-400">Bajo mínimo</span>
          </span>
          <span class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-gradient-to-t from-orange-600 to-orange-400"></span>
            <span class="text-slate-400">Sobre mínimo</span>
          </span>
          <span class="text-slate-500">|</span>
          <span class="text-slate-400">Mín: <span class="text-white font-mono">{{ formatCurrency(mesMinimo.amount) }}</span></span>
          <span class="text-slate-400">Máx: <span class="text-white font-mono">{{ formatCurrency(mesMaximo.amount) }}</span></span>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 animate-fade-in">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-display font-bold text-white">
            {{ editingMes?.ingreso ? 'Editar' : 'Registrar' }} Ingreso - {{ editingMes?.nombre }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Ingreso Bruto (CUP)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">$</span>
              <input
                v-model.number="formIngreso"
                type="number"
                min="0"
                step="0.01"
                class="input"
                style="padding-left: 28px"
                placeholder="Ej: 2800.00"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Notas (opcional)</label>
            <input
              v-model="formNotas"
              type="text"
              class="input"
              placeholder="Ej: Proyecto especial"
            />
          </div>

          <!-- Preview -->
          <div v-if="formIngreso > 0" class="p-4 bg-slate-900/50 rounded-lg space-y-0">
            <p class="text-sm font-medium text-slate-300 mb-3">Obligaciones que se generan este mes:</p>

            <!-- Alerta de mora -->
            <div v-if="surchargeVentas || surchargeAporte" class="mb-3 p-3 bg-red-900/30 border border-red-700/60 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p class="text-sm font-bold text-red-300">Recargo por mora (1060122)</p>
              </div>
              <p class="text-xs text-red-300/80 mb-2">La fecha límite de pago ya venció. Se aplica recargo según reglas ONAT.</p>
              <div v-if="surchargeVentas" class="flex justify-between text-xs py-1">
                <span class="text-red-300/70">Mora 0114022: {{ surchargeVentas.desc }}</span>
                <span class="text-red-400 font-mono font-bold">+{{ formatCurrency(surchargeVentas.amount) }}</span>
              </div>
              <div v-if="surchargeAporte" class="flex justify-between text-xs py-1">
                <span class="text-red-300/70">Mora 0510122: {{ surchargeAporte.desc }}</span>
                <span class="text-red-400 font-mono font-bold">+{{ formatCurrency(surchargeAporte.amount) }}</span>
              </div>
              <div class="flex justify-between text-xs pt-2 mt-1 border-t border-red-700/40">
                <span class="text-red-200 font-medium">Total recargo por mora</span>
                <span class="text-red-400 font-mono font-bold">{{ formatCurrency(totalSurcharge) }}</span>
              </div>
            </div>

            <div class="divide-y divide-slate-700/50">
              <!-- 0114022 -->
              <div class="py-2">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-slate-300">0114022 - Imp. Ventas y servicios (10%)</p>
                    <p class="text-xs" :class="surchargeVentas ? 'text-red-400' : 'text-slate-500'">
                      <template v-if="surchargeVentas">Vencido el {{ monthlyDueDate }} — {{ surchargeVentas.lateDays }} días hábiles de mora</template>
                      <template v-else>Pagar antes del <span class="text-amber-400 font-medium">{{ monthlyDueDate }}</span></template>
                    </p>
                  </div>
                  <span class="text-amber-400 font-mono font-medium">{{ formatCurrency(formIngreso * 0.10) }}</span>
                </div>
                <div v-if="surchargeVentas" class="flex justify-between mt-1 ml-4">
                  <span class="text-xs text-red-400/70">+ Recargo {{ (surchargeVentas.rate * 100).toFixed(1) }}%</span>
                  <span class="text-xs text-red-400 font-mono">+{{ formatCurrency(surchargeVentas.amount) }}</span>
                </div>
              </div>

              <!-- 0510122 -->
              <div class="py-2">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm" :class="formIngreso > 3260 ? 'text-slate-300' : 'text-slate-500'">
                      0510122 - Aporte Ingresos Personales (5%)
                    </p>
                    <p v-if="formIngreso > 3260" class="text-xs" :class="surchargeAporte ? 'text-red-400' : 'text-slate-500'">
                      <template v-if="surchargeAporte">5% de {{ formatCurrency(formIngreso - 3260) }}. Vencido el {{ monthlyDueDate }} — {{ surchargeAporte.lateDays }} días hábiles</template>
                      <template v-else>5% de {{ formatCurrency(formIngreso - 3260) }} (excedente). Pagar antes del <span class="text-orange-400 font-medium">{{ monthlyDueDate }}</span></template>
                    </p>
                    <p v-else class="text-xs text-emerald-500">No aplica (ingreso &le; $3,260 mínimo exento)</p>
                  </div>
                  <span v-if="formIngreso > 3260" class="text-orange-400 font-mono font-medium">{{ formatCurrency((formIngreso - 3260) * 0.05) }}</span>
                  <span v-else class="text-slate-600 font-mono">$0.00</span>
                </div>
                <div v-if="surchargeAporte" class="flex justify-between mt-1 ml-4">
                  <span class="text-xs text-red-400/70">+ Recargo {{ (surchargeAporte.rate * 100).toFixed(1) }}%</span>
                  <span class="text-xs text-red-400 font-mono">+{{ formatCurrency(surchargeAporte.amount) }}</span>
                </div>
              </div>

              <!-- 0820132 -->
              <div class="flex items-center justify-between py-2">
                <div>
                  <p class="text-sm text-slate-400">0820132 - Contrib. Seguridad Social (20% base)</p>
                  <p class="text-xs text-slate-500">Trimestral. Pagar antes del <span class="text-blue-400 font-medium">{{ quarterlyDueDate }}</span></p>
                </div>
                <span class="text-blue-400 font-mono text-xs italic">trimestral</span>
              </div>

              <!-- 0530222 -->
              <div class="flex items-center justify-between py-2">
                <div>
                  <p class="text-sm text-slate-400">0530222 - Liquidación adicional (DJ-08)</p>
                  <p class="text-xs text-slate-500">Anual. Pagar antes del <span class="text-purple-400 font-medium">30/Abr/{{ (currentFiscalYear + 1).toString().slice(-2) }}</span></p>
                </div>
                <span class="text-purple-400 font-mono text-xs italic">anual</span>
              </div>
            </div>

            <div class="flex justify-between text-sm pt-3 mt-1 border-t border-slate-600">
              <span class="text-white font-bold">Total cargos mensuales</span>
              <span class="text-onat-red font-mono font-bold">
                {{ formatCurrency(formIngreso * 0.10 + (formIngreso > 3260 ? (formIngreso - 3260) * 0.05 : 0)) }}
              </span>
            </div>
            <div v-if="totalSurcharge > 0" class="flex justify-between text-sm pt-1">
              <span class="text-red-300 font-bold">+ Recargo por mora (1060122)</span>
              <span class="text-red-400 font-mono font-bold">{{ formatCurrency(totalSurcharge) }}</span>
            </div>
            <div v-if="totalSurcharge > 0" class="flex justify-between text-sm pt-2 mt-1 border-t border-red-700/40">
              <span class="text-white font-bold text-base">TOTAL A PAGAR</span>
              <span class="text-red-400 font-mono font-bold text-base">
                {{ formatCurrency(formIngreso * 0.10 + (formIngreso > 3260 ? (formIngreso - 3260) * 0.05 : 0) + totalSurcharge) }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-2">
              Descuento 3% por Transfermóvil. Bonificación 5% en DJ si declara antes del 28/Feb.
            </p>
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              v-if="editingMes?.ingreso"
              @click="eliminarIngreso"
              class="btn bg-red-600/20 text-red-400 hover:bg-red-600/30"
            >
              Eliminar
            </button>
            <button @click="closeModal" class="btn btn-secondary flex-1">Cancelar</button>
            <button 
              @click="guardarIngreso" 
              :disabled="!formIngreso || saving"
              class="btn btn-primary flex-1"
            >
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { incomesApi } from '../services/api'

const currentFiscalYear = new Date().getFullYear()
const loading = ref(true)
const saving = ref(false)
const ingresos = ref([])
const showModal = ref(false)
const editingMes = ref(null)
const formIngreso = ref(null)
const formNotas = ref('')

const nombresMeses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const mesesDelAno = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const numero = i + 1
    const ingreso = ingresos.value.find(ing => ing.month === numero)
    return {
      numero,
      nombre: nombresMeses[numero],
      ingreso
    }
  })
})

const totalAnual = computed(() => {
  return ingresos.value.reduce((sum, ing) => sum + (ing.amount || 0), 0)
})

const promedioMensual = computed(() => {
  if (ingresos.value.length === 0) return 0
  return totalAnual.value / ingresos.value.length
})

const mesesConIngreso = computed(() => {
  return ingresos.value.length
})

const mesesSobreMinimo = computed(() => {
  return ingresos.value.filter(ing => ing.amount > 3260).length
})

const superaMinimo = computed(() => {
  return mesesSobreMinimo.value > 0
})

const mesMaximo = computed(() => {
  if (ingresos.value.length === 0) return { amount: 0, nombre: '-' }
  const max = ingresos.value.reduce((prev, curr) => prev.amount > curr.amount ? prev : curr)
  return { amount: max.amount, nombre: nombresMeses[max.month] }
})

const mesMinimo = computed(() => {
  if (ingresos.value.length === 0) return { amount: 0, nombre: '-' }
  const min = ingresos.value.reduce((prev, curr) => prev.amount < curr.amount ? prev : curr)
  return { amount: min.amount, nombre: nombresMeses[min.month] }
})

const nombresMesesCortos = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function getAdjustedDueDay(year, monthIndex) {
  const d = new Date(year, monthIndex, 20)
  const dow = d.getDay()
  return dow === 0 ? 22 : dow === 6 ? 21 : 20
}

function getMonthlyDueDateObj(mesNumero) {
  const nextMonth = mesNumero === 12 ? 1 : mesNumero + 1
  const nextYear = mesNumero === 12 ? currentFiscalYear + 1 : currentFiscalYear
  const day = getAdjustedDueDay(nextYear, nextMonth - 1)
  return new Date(nextYear, nextMonth - 1, day)
}

function getQuarterlyDueDateObj(mesNumero) {
  const qEnd = mesNumero <= 3 ? 3 : mesNumero <= 6 ? 6 : mesNumero <= 9 ? 9 : 12
  const dueMonth = qEnd === 12 ? 1 : qEnd + 1
  const dueYear = qEnd === 12 ? currentFiscalYear + 1 : currentFiscalYear
  const day = getAdjustedDueDay(dueYear, dueMonth - 1)
  return new Date(dueYear, dueMonth - 1, day)
}

function formatDueDate(dateObj) {
  const day = dateObj.getDate()
  const m = dateObj.getMonth() + 1
  const y = dateObj.getFullYear()
  return `${day}/${nombresMesesCortos[m]}/${y.toString().slice(-2)}`
}

function countBusinessDays(from, to) {
  let count = 0
  const cursor = new Date(from)
  cursor.setDate(cursor.getDate() + 1)
  while (cursor <= to) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

function calcSurcharge(principal, dueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  if (today <= due) return null
  const lateDays = countBusinessDays(due, today)
  if (lateDays <= 0) return null
  let rate, amount, desc
  if (lateDays <= 30) {
    rate = 0.02
    amount = principal * rate
    desc = `${lateDays} días hábiles de mora - 2% del principal`
  } else if (lateDays <= 60) {
    rate = 0.05
    amount = principal * rate
    desc = `${lateDays} días hábiles de mora - 5% del principal`
  } else {
    rate = 0.001 * lateDays
    const maxRate = 0.40
    rate = Math.min(rate, maxRate)
    amount = principal * rate
    desc = `${lateDays} días hábiles de mora - 0.1%/día (${(rate * 100).toFixed(1)}%, tope 40%)`
  }
  return { lateDays, rate, amount: Math.round(amount * 100) / 100, desc }
}

const monthlyDueDate = computed(() => {
  if (!editingMes.value) return ''
  return formatDueDate(getMonthlyDueDateObj(editingMes.value.numero))
})

const quarterlyDueDate = computed(() => {
  if (!editingMes.value) return ''
  return formatDueDate(getQuarterlyDueDateObj(editingMes.value.numero))
})

const surchargeVentas = computed(() => {
  if (!editingMes.value || !formIngreso.value || formIngreso.value <= 0) return null
  const principal = formIngreso.value * 0.10
  return calcSurcharge(principal, getMonthlyDueDateObj(editingMes.value.numero))
})

const surchargeAporte = computed(() => {
  if (!editingMes.value || !formIngreso.value || formIngreso.value <= 3260) return null
  const principal = (formIngreso.value - 3260) * 0.05
  return calcSurcharge(principal, getMonthlyDueDateObj(editingMes.value.numero))
})

const totalSurcharge = computed(() => {
  return (surchargeVentas.value?.amount || 0) + (surchargeAporte.value?.amount || 0)
})

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

function getMonthClass(mes) {
  if (!mes.ingreso) {
    return 'bg-slate-800/30 border-slate-700/50 border-dashed'
  }
  if (mes.ingreso.amount > 3260) {
    return 'bg-orange-900/20 border-orange-700/50'
  }
  return 'bg-emerald-900/20 border-emerald-700/50'
}

function getBarHeight(amount) {
  if (!amount) return 10
  const maxHeight = 200 // pixels
  const max = Math.max(...ingresos.value.map(i => i.amount || 0), 3500) // Al menos 3500 para que se vea la línea del mínimo
  return Math.max(10, (amount / max) * maxHeight)
}

function editarMes(mes) {
  editingMes.value = mes
  // Usar amount (que ya fue mapeado de grossIncome) o grossIncome directamente
  formIngreso.value = mes.ingreso?.amount || mes.ingreso?.grossIncome || null
  formNotas.value = mes.ingreso?.notes || ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingMes.value = null
  formIngreso.value = null
  formNotas.value = ''
}

async function guardarIngreso() {
  if (!formIngreso.value || !editingMes.value) return
  
  saving.value = true
  try {
    await incomesApi.upsert({
      month: editingMes.value.numero,
      year: currentFiscalYear,
      grossIncome: formIngreso.value,
      notes: formNotas.value
    })
    await loadData()
    closeModal()
  } catch (error) {
    console.error('Error guardando ingreso:', error)
  } finally {
    saving.value = false
  }
}

async function eliminarIngreso() {
  if (!editingMes.value) return
  
  saving.value = true
  try {
    await incomesApi.delete(editingMes.value.numero, currentFiscalYear)
    await loadData()
    closeModal()
  } catch (error) {
    console.error('Error eliminando ingreso:', error)
  } finally {
    saving.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await incomesApi.getAll({ year: currentFiscalYear })
    // Mapear grossIncome a amount para compatibilidad con el resto del código
    ingresos.value = res.data.map(ing => ({
      ...ing,
      amount: ing.grossIncome || ing.amount || 0
    }))
  } catch (error) {
    console.error('Error loading incomes:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

