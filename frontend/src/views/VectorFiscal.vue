<template>
  <div class="space-y-6">
    <!-- Controls (hidden on print) -->
    <div class="flex items-center justify-between print:hidden">
      <div>
        <h2 class="text-2xl font-display font-bold text-white">Vector Fiscal</h2>
        <p class="text-slate-400 mt-1">Formato RC-04A oficial con datos reales</p>
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
    <div v-else-if="data" id="vector-fiscal-doc" class="vf-doc">
      <!-- Page 1: Header + Table -->
      <div class="vf-page">
        <h1 class="vf-title">RC-04A Vector fiscal de persona natural</h1>

        <div class="vf-header-grid">
          <div class="vf-row">
            <span><b>NIT:</b> {{ data.user.nit }}</span>
            <span><b>Carné de identidad:</b> {{ data.user.ci }}</span>
          </div>
          <div class="vf-row">
            <span><b>Nombre y apellidos:</b> {{ data.user.name }}</span>
          </div>
          <div class="vf-row" v-if="data.user.dpa">
            <span><b>DPA-Municipio:</b> {{ data.user.dpa }}</span>
          </div>
          <div class="vf-row">
            <span v-if="data.user.rc05"><b>Código de barras del RC-05 (DPA, NIT):</b> {{ data.user.rc05 }}</span>
            <span><b>Año:</b> {{ data.fiscalYear }}</span>
          </div>
        </div>

        <h2 class="vf-section-title">Obligaciones tributarias en CUP (pesos cubanos)</h2>

        <table class="vf-table">
          <thead>
            <tr>
              <th class="vf-th-pagado">Pagado</th>
              <th class="vf-th-barcode">Código<br>barras</th>
              <th class="vf-th-importe">Importe</th>
              <th class="vf-th-tributo">Código<br>tributo</th>
              <th class="vf-th-periodo">Período: Fecha límite de pago</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in data.obligations" :key="i" :class="rowClass(row)">
              <td class="vf-td-pagado">
                <span v-if="row.paid" class="vf-check">&#10003;</span>
                <span v-else-if="row.overdue" class="vf-overdue">!</span>
              </td>
              <td class="vf-td-barcode">{{ row.barcode }}</td>
              <td class="vf-td-importe">
                <template v-if="row.paidAmount">{{ fmtAmt(row.paidAmount) }}</template>
                <template v-else-if="row.amount">{{ fmtAmt(row.amount) }}</template>
              </td>
              <td class="vf-td-tributo">{{ row.tributeCode }}</td>
              <td class="vf-td-periodo">{{ row.period }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Activities -->
        <div class="vf-section" v-if="data.activities && data.activities.length">
          <p class="vf-label">Actividades({{ data.activities.length }})</p>
          <ul class="vf-list">
            <li v-for="a in data.activities" :key="a">* {{ a }}</li>
          </ul>
        </div>

        <!-- Tributes -->
        <div class="vf-section">
          <p class="vf-label">Tributos({{ data.tributes.length }})</p>
          <ul class="vf-list">
            <li v-for="t in data.tributes" :key="t.code">* {{ t.code }}-{{ t.description }}</li>
          </ul>
        </div>
      </div>

      <!-- Page 2: Tribute explanations -->
      <div class="vf-page vf-page-break">
        <div class="vf-notes">
          <p v-for="note in tributeNotes" :key="note.id" class="vf-note">
            <span v-if="note.bullet" class="vf-bullet">•</span>
            <span v-if="note.dash" class="vf-dash">-</span>
            <span v-html="note.text"></span>
          </p>
        </div>
      </div>

      <!-- Summary footer (screen only) -->
      <div class="vf-summary print:hidden">
        <div class="vf-stat vf-stat-paid">
          <span class="vf-stat-num">{{ data.totalPaid }}</span>
          <span class="vf-stat-label">Pagados</span>
        </div>
        <div class="vf-stat vf-stat-pending">
          <span class="vf-stat-num">{{ data.totalPending }}</span>
          <span class="vf-stat-label">Pendientes</span>
        </div>
        <div class="vf-stat vf-stat-total">
          <span class="vf-stat-num">{{ data.totalObligations }}</span>
          <span class="vf-stat-label">Total</span>
        </div>
        <div class="vf-stat vf-stat-amount" v-if="data.totalAmountPaid > 0">
          <span class="vf-stat-num">{{ fmtAmt(data.totalAmountPaid) }}</span>
          <span class="vf-stat-label">Total pagado (CUP)</span>
        </div>
        <div class="vf-stat vf-stat-bonus" v-if="data.totalBonusSaved > 0">
          <span class="vf-stat-num">{{ fmtAmt(data.totalBonusSaved) }}</span>
          <span class="vf-stat-label">Ahorro bonificaciones</span>
        </div>
      </div>

      <!-- Print footer -->
      <div class="hidden print:block mt-6 pt-3 border-t border-gray-300 text-xs text-gray-500">
        <p>Generado por MiONAT &mdash; {{ currentDate }}</p>
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
const yearOptions = [currentYear - 2, currentYear - 1, currentYear]
const loading = ref(true)
const data = ref(null)

const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
})

