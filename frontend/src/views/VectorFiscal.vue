<template>
  <div class="space-y-6">
    <!-- Controls (hidden on print) -->
    <div class="flex items-center justify-between print:hidden">
      <div>
        <h2 class="text-2xl font-display font-bold text-white">Vector Fiscal</h2>
        <p class="text-slate-400 mt-1">Formato RC-04A con datos reales</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedYear" class="input w-28 text-sm py-2">
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
        </select>
        <button @click="printReport" class="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / PDF
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- RC-04A Document -->
    <div v-else-if="data" id="vector-fiscal-doc" class="rc04a">
      <!-- Header -->
      <div class="rc04a-header">
        <h1 class="rc04a-title">RC-04A Vector fiscal de persona natural</h1>
        <div class="rc04a-meta">
          <div class="rc04a-meta-row">
            <span><strong>NIT:</strong> {{ data.user.nit }}</span>
            <span><strong>Carné de identidad:</strong> {{ data.user.nit }}</span>
          </div>
          <div class="rc04a-meta-row">
            <span><strong>Nombre y apellidos:</strong> {{ data.user.name }}</span>
          </div>
          <div class="rc04a-meta-row">
            <span><strong>Año:</strong> {{ data.fiscalYear }}</span>
            <span class="rc04a-badge print:hidden">
              {{ data.totalPaid }}/{{ data.totalObligations }} pagados
            </span>
          </div>
        </div>
      </div>

      <!-- Table Title -->
      <div class="rc04a-section-title">
        Obligaciones tributarias en CUP (pesos cubanos)
      </div>

      <!-- RC-04A Table -->
      <div class="overflow-x-auto">
        <table class="rc04a-table">
          <thead>
            <tr>
              <th class="w-16 text-center">Pagado</th>
              <th class="w-20 text-center">Código<br>barras</th>
              <th class="w-28 text-right">Importe</th>
              <th class="w-20 text-center">Código<br>tributo</th>
              <th class="text-left">Período: Fecha límite de pago</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in data.obligations" :key="i" :class="rowClass(row)">
              <td class="text-center">
                <span v-if="row.paid" class="rc04a-check paid">&#10003;</span>
                <span v-else-if="row.overdue" class="rc04a-check overdue">!</span>
                <span v-else class="rc04a-check empty"></span>
              </td>
              <td class="text-center font-mono text-xs">{{ row.barcode }}</td>
              <td class="text-right font-mono">
                <template v-if="row.paidAmount">{{ formatAmount(row.paidAmount) }}</template>
                <template v-else-if="row.amount">{{ formatAmount(row.amount) }}</template>
              </td>
              <td class="text-center font-mono text-xs">{{ row.tributeCode }}</td>
              <td>{{ row.period }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Activities -->
      <div class="rc04a-footer-section">
        <div class="rc04a-section-subtitle">Tributos ({{ data.tributes.length }})</div>
        <ul class="rc04a-list">
          <li v-for="t in data.tributes" :key="t.code">
            <span class="font-mono">{{ t.code }}</span> - {{ t.description }}
          </li>
        </ul>
      </div>

      <!-- Summary (screen only) -->
      <div class="rc04a-summary print:hidden">
        <div class="rc04a-stat paid">
          <span class="rc04a-stat-num">{{ data.totalPaid }}</span>
          <span class="rc04a-stat-label">Pagados</span>
        </div>
        <div class="rc04a-stat pending">
          <span class="rc04a-stat-num">{{ data.totalPending }}</span>
          <span class="rc04a-stat-label">Pendientes</span>
        </div>
        <div class="rc04a-stat total">
          <span class="rc04a-stat-num">{{ data.totalObligations }}</span>
          <span class="rc04a-stat-label">Total</span>
        </div>
      </div>

      <!-- Print footer -->
      <div class="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
        <p>Generado por MiONAT &mdash; {{ currentDate }}</p>
        <p class="mt-1">Este documento es un resumen informativo basado en el Vector Fiscal RC-04A registrado en el sistema.</p>
      </div>
    </div>

    <!-- No data -->
    <div v-else class="text-center py-20">
      <p class="text-slate-400 text-lg">No hay obligaciones para el año {{ selectedYear }}</p>
      <p class="text-slate-500 text-sm mt-2">Sube tu Vector Fiscal RC-04A desde tu perfil</p>
      <router-link to="/profile" class="inline-block mt-4 btn bg-emerald-600 hover:bg-emerald-700 text-white">
        Ir a Perfil
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { obligationsApi } from '../services/api'

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const yearOptions = [currentYear - 1, currentYear, currentYear + 1]
const loading = ref(true)
const data = ref(null)

const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

function formatAmount(val) {
  if (!val && val !== 0) return ''
  return val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function rowClass(row) {
  if (row.paid) return 'rc04a-row-paid'
  if (row.overdue) return 'rc04a-row-overdue'
  return ''
}

function printReport() {
  window.print()
}

async function loadData() {
  loading.value = true
  try {
    const res = await obligationsApi.getVectorFiscal(selectedYear.value)
    data.value = res.data.totalObligations > 0 ? res.data : null
  } catch (error) {
    console.error('Error loading vector fiscal:', error)
    data.value = null
  } finally {
    loading.value = false
  }
}

watch(selectedYear, loadData)
onMounted(loadData)
</script>

<style scoped>
/* ===== SCREEN STYLES (dark theme) ===== */
.rc04a {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 1rem;
  padding: 2rem;
  font-family: 'Source Sans 3', 'Source Sans Pro', sans-serif;
}

.rc04a-header {
  border-bottom: 2px solid #334155;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

.rc04a-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.rc04a-meta {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.rc04a-meta strong {
  color: #cbd5e1;
}

.rc04a-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 0.25rem;
}

.rc04a-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.75rem;
  background: #065f4620;
  color: #34d399;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rc04a-section-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.rc04a-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.rc04a-table thead th {
  background: #1e293b;
  color: #94a3b8;
  font-weight: 600;
  padding: 0.625rem 0.5rem;
  border-bottom: 2px solid #334155;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rc04a-table tbody td {
  padding: 0.5rem;
  border-bottom: 1px solid #1e293b;
  color: #e2e8f0;
}

.rc04a-table tbody tr:hover {
  background: #1e293b40;
}

.rc04a-row-paid {
  background: #065f4610;
}

.rc04a-row-paid td {
  color: #a7f3d0;
}

.rc04a-row-overdue {
  background: #7f1d1d10;
}

.rc04a-row-overdue td {
  color: #fca5a5;
}

.rc04a-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 700;
}

.rc04a-check.paid {
  background: #065f46;
  color: #34d399;
}

.rc04a-check.overdue {
  background: #7f1d1d;
  color: #fca5a5;
}

.rc04a-check.empty {
  border: 1px solid #334155;
}

.rc04a-footer-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
}

