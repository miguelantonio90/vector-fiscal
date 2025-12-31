<template>
  <div class="space-y-8">
    <!-- Header with Actions -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
      <div>
        <h2 class="text-2xl font-display font-bold text-white">Reportes Fiscales</h2>
        <p class="text-slate-400 mt-1">Resumen de tu situación tributaria</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedYear" class="input w-32 text-sm py-2">
          <option :value="2025">2025</option>
          <option :value="2026">2026</option>
        </select>
        <button @click="printReport" class="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / PDF
        </button>
      </div>
    </div>

    <!-- Summary Cards (Screen Only) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
      <div class="card bg-gradient-to-br from-onat-red/20 to-slate-800/50 border-onat-red/30">
        <p class="text-slate-400 text-sm">Total Obligaciones</p>
        <p class="text-3xl font-display font-bold text-white mt-2">
          {{ formatCurrency(obligationsSummary.totalAmount) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">{{ obligationsSummary.total }} obligaciones</p>
      </div>
      
      <div class="card bg-gradient-to-br from-emerald-500/20 to-slate-800/50 border-emerald-500/30">
        <p class="text-slate-400 text-sm">Total Pagado</p>
        <p class="text-3xl font-display font-bold text-emerald-400 mt-2">
          {{ formatCurrency(paymentsSummary.totalPaid) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">{{ paymentsSummary.totalPayments }} pagos</p>
      </div>
      
      <div class="card bg-gradient-to-br from-blue-500/20 to-slate-800/50 border-blue-500/30">
        <p class="text-slate-400 text-sm">Ahorro Bonificaciones</p>
        <p class="text-3xl font-display font-bold text-blue-400 mt-2">
          {{ formatCurrency(paymentsSummary.totalBonus) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">Por pagos anticipados</p>
      </div>
      
      <div class="card bg-gradient-to-br from-amber-500/20 to-slate-800/50 border-amber-500/30">
        <p class="text-slate-400 text-sm">Pendiente por Pagar</p>
        <p class="text-3xl font-display font-bold text-amber-400 mt-2">
          {{ formatCurrency(pendingAmount) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">{{ obligationsSummary.pending }} pendientes</p>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- PRINTABLE REPORT SECTION -->
    <!-- ============================================== -->
    <div id="printable-report" class="print:block">
      <!-- Print Header (Only visible when printing) -->
      <div class="hidden print:block mb-8 border-b-2 border-black pb-4">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold text-black">REPORTE FISCAL {{ selectedYear }}</h1>
            <p class="text-gray-600 text-sm mt-1">Sistema de Gestión de Obligaciones Tributarias ONAT</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-black">Miguel Antonio</p>
            <p class="text-sm text-gray-600">NIT: 90121542264</p>
            <p class="text-sm text-gray-500">Generado: {{ currentDate }}</p>
          </div>
        </div>
      </div>

      <!-- Print Summary Table -->
      <div class="hidden print:block mb-6">
        <h2 class="text-lg font-bold text-black mb-3 border-b border-gray-300 pb-2">RESUMEN GENERAL</h2>
        <table class="w-full border-collapse text-sm">
          <tbody>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-medium text-gray-700">Total Obligaciones {{ selectedYear }}</td>
              <td class="py-2 text-right font-bold">{{ formatCurrencyPrint(obligationsSummary.totalAmount) }}</td>
              <td class="py-2 pl-8 font-medium text-gray-700">Obligaciones Totales</td>
              <td class="py-2 text-right">{{ obligationsSummary.total }}</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-medium text-gray-700">Total Pagado</td>
              <td class="py-2 text-right font-bold text-green-700">{{ formatCurrencyPrint(paymentsSummary.totalPaid) }}</td>
              <td class="py-2 pl-8 font-medium text-gray-700">Pagos Realizados</td>
              <td class="py-2 text-right">{{ paymentsSummary.totalPayments }}</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-medium text-gray-700">Pendiente por Pagar</td>
              <td class="py-2 text-right font-bold text-amber-700">{{ formatCurrencyPrint(pendingAmount) }}</td>
              <td class="py-2 pl-8 font-medium text-gray-700">Obligaciones Pendientes</td>
              <td class="py-2 text-right">{{ obligationsSummary.pending }}</td>
            </tr>
            <tr>
              <td class="py-2 font-medium text-gray-700">Ahorro por Bonificaciones</td>
              <td class="py-2 text-right font-bold text-blue-700">{{ formatCurrencyPrint(paymentsSummary.totalBonus) }}</td>
              <td class="py-2 pl-8 font-medium text-gray-700">Porcentaje Completado</td>
              <td class="py-2 text-right font-bold">{{ paidPercentage.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Payments Detail Table -->
      <div class="card print:shadow-none print:border print:border-gray-300 print:rounded-none print:bg-white">
        <h3 class="text-lg font-display font-bold text-white print:text-black mb-4 print:border-b print:border-gray-300 print:pb-2">
          DETALLE DE PAGOS REALIZADOS
        </h3>
        
        <div v-if="loading" class="flex items-center justify-center py-12 print:hidden">
          <div class="w-8 h-8 border-2 border-onat-red border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-700/50 print:border-gray-300">
                <th class="py-3 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Fecha</th>
                <th class="py-3 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Obligación</th>
                <th class="py-3 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Período</th>
                <th class="py-3 px-2 text-center text-slate-400 print:text-gray-600 font-medium">Método</th>
                <th class="py-3 px-2 text-right text-slate-400 print:text-gray-600 font-medium">Bonif.</th>
                <th class="py-3 px-2 text-right text-slate-400 print:text-gray-600 font-medium">Monto</th>
                <th class="py-3 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="payment in allPayments" 
                :key="payment._id"
                class="border-b border-slate-700/30 print:border-gray-200"
              >
                <td class="py-2 px-2 text-white print:text-black">{{ formatDateShort(payment.paymentDate) }}</td>
                <td class="py-2 px-2 text-white print:text-black">{{ payment.obligation?.description || 'N/A' }}</td>
                <td class="py-2 px-2 text-slate-400 print:text-gray-600 text-xs">{{ payment.obligation?.period }}</td>
                <td class="py-2 px-2 text-center">
                  <span class="text-xs px-2 py-1 rounded print:border print:border-gray-300" :class="getMethodClassPrint(payment.paymentMethod)">
                    {{ getMethodLabel(payment.paymentMethod) }}
                  </span>
                </td>
                <td class="py-2 px-2 text-right text-emerald-400 print:text-green-700">
                  {{ payment.bonusApplied > 0 ? `-${Math.round(payment.bonusApplied)}%` : '-' }}
                </td>
                <td class="py-2 px-2 text-right font-mono text-white print:text-black font-medium">
                  {{ formatCurrencyPrint(payment.amount) }}
                </td>
                <td class="py-2 px-2 text-slate-500 print:text-gray-500 text-xs">{{ payment.reference || '-' }}</td>
              </tr>
              <tr v-if="allPayments.length === 0">
                <td colspan="7" class="py-8 text-center text-slate-400 print:text-gray-500">
                  No hay pagos registrados
                </td>
              </tr>
            </tbody>
            <tfoot v-if="allPayments.length > 0">
              <tr class="bg-slate-800/50 print:bg-gray-100 font-bold">
                <td colspan="4" class="py-3 px-2 text-white print:text-black">TOTAL</td>
                <td class="py-3 px-2 text-right text-emerald-400 print:text-green-700">
                  {{ formatCurrencyPrint(paymentsSummary.totalBonus) }}
                </td>
                <td class="py-3 px-2 text-right font-mono text-white print:text-black text-lg">
                  {{ formatCurrencyPrint(paymentsSummary.totalPaid) }}
                </td>
                <td class="py-3 px-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Pending Obligations Table -->
      <div class="card print:shadow-none print:border print:border-gray-300 print:rounded-none print:bg-white mt-6 print:mt-4 print:break-inside-avoid">
        <h3 class="text-lg font-display font-bold text-white print:text-black mb-4 print:border-b print:border-gray-300 print:pb-2">
          OBLIGACIONES PENDIENTES
        </h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-700/50 print:border-gray-300">
                <th class="py-3 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Código</th>
                <th class="py-3 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Descripción</th>
                <th class="py-3 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Período</th>
                <th class="py-3 px-2 text-center text-slate-400 print:text-gray-600 font-medium">Vencimiento</th>
                <th class="py-3 px-2 text-right text-slate-400 print:text-gray-600 font-medium">Monto Est.</th>
                <th class="py-3 px-2 text-center text-slate-400 print:text-gray-600 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="obligation in pendingObligations" 
                :key="obligation._id"
                class="border-b border-slate-700/30 print:border-gray-200"
              >
                <td class="py-2 px-2 font-mono text-slate-400 print:text-gray-600">{{ obligation.tributeCode }}</td>
                <td class="py-2 px-2 text-white print:text-black">{{ obligation.description }}</td>
                <td class="py-2 px-2 text-slate-400 print:text-gray-600 text-xs">{{ obligation.period }}</td>
                <td class="py-2 px-2 text-center text-white print:text-black">{{ formatDateShort(obligation.dueDate) }}</td>
                <td class="py-2 px-2 text-right font-mono text-amber-400 print:text-amber-700">
                  {{ formatCurrencyPrint(getObligationAmount(obligation)) }}
                  <span v-if="!obligation.amount && obligation.tributeCode === '0114022'" class="text-xs text-slate-500">*</span>
                </td>
                <td class="py-2 px-2 text-center">
                  <span 
                    class="text-xs px-2 py-1 rounded"
                    :class="getDaysUntilDue(obligation) <= 7 ? 'bg-amber-500/20 text-amber-400 print:bg-amber-100 print:text-amber-700' : 'bg-slate-600/50 text-slate-300 print:bg-gray-100 print:text-gray-700'"
                  >
                    {{ getDaysText(obligation) }}
                  </span>
                </td>
              </tr>
              <tr v-if="pendingObligations.length === 0">
                <td colspan="6" class="py-8 text-center text-emerald-400 print:text-green-700">
                  ✓ Todas las obligaciones están al día
                </td>
              </tr>
            </tbody>
            <tfoot v-if="pendingObligations.length > 0">
              <tr class="bg-slate-800/50 print:bg-gray-100 font-bold">
                <td colspan="4" class="py-3 px-2 text-white print:text-black">TOTAL PENDIENTE</td>
                <td class="py-3 px-2 text-right font-mono text-amber-400 print:text-amber-700 text-lg">
                  {{ formatCurrencyPrint(pendingAmount) }}
                </td>
                <td class="py-3 px-2"></td>
              </tr>
            </tfoot>
          </table>
          <p v-if="pendingObligations.some(o => !o.amount && o.tributeCode === '0114022')" class="text-xs text-slate-500 print:text-gray-500 mt-2">
            * Monto estimado basado en el promedio de pagos mensuales anteriores
          </p>
        </div>
      </div>

      <!-- Declaración Jurada Anual (DJ-08) -->
      <div v-if="declaration" class="card print:shadow-none print:border print:border-gray-300 print:rounded-none print:bg-white mt-6 print:mt-4 print:break-before-page">
        <h3 class="text-lg font-display font-bold text-white print:text-black mb-4 print:border-b print:border-gray-300 print:pb-2 flex items-center gap-2">
          <span class="text-xl print:hidden">📋</span>
          DECLARACIÓN JURADA ANUAL (DJ-08) - {{ selectedYear }}
        </h3>
        
        <!-- Status Banner -->
        <div 
          class="rounded-lg p-4 mb-4 print:border print:rounded-none"
          :class="{
            'bg-emerald-500/10 border border-emerald-500/30 print:bg-green-50 print:border-green-300': declaration.result.status === 'SALDADO',
            'bg-amber-500/10 border border-amber-500/30 print:bg-amber-50 print:border-amber-300': declaration.result.status === 'A FAVOR',
            'bg-red-500/10 border border-red-500/30 print:bg-red-50 print:border-red-300': declaration.result.status === 'A PAGAR'
          }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl print:hidden">
                {{ declaration.result.status === 'SALDADO' ? '✅' : declaration.result.status === 'A FAVOR' ? '🎉' : '⚠️' }}
              </span>
              <div>
                <p class="font-bold text-lg" :class="{
                  'text-emerald-400 print:text-green-700': declaration.result.status === 'SALDADO',
                  'text-amber-400 print:text-amber-700': declaration.result.status === 'A FAVOR',
                  'text-red-400 print:text-red-700': declaration.result.status === 'A PAGAR'
                }">
                  {{ declaration.result.status === 'SALDADO' ? 'SIN DEUDAS' : declaration.result.status }}
                </p>
                <p class="text-sm text-slate-400 print:text-gray-600">{{ declaration.result.message }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-400 print:text-gray-500">Fecha límite</p>
              <p class="font-mono font-semibold text-white print:text-black">{{ declaration.status.deadline }}</p>
            </div>
          </div>
        </div>

        <!-- DJ Summary Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:grid-cols-4">
          <div class="p-3 bg-slate-700/30 rounded-lg print:bg-gray-50 print:border print:border-gray-200 text-center">
            <p class="text-xs text-slate-400 print:text-gray-500">Ingresos Anuales</p>
            <p class="text-lg font-bold text-white print:text-black font-mono">{{ formatCurrencyPrint(declaration.incomes.total) }}</p>
          </div>
          <div class="p-3 bg-slate-700/30 rounded-lg print:bg-gray-50 print:border print:border-gray-200 text-center">
            <p class="text-xs text-slate-400 print:text-gray-500">Base Imponible</p>
            <p class="text-lg font-bold text-white print:text-black font-mono">{{ formatCurrencyPrint(declaration.calculation.taxableBase) }}</p>
          </div>
          <div class="p-3 bg-slate-700/30 rounded-lg print:bg-gray-50 print:border print:border-gray-200 text-center">
            <p class="text-xs text-slate-400 print:text-gray-500">Impuesto Anual</p>
            <p class="text-lg font-bold text-white print:text-black font-mono">{{ formatCurrencyPrint(declaration.calculation.grossTax) }}</p>
          </div>
          <div class="p-3 bg-slate-700/30 rounded-lg print:bg-gray-50 print:border print:border-gray-200 text-center">
            <p class="text-xs text-slate-400 print:text-gray-500">Aportes Pagados</p>
            <p class="text-lg font-bold text-emerald-400 print:text-green-700 font-mono">{{ formatCurrencyPrint(declaration.result.advancesPaid) }}</p>
          </div>
        </div>

        <!-- Ingresos por Mes -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-slate-300 print:text-gray-700 mb-3">Ingresos Mensuales</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700/50 print:border-gray-300">
                  <th v-for="month in declaration.incomes.monthly" :key="month.month" class="py-2 px-1 text-center text-slate-400 print:text-gray-600 font-medium text-xs">
                    {{ month.monthName.slice(0, 3) }}
                  </th>
                  <th class="py-2 px-2 text-center text-slate-400 print:text-gray-600 font-medium text-xs bg-slate-700/30 print:bg-gray-100">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="month in declaration.incomes.monthly" :key="month.month" class="py-2 px-1 text-center font-mono text-xs" :class="month.hasData ? 'text-emerald-400 print:text-green-700' : 'text-slate-500 print:text-gray-400'">
                    {{ month.hasData ? formatCurrencyPrint(month.amount) : '-' }}
                  </td>
                  <td class="py-2 px-2 text-center font-mono text-sm font-bold text-white print:text-black bg-slate-700/30 print:bg-gray-100">
                    {{ formatCurrencyPrint(declaration.incomes.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cálculo del Impuesto -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
          <div>
            <h4 class="text-sm font-semibold text-slate-300 print:text-gray-700 mb-3">Cálculo del Impuesto</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1">
                <span class="text-slate-400 print:text-gray-600">Ingresos Brutos</span>
                <span class="font-mono text-white print:text-black">{{ formatCurrencyPrint(declaration.incomes.total) }}</span>
              </div>
              <div class="flex justify-between py-1 text-red-400 print:text-red-600">
                <span>(-) Mínimo Exento</span>
                <span class="font-mono">{{ formatCurrencyPrint(declaration.deductions.minimumExempt) }}</span>
              </div>
              <div class="flex justify-between py-1 text-red-400 print:text-red-600">
                <span>(-) Gastos Deducibles (40%)</span>
                <span class="font-mono">{{ formatCurrencyPrint(declaration.deductions.estimatedExpenses) }}</span>
              </div>
              <div class="border-t border-slate-700/50 print:border-gray-300 pt-2 flex justify-between font-semibold">
                <span class="text-white print:text-black">Base Imponible</span>
                <span class="font-mono text-white print:text-black">{{ formatCurrencyPrint(declaration.calculation.taxableBase) }}</span>
              </div>
              <div class="flex justify-between py-1 mt-2 p-2 bg-slate-700/30 print:bg-gray-100 rounded">
                <span class="text-slate-300 print:text-gray-700">Impuesto Bruto</span>
                <span class="font-mono font-bold text-white print:text-black">{{ formatCurrencyPrint(declaration.calculation.grossTax) }}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-slate-300 print:text-gray-700 mb-3">Resultado de la Declaración</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1">
                <span class="text-slate-400 print:text-gray-600">Impuesto Anual a Pagar</span>
                <span class="font-mono text-white print:text-black">{{ formatCurrencyPrint(declaration.result.annualTaxDue) }}</span>
              </div>
              <div class="flex justify-between py-1 text-emerald-400 print:text-green-600">
                <span>(-) Aportes a Cuenta Pagados</span>
                <span class="font-mono">{{ formatCurrencyPrint(declaration.result.advancesPaid) }}</span>
              </div>
              <div class="border-t border-slate-700/50 print:border-gray-300 pt-2">
                <div 
                  class="p-3 rounded-lg print:rounded-none print:border"
                  :class="{
                    'bg-emerald-500/20 print:bg-green-50 print:border-green-300': declaration.result.status === 'SALDADO',
                    'bg-amber-500/20 print:bg-amber-50 print:border-amber-300': declaration.result.status === 'A FAVOR',
                    'bg-red-500/20 print:bg-red-50 print:border-red-300': declaration.result.status === 'A PAGAR'
                  }"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-semibold text-white print:text-black">DEUDA PENDIENTE</span>
                    <div class="text-right">
                      <span 
                        class="font-mono font-bold text-xl"
                        :class="{
                          'text-emerald-400 print:text-green-700': declaration.result.status === 'SALDADO',
                          'text-amber-400 print:text-amber-700': declaration.result.status === 'A FAVOR',
                          'text-red-400 print:text-red-700': declaration.result.status === 'A PAGAR'
                        }"
                      >
                        {{ declaration.result.hasToPay ? formatCurrencyPrint(declaration.result.balance) : declaration.result.hasRefund ? '+' + formatCurrencyPrint(declaration.result.balance) : '$0.00 CUP' }}
                      </span>
                      <p class="text-xs font-medium mt-1" :class="{
                        'text-emerald-400 print:text-green-600': declaration.result.status === 'SALDADO',
                        'text-amber-400 print:text-amber-600': declaration.result.status === 'A FAVOR',
                        'text-red-400 print:text-red-600': declaration.result.status === 'A PAGAR'
                      }">
                        {{ declaration.result.status === 'SALDADO' ? '¡SIN DEUDAS!' : declaration.result.status === 'A FAVOR' ? 'SALDO A TU FAVOR' : 'PENDIENTE DE PAGO' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagos a Cuenta Realizados -->
        <div class="mt-6">
          <h4 class="text-sm font-semibold text-slate-300 print:text-gray-700 mb-3">Pagos a Cuenta Realizados</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700/50 print:border-gray-300">
                  <th class="py-2 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Concepto</th>
                  <th class="py-2 px-2 text-left text-slate-400 print:text-gray-600 font-medium">Código</th>
                  <th class="py-2 px-2 text-left text-slate-400 print:text-gray-600 font-medium text-xs">Nota</th>
                  <th class="py-2 px-2 text-right text-slate-400 print:text-gray-600 font-medium">Monto Pagado</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-700/30 print:border-gray-200">
                  <td class="py-2 px-2 text-white print:text-black">Impuesto s/ Ventas</td>
                  <td class="py-2 px-2 font-mono text-slate-400 print:text-gray-600">0114022</td>
                  <td class="py-2 px-2 text-xs text-slate-500 print:text-gray-500">No se descuenta de la DJ</td>
                  <td class="py-2 px-2 text-right font-mono text-slate-400 print:text-gray-600">{{ formatCurrencyPrint(declaration.paymentsOnAccount.salesTax.paid) }}</td>
                </tr>
                <tr class="border-b border-slate-700/30 print:border-gray-200 bg-emerald-500/10 print:bg-green-50">
                  <td class="py-2 px-2 text-white print:text-black">Aportes a cuenta</td>
                  <td class="py-2 px-2 font-mono text-slate-400 print:text-gray-600">0510122</td>
                  <td class="py-2 px-2 text-xs text-emerald-400 print:text-green-600">Se descuenta del impuesto anual</td>
                  <td class="py-2 px-2 text-right font-mono font-bold text-emerald-400 print:text-green-700">{{ formatCurrencyPrint(declaration.paymentsOnAccount.incomeAdvance.paid) }}</td>
                </tr>
                <tr class="border-b border-slate-700/30 print:border-gray-200">
                  <td class="py-2 px-2 text-white print:text-black">Pagos trimestrales</td>
                  <td class="py-2 px-2 font-mono text-slate-400 print:text-gray-600">0820132</td>
                  <td class="py-2 px-2 text-xs text-slate-500 print:text-gray-500">Obligación separada</td>
                  <td class="py-2 px-2 text-right font-mono text-slate-400 print:text-gray-600">{{ formatCurrencyPrint(declaration.paymentsOnAccount.quarterly.paid) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-slate-800/50 print:bg-gray-100 font-bold">
                  <td colspan="3" class="py-3 px-2 text-white print:text-black">TOTAL PAGOS</td>
                  <td class="py-3 px-2 text-right font-mono text-white print:text-black">
                    {{ formatCurrencyPrint(declaration.paymentsOnAccount.salesTax.paid + declaration.paymentsOnAccount.incomeAdvance.paid + declaration.paymentsOnAccount.quarterly.paid) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Print Footer -->
      <div class="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
        <div class="flex justify-between">
          <p>MiONAT - Sistema de Gestión ONAT {{ selectedYear }}</p>
          <p>Página 1 de 1</p>
        </div>
        <p class="mt-1">Este documento es un resumen informativo de las obligaciones tributarias registradas en el sistema.</p>
      </div>
    </div>

    <!-- Charts Row (Screen Only) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
      <!-- Obligations Status -->
      <div class="card">
        <h3 class="text-lg font-display font-bold text-white mb-6">Estado de Obligaciones</h3>
        
        <div class="flex items-center justify-center gap-8">
          <!-- Donut Chart Simulation -->
          <div class="relative w-48 h-48">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <!-- Background circle -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" stroke-width="12"/>
              
              <!-- Paid segment -->
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="#10b981" 
                stroke-width="12"
                :stroke-dasharray="`${paidPercentage * 2.51} 251`"
                stroke-linecap="round"
              />
              
              <!-- Pending segment -->
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="#f59e0b" 
                stroke-width="12"
                :stroke-dasharray="`${pendingPercentage * 2.51} 251`"
                :stroke-dashoffset="`${-paidPercentage * 2.51}`"
                stroke-linecap="round"
              />
              
              <!-- Overdue segment -->
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="#ef4444" 
                stroke-width="12"
                :stroke-dasharray="`${overduePercentage * 2.51} 251`"
                :stroke-dashoffset="`${-(paidPercentage + pendingPercentage) * 2.51}`"
                stroke-linecap="round"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-display font-bold text-white">{{ obligationsSummary.total }}</span>
              <span class="text-xs text-slate-400">Total</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded bg-emerald-500"></div>
              <div>
                <p class="text-white font-medium">{{ obligationsSummary.paid }} Pagados</p>
                <p class="text-xs text-slate-400">{{ paidPercentage.toFixed(1) }}%</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded bg-amber-500"></div>
              <div>
                <p class="text-white font-medium">{{ obligationsSummary.pending }} Pendientes</p>
                <p class="text-xs text-slate-400">{{ pendingPercentage.toFixed(1) }}%</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded bg-red-500"></div>
              <div>
                <p class="text-white font-medium">{{ obligationsSummary.overdue }} Vencidos</p>
                <p class="text-xs text-slate-400">{{ overduePercentage.toFixed(1) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payments by Month -->
      <div class="card">
        <h3 class="text-lg font-display font-bold text-white mb-6">Pagos por Mes</h3>
        
        <div class="space-y-3">
          <div 
            v-for="month in monthlyPayments" 
            :key="month.month"
            class="flex items-center gap-4"
          >
            <span class="text-sm text-slate-400 w-12">{{ getMonthName(month.month) }}</span>
            <div class="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-onat-red to-onat-accent rounded-full transition-all duration-500"
                :style="{ width: `${(month.total / maxMonthlyPayment) * 100}%` }"
              ></div>
            </div>
            <span class="text-sm font-mono text-white w-24 text-right">
              {{ formatCurrency(month.total) }}
            </span>
          </div>
          
          <div v-if="monthlyPayments.length === 0" class="text-center py-8">
            <p class="text-slate-400">No hay datos de pagos</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Payments by Method (Screen Only) -->
    <div class="card print:hidden">
      <h3 class="text-lg font-display font-bold text-white mb-6">Pagos por Método</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          v-for="method in paymentsByMethod" 
          :key="method._id"
          class="p-4 bg-slate-900/50 rounded-lg text-center"
        >
          <div 
            class="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3"
            :class="getMethodBg(method._id)"
          >
            <component :is="getMethodIcon(method._id)" class="w-6 h-6" :class="getMethodColor(method._id)" />
          </div>
          <p class="text-slate-400 text-sm">{{ getMethodLabel(method._id) }}</p>
          <p class="text-xl font-display font-bold text-white mt-1">{{ formatCurrency(method.total) }}</p>
          <p class="text-xs text-slate-500">{{ method.count }} pagos</p>
        </div>
        
        <div v-if="paymentsByMethod.length === 0" class="col-span-4 text-center py-8">
          <p class="text-slate-400">No hay datos de pagos</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h } from 'vue'
import { obligationsApi, paymentsApi, incomesApi, predictionsApi } from '../services/api'

const selectedYear = ref(2025)
const loading = ref(true)
const obligationsSummary = ref({ pending: 0, paid: 0, overdue: 0, total: 0, totalAmount: 0, paidAmount: 0, avgMonthlyPayment: 0 })
const paymentsSummary = ref({ totalPaid: 0, totalBonus: 0, totalPayments: 0, byMonth: [], byMethod: [] })
const incomeSummary = ref({ months: [], totals: null })
const declaration = ref(null)
const allPayments = ref([])
const allObligations = ref([])

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
})

const pendingObligations = computed(() => {
  return allObligations.value
    .filter(o => o.status === 'pendiente')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

const pendingAmount = computed(() => {
  return obligationsSummary.value.pendingAmount || (obligationsSummary.value.totalAmount - (obligationsSummary.value.paidAmount || 0))
})

const paidPercentage = computed(() => {
  if (!obligationsSummary.value.total) return 0
  return (obligationsSummary.value.paid / obligationsSummary.value.total) * 100
})

const pendingPercentage = computed(() => {
  if (!obligationsSummary.value.total) return 0
  return (obligationsSummary.value.pending / obligationsSummary.value.total) * 100
})

const overduePercentage = computed(() => {
  if (!obligationsSummary.value.total) return 0
  return (obligationsSummary.value.overdue / obligationsSummary.value.total) * 100
})

const monthlyPayments = computed(() => {
  return paymentsSummary.value.byMonth || []
})

const maxMonthlyPayment = computed(() => {
  if (!monthlyPayments.value.length) return 1
  return Math.max(...monthlyPayments.value.map(m => m.total))
})

const paymentsByMethod = computed(() => {
  return paymentsSummary.value.byMethod || []
})

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

function formatCurrencyPrint(amount) {
  return `$${(amount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CUP`
}

function formatDateShort(date) {
  return new Date(date).toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
}

function getMonthName(month) {
  return monthNames[month - 1] || month
}

function getMethodLabel(method) {
  const labels = {
    efectivo: 'Efectivo',
    transfermovil: 'Transfermóvil',
    banco: 'Banco',
    otro: 'Otro'
  }
  return labels[method] || method || 'Sin método'
}

function getMethodClassPrint(method) {
  const classes = {
    efectivo: 'bg-slate-600/50 text-slate-300 print:bg-gray-100 print:text-gray-700',
    transfermovil: 'bg-blue-600/30 text-blue-300 print:bg-blue-50 print:text-blue-700',
    banco: 'bg-purple-600/30 text-purple-300 print:bg-purple-50 print:text-purple-700',
    otro: 'bg-slate-600/50 text-slate-300 print:bg-gray-100 print:text-gray-700'
  }
  return classes[method] || classes.otro
}

function getMethodBg(method) {
  const bgs = {
    efectivo: 'bg-slate-600/50',
    transfermovil: 'bg-blue-600/50',
    banco: 'bg-purple-600/50',
    otro: 'bg-slate-600/50'
  }
  return bgs[method] || bgs.otro
}

function getMethodColor(method) {
  const colors = {
    efectivo: 'text-slate-300',
    transfermovil: 'text-blue-300',
    banco: 'text-purple-300',
    otro: 'text-slate-300'
  }
  return colors[method] || colors.otro
}

function getMethodIcon(method) {
  const icons = {
    efectivo: {
      render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' })
      ])
    },
    transfermovil: {
      render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' })
      ])
    },
    banco: {
      render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
      ])
    },
    otro: {
      render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
      ])
    }
  }
  return icons[method] || icons.otro
}

function getDaysUntilDue(obligation) {
  const today = new Date()
  const dueDate = new Date(obligation.dueDate)
  const diffTime = dueDate - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDaysText(obligation) {
  const days = getDaysUntilDue(obligation)
  if (days < 0) return `Vencido`
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  return `${days} días`
}

function getObligationAmount(obligation) {
  if (obligation.amount && obligation.amount > 0) {
    return obligation.amount
  }
  if (obligation.tributeCode === '0114022' && obligationsSummary.value.avgMonthlyPayment) {
    return obligationsSummary.value.avgMonthlyPayment
  }
  return 0
}

function printReport() {
  window.print()
}

async function loadData() {
  loading.value = true
  try {
    const [obligationsRes, paymentsRes, incomesRes, paymentsListRes, obligationsListRes, declarationRes] = await Promise.all([
      obligationsApi.getSummary(selectedYear.value),
      paymentsApi.getSummary(selectedYear.value),
      incomesApi.getAnnualSummary(selectedYear.value),
      paymentsApi.getAll(),
      obligationsApi.getAll(),
      predictionsApi.getAnnualDeclaration(selectedYear.value)
    ])
    
    obligationsSummary.value = obligationsRes.data
    paymentsSummary.value = paymentsRes.data
    incomeSummary.value = incomesRes.data
    allPayments.value = paymentsListRes.data
    allObligations.value = obligationsListRes.data
    declaration.value = declarationRes.data
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

watch(selectedYear, () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<style>
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .print\:hidden {
    display: none !important;
  }
  
  .print\:block {
    display: block !important;
  }
  
  /* Hide sidebar and header when printing */
  aside, header, nav {
    display: none !important;
  }
  
  main {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }
  
  .card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