function fmtAmt(val) {
  if (!val && val !== 0) return ''
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function rowClass(row) {
  if (row.paid) return 'vf-row-paid'
  if (row.overdue) return 'vf-row-overdue'
  return ''
}

function printReport() {
  window.print()
}

const tributeNotes = [
  { id: 1, bullet: true, text: 'Todos los trabajadores por cuenta propia tributan bajo el Régimen General, por lo que presentan Declaración Jurada al cerrar el año.' },
  { id: 2, bullet: true, text: 'Debe registrar correctamente sus operaciones en los Registros de ingresos y gastos y están obligados a llevar contabilidad los que obtienen anualmente ingresos superiores a 500 000.00 CUP en el ejercicio de su actividad según lo establece la Resolución 272 del 2024 del Ministerio de Finanzas y Precios según las Normas Cubanas de Información Financiera.' },
  { id: 3, bullet: true, text: '<b>0114022:</b> Debe aportar mensualmente el 10% de los ingresos totales obtenidos por concepto de ventas y/o servicios en el mes, excepto los Agentes de Telecomunicaciones y de Seguros que no aportan el 10%. En el caso de los pescadores comerciales solo aportan el 10% de las ventas por la comercialización liberada de sus capturas.' },
  { id: 4, bullet: true, text: '<b>0510122:</b> Debe aportar mensualmente el 5% de los ingresos totales obtenidos en el mes, después de descontarse 3 260.00 CUP que es el mínimo exento mensual. Los pescadores comerciales aportan el 5% por la comercialización liberada de sus capturas, después de descontarse los 3 260.00 CUP.' },
  { id: 5, bullet: true, text: '<b>0530222:</b> Presenta Declaración Jurada del impuesto sobre Ingresos personales. Paga el importe calculado en su Declaración Jurada, donde se descuenta:' },
  { id: 6, dash: true, text: 'Un mínimo exento anual 39,120.00 pesos del total de los ingresos obtenidos.' },
  { id: 7, dash: true, text: 'El 100% de sus gastos, siempre que justifique documentalmente el 80% de los mismos. Todos los gastos deben estar registrados. Se permite deducir hasta un 20% de los gastos aunque no cuenten con comprobantes, y además se podrán sumar todos aquellos que sí estén respaldados con evidencia documental.' },
  { id: 8, dash: true, text: 'Se le concede una bonificación del 5% del importe a pagar, si declara y paga en o antes del 28 de febrero.' },
  { id: 9, bullet: true, text: '<b>0820132:</b> Contribución especial de los trabajadores a la seguridad social. Paga trimestralmente el 20% de la base de contribución seleccionada en su afiliación.' },
  { id: 10, text: '<b>Información sobre sus deberes formales, beneficios fiscales, responsabilidades tributarias, así como los servicios y facilidades que le ofrece la ONAT.</b>' },
  { id: 11, dash: true, text: 'Consulte siempre su vector fiscal. En él está la información básica que usted necesita conocer para cumplir correctamente con sus obligaciones tributarias. Puede descargarlo registrándose en el portal tributario www.onat.gob.cu.' },
  { id: 12, dash: true, text: 'La identificación fiscal (RC-05) es el número de 16 dígitos que está sobre la tabla de obligaciones de este documento.' },
  { id: 13, dash: true, text: 'El RC-04A es el código de 5 dígitos que está en la segunda columna de la tabla de su vector fiscal. Para pagar por canales digitales por la opción "Pago mediante vector fiscal (RC-04A)", debe buscar este código en la 2da columna y además la fila correspondiente al tributo y mes que desea pagar.' },
  { id: 14, dash: true, text: 'En el vector fiscal tiene la fecha límite de pago de cada tributo.' },
  { id: 15, dash: true, text: 'Si aporta sus tributos después de la fecha límite de pago, deberá hacerlo con un recargo por mora, según lo establecido en la legislación tributaria.' },
  { id: 16, text: '<b>Recargo por mora:</b> Código de tributo 1060122' },
  { id: 17, text: '&nbsp;&nbsp;* Hasta 30 días hábiles: 2% del principal adeudado' },
  { id: 18, text: '&nbsp;&nbsp;* Más de 30 y hasta 60 días hábiles: 5% del principal adeudado' },
  { id: 19, text: '&nbsp;&nbsp;* Más de 60 días hábiles: 0.1% por cada día de mora y hasta el 40% del principal' },
  { id: 20, dash: true, text: 'Si utiliza los canales electrónicos de pago se beneficia con un descuento del 3% del importe a pagar.' },
  { id: 21, dash: true, text: 'Los trabajadores por cuenta propia, artistas y su personal de apoyo, comunicadores sociales y diseñadores, así como los usufructuarios, propietarios de tierra y otros productores individuales del sector agropecuario están obligados a abrir y operar una cuenta bancaria fiscal.' },
  { id: 22, dash: true, text: 'Los afiliados a la Contribución a la Seguridad Social pueden modificar la base de contribución seleccionada en el INASS, dentro del último trimestre del año natural, para comenzar a contribuir con la nueva base a partir del mes de enero del próximo año.' }
]

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
/* ===== DOCUMENT CONTAINER ===== */
.vf-doc {
  font-family: 'Segoe UI', 'Liberation Sans', Arial, sans-serif;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 2rem;
}

.vf-page {
  max-width: 800px;
  margin: 0 auto;
}

.vf-page-break {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #334155;
}

/* ===== HEADER ===== */
.vf-title {
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #334155;
  color: #f1f5f9;
}

.vf-header-grid {
  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
}

.vf-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.2rem;
  color: #94a3b8;
}