.rc04a-section-subtitle {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.rc04a-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.rc04a-list li {
  padding: 0.25rem 0;
}

.rc04a-list li::before {
  content: '•';
  margin-right: 0.5rem;
  color: #475569;
}

.rc04a-list .font-mono {
  color: #cbd5e1;
}

.rc04a-summary {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
}

.rc04a-stat {
  flex: 1;
  text-align: center;
  padding: 1rem;
  border-radius: 0.75rem;
}

.rc04a-stat.paid { background: #065f4620; }
.rc04a-stat.pending { background: #78350f20; }
.rc04a-stat.total { background: #1e293b; }

.rc04a-stat-num {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  font-family: 'Playfair Display', serif;
}

.rc04a-stat.paid .rc04a-stat-num { color: #34d399; }
.rc04a-stat.pending .rc04a-stat-num { color: #fbbf24; }
.rc04a-stat.total .rc04a-stat-num { color: #e2e8f0; }

.rc04a-stat-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ===== PRINT STYLES ===== */
@media print {
  .rc04a {
    background: white !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    color: black !important;
  }

  .rc04a-header {
    border-bottom: 2px solid black !important;
  }

  .rc04a-title {
    color: black !important;
    font-size: 1rem;
  }

  .rc04a-meta, .rc04a-meta strong {
    color: #333 !important;
  }

  .rc04a-section-title {
    color: #333 !important;
  }

  .rc04a-table thead th {
    background: #f3f4f6 !important;
    color: #333 !important;
    border-bottom: 2px solid #333 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .rc04a-table tbody td {
    color: black !important;
    border-bottom: 1px solid #d1d5db !important;
    padding: 0.375rem 0.5rem;
  }

  .rc04a-row-paid {
    background: transparent !important;
  }
  .rc04a-row-paid td {
    color: black !important;
  }

  .rc04a-row-overdue {
    background: transparent !important;
  }
  .rc04a-row-overdue td {
    color: black !important;
  }

  .rc04a-check.paid {
    background: #16a34a !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .rc04a-check.overdue {
    background: #dc2626 !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .rc04a-check.empty {
    border: 1px solid #9ca3af !important;
  }

  .rc04a-footer-section {
    border-top: 1px solid #d1d5db !important;
  }

  .rc04a-section-subtitle,
  .rc04a-list,
  .rc04a-list li {
    color: #333 !important;
  }

  .rc04a-list .font-mono {
    color: black !important;
  }
}
</style>