.vf-row b {
  color: #cbd5e1;
}

/* ===== TABLE ===== */
.vf-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.vf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  border: 1px solid #334155;
}

.vf-table thead th {
  background: #1e293b;
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 0.5rem 0.4rem;
  border: 1px solid #334155;
  text-align: center;
  vertical-align: bottom;
}

.vf-th-pagado { width: 3.5rem; }
.vf-th-barcode { width: 4rem; }
.vf-th-importe { width: 5.5rem; text-align: right !important; }
.vf-th-tributo { width: 4.5rem; }
.vf-th-periodo { text-align: left !important; }

.vf-table tbody td {
  padding: 0.3rem 0.4rem;
  border: 1px solid #1e293b;
  color: #e2e8f0;
}

.vf-table tbody tr:hover {
  background: #1e293b40;
}

.vf-td-pagado { text-align: center; width: 3.5rem; }
.vf-td-barcode { text-align: center; font-family: monospace; font-size: 0.75rem; }
.vf-td-importe { text-align: right; font-family: monospace; }
.vf-td-tributo { text-align: center; font-family: monospace; font-size: 0.75rem; }
.vf-td-periodo { text-align: left; }

.vf-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: #065f46;
  color: #34d399;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 700;
}

.vf-overdue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: #7f1d1d;
  color: #fca5a5;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 700;
}

.vf-row-paid { background: #065f460d; }
.vf-row-paid td { color: #a7f3d0; }
.vf-row-overdue { background: #7f1d1d0d; }
.vf-row-overdue td { color: #fca5a5; }

/* ===== SECTIONS ===== */
.vf-section {
  margin-top: 1rem;
}

.vf-label {
  font-weight: 700;
  font-size: 0.8125rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.vf-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8125rem;
  color: #cbd5e1;
}

.vf-list li {
  padding: 0.1rem 0 0.1rem 0.5rem;
}

/* ===== NOTES (page 2-3) ===== */
.vf-notes {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.5;
}

.vf-note {
  margin-bottom: 0.5rem;
}

.vf-bullet {
  margin-right: 0.4rem;
  color: #64748b;
  font-weight: 700;
}

.vf-dash {
  margin-right: 0.4rem;
  color: #64748b;
}

.vf-note b {
  color: #cbd5e1;
}

/* ===== SUMMARY (screen) ===== */
.vf-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
}

.vf-stat {
  flex: 1;
  min-width: 7rem;
  text-align: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.vf-stat-paid { background: #065f4620; }
.vf-stat-pending { background: #78350f20; }
.vf-stat-total { background: #1e293b; }
.vf-stat-amount { background: #1e3a5f20; }
.vf-stat-bonus { background: #3b0f6020; }

.vf-stat-num {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
}

.vf-stat-paid .vf-stat-num { color: #34d399; }
.vf-stat-pending .vf-stat-num { color: #fbbf24; }
.vf-stat-total .vf-stat-num { color: #e2e8f0; }
.vf-stat-amount .vf-stat-num { color: #60a5fa; font-size: 1.1rem; }
.vf-stat-bonus .vf-stat-num { color: #c084fc; font-size: 1.1rem; }

.vf-stat-label {
  display: block;
  font-size: 0.65rem;
  color: #64748b;
  margin-top: 0.15rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ===== PRINT STYLES ===== */
@media print {
  .vf-doc {
    background: white !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    color: black !important;
    font-size: 10pt;
  }

  .vf-title {
    color: black !important;
    border-bottom-color: black !important;
    font-size: 13pt;
  }

  .vf-row, .vf-row b {
    color: #333 !important;
  }

  .vf-section-title {
    color: #333 !important;
  }

  .vf-table {
    border-color: #999 !important;
  }

  .vf-table thead th {
    background: #f0f0f0 !important;
    color: #333 !important;
    border-color: #999 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .vf-table tbody td {
    color: black !important;
    border-color: #ccc !important;
    padding: 2pt 4pt;
  }

  .vf-row-paid { background: transparent !important; }
  .vf-row-paid td { color: black !important; }
  .vf-row-overdue { background: transparent !important; }
  .vf-row-overdue td { color: black !important; }

  .vf-check {
    background: #16a34a !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .vf-overdue {
    background: #dc2626 !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .vf-label, .vf-list, .vf-list li {
    color: #333 !important;
  }

  .vf-notes, .vf-note, .vf-note b, .vf-bullet, .vf-dash {
    color: #333 !important;
  }

  .vf-page-break {
    page-break-before: always;
    border-top: none !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  .vf-section {
    color: #333 !important;
  }
}
</style>
