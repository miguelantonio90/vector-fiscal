<template>
  <div class="space-y-8">
    <!-- Header with Actions -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-white">Registro de Pagos</h2>
        <p class="text-slate-400 mt-1">Gestiona tus pagos realizados a la ONAT</p>
      </div>
      <button @click="showPaymentModal = true" class="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 px-6">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Registrar Pago
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card bg-gradient-to-br from-emerald-900/40 to-slate-800/40 border-emerald-700/30">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-slate-400 text-xs uppercase tracking-wide">Total Pagado</p>
            <p class="text-2xl font-display font-bold text-emerald-400">
              {{ formatCurrency(paymentSummary.totalPaid) }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="card bg-gradient-to-br from-blue-900/40 to-slate-800/40 border-blue-700/30">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-slate-400 text-xs uppercase tracking-wide">Ahorro Bonif.</p>
            <p class="text-2xl font-display font-bold text-blue-400">
              {{ formatCurrency(paymentSummary.totalBonus) }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="card bg-gradient-to-br from-purple-900/40 to-slate-800/40 border-purple-700/30">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-slate-400 text-xs uppercase tracking-wide">Pagos Realizados</p>
            <p class="text-2xl font-display font-bold text-purple-400">
              {{ paymentSummary.totalPayments }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="card bg-gradient-to-br from-amber-900/40 to-slate-800/40 border-amber-700/30">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p class="text-slate-400 text-xs uppercase tracking-wide">Promedio/Pago</p>
            <p class="text-2xl font-display font-bold text-amber-400">
              {{ formatCurrency(averagePayment) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Payments List -->
    <div class="card">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h3 class="text-lg font-display font-bold text-white">Historial de Pagos</h3>
        <div class="flex items-center gap-3">
          <select v-model="filterMethod" class="input w-40 text-sm py-2">
            <option value="">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transfermovil">Transfermóvil</option>
            <option value="banco">Banco</option>
          </select>
          <select v-model="sortBy" class="input w-40 text-sm py-2">
            <option value="date-desc">Más recientes</option>
            <option value="date-asc">Más antiguos</option>
            <option value="amount-desc">Mayor monto</option>
            <option value="amount-asc">Menor monto</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-2 border-onat-red border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="payments.length === 0" class="text-center py-12">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p class="text-slate-400 text-lg">No hay pagos registrados</p>
        <p class="text-slate-500 text-sm mt-1">Comienza registrando tu primer pago</p>
        <button @click="showPaymentModal = true" class="btn bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
          Registrar primer pago
        </button>
      </div>

      <!-- Card-based list for payments -->
      <div v-else class="space-y-3">
        <div 
          v-for="payment in sortedPayments" 
          :key="payment._id"
          class="group relative bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800/80 transition-all border border-slate-700/30 hover:border-slate-600/50"
        >
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <!-- Date Badge -->
            <div class="flex items-center gap-4 flex-shrink-0">
              <div class="w-14 h-14 rounded-xl bg-slate-700/50 flex flex-col items-center justify-center">
                <span class="text-lg font-bold text-white leading-none">{{ getDayFromDate(payment.paymentDate) }}</span>
                <span class="text-xs text-slate-400 uppercase">{{ getMonthFromDate(payment.paymentDate) }}</span>
              </div>
            </div>
            
            <!-- Obligation Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start gap-2">
                <div 
                  class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  :class="payment.obligation?.tributeCode === '0820132' ? 'bg-blue-400' : 'bg-onat-red'"
                ></div>
                <div>
                  <p class="text-white font-medium">{{ payment.obligation?.description || 'N/A' }}</p>
                  <p class="text-sm text-slate-400">{{ payment.obligation?.period }}</p>
                </div>
              </div>
            </div>
            
            <!-- Method & Bonus -->
            <div class="flex items-center gap-4 flex-shrink-0">
              <span 
                class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                :class="getMethodClass(payment.paymentMethod)"
              >
                {{ getMethodLabel(payment.paymentMethod) }}
              </span>
              
              <div v-if="payment.bonusApplied > 0" class="text-center">
                <div class="px-3 py-1.5 bg-emerald-500/20 rounded-lg">
                  <span class="text-emerald-400 font-mono font-semibold text-sm">-{{ payment.bonusApplied.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
            
            <!-- Amount -->
            <div class="text-right flex-shrink-0 min-w-[120px]">
              <p class="text-xl font-display font-bold text-white">
                {{ formatCurrency(payment.amount) }}
              </p>
              <p v-if="payment.bonusAmount > 0" class="text-xs text-emerald-400">
                Ahorraste {{ formatCurrency(payment.bonusAmount) }}
              </p>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button 
                @click="editPayment(payment)"
                class="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Editar pago"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                @click="deletePayment(payment._id)"
                class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Eliminar pago"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Notes if any -->
          <div v-if="payment.notes" class="mt-3 pt-3 border-t border-slate-700/30">
            <p class="text-sm text-slate-400 italic">
              <svg class="w-4 h-4 inline-block mr-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {{ payment.notes }}
            </p>
          </div>
          
          <!-- Reference badge -->
          <div v-if="payment.reference" class="absolute top-2 right-2">
            <span class="text-xs text-slate-500 font-mono">#{{ payment.reference }}</span>
          </div>
        </div>
      </div>
      
      <!-- Summary footer -->
      <div v-if="payments.length > 0" class="mt-6 pt-6 border-t border-slate-700/50">
        <div class="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div class="flex items-center gap-6">
            <span class="text-slate-400">
              Mostrando <span class="text-white font-medium">{{ sortedPayments.length }}</span> de <span class="text-white font-medium">{{ payments.length }}</span> pagos
            </span>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-onat-red"></div>
              <span class="text-slate-400">Mensual</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-blue-400"></div>
              <span class="text-slate-400">Trimestral</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div 
      v-if="showPaymentModal" 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="card w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-display font-bold text-white">{{ isEditing ? 'Editar Pago' : 'Registrar Pago' }}</h3>
              <p class="text-sm text-slate-400">{{ isEditing ? 'Modifica los datos del pago' : 'Registra un nuevo pago realizado' }}</p>
            </div>
          </div>
          <button @click="closeModal" class="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="submitPayment" class="space-y-6">
          <!-- Obligation Select -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-onat-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Obligación a pagar
              </span>
            </label>
            <select v-model="paymentForm.obligationId" class="input" required :disabled="isEditing">
              <option value="">Seleccionar obligación...</option>
              <option 
                v-for="obligation in availableObligations" 
                :key="obligation._id" 
                :value="obligation._id"
              >
                {{ obligation.description }} - {{ obligation.period }}
              </option>
            </select>
            <p v-if="isEditing" class="text-xs text-slate-500 mt-1">No se puede cambiar la obligación al editar</p>
          </div>

          <!-- Two columns: Amount & Date -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Amount -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Monto pagado (CUP)
                </span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  v-model.number="paymentForm.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input pl-10 text-lg font-mono"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <!-- Payment Date -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Fecha de pago
                </span>
              </label>
              <input
                v-model="paymentForm.paymentDate"
                type="date"
                class="input"
                required
              />
            </div>
          </div>

          <!-- Two columns: Method & Reference -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Payment Method -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Método de pago
                </span>
              </label>
              <select v-model="paymentForm.paymentMethod" class="input" required>
                <option value="efectivo">Efectivo</option>
                <option value="transfermovil">Transfermóvil</option>
                <option value="banco">Banco</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <!-- Reference -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Referencia
                </span>
              </label>
              <input
                v-model="paymentForm.reference"
                type="text"
                class="input"
                placeholder="Nro. comprobante (opcional)"
              />
            </div>
          </div>

          <!-- Bonus Section -->
          <div class="p-4 bg-gradient-to-r from-emerald-900/20 to-slate-800/30 rounded-xl border border-emerald-700/20">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <span class="text-sm font-medium text-emerald-300">Bonificación</span>
              </div>
            </div>

            <!-- Tipo de bonificación -->
            <div class="mb-4">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="paymentForm.bonusMode = 'none'"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    paymentForm.bonusMode === 'none' 
                      ? 'bg-slate-600 text-white' 
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  ]"
                >
                  Sin bonificación
                </button>
                <button
                  type="button"
                  @click="paymentForm.bonusMode = 'already'"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    paymentForm.bonusMode === 'already' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  ]"
                >
                  Ya incluida en monto
                </button>
                <button
                  type="button"
                  @click="paymentForm.bonusMode = 'calculate'"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    paymentForm.bonusMode === 'calculate' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  ]"
                >
                  Calcular automático
                </button>
              </div>
            </div>

            <!-- Monto ahorrado si ya está aplicada -->
            <div v-if="paymentForm.bonusMode === 'already'" class="space-y-3">
              <p class="text-xs text-slate-400">Indica cuánto ahorraste en pesos (CUP) por la bonificación:</p>
              
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                  <span class="text-emerald-400 font-medium">$</span>
                  <input
                    v-model.number="paymentForm.bonusAmountSaved"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-24 bg-transparent border-none text-center text-lg font-mono text-emerald-400 focus:outline-none"
                    placeholder="0.00"
                  />
                  <span class="text-emerald-400/60 text-sm">CUP</span>
                </div>
              </div>
              
              <p class="text-xs text-slate-500">
                Ejemplo: Si el monto original era $1,200 y pagaste $1,164, ingresa <span class="text-emerald-400">36</span> como ahorro.
              </p>
            </div>

            <!-- Info para calcular automático -->
            <div v-else-if="paymentForm.bonusMode === 'calculate'" class="space-y-2">
              <p class="text-xs text-slate-400">El sistema calculará automáticamente las bonificaciones:</p>
              <div class="flex gap-4 text-xs text-slate-500">
                <span v-if="paymentForm.paymentMethod === 'transfermovil'" class="text-blue-400">+3% Transfermóvil</span>
                <span v-if="isEarlyPayment" class="text-emerald-400">+5% Anticipado</span>
              </div>
            </div>

            <!-- Info para sin bonificación -->
            <p v-else-if="paymentForm.bonusMode === 'none'" class="text-xs text-slate-500">
              El monto ingresado se guardará tal cual, sin aplicar ni calcular bonificaciones.
            </p>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notas (opcional)
              </span>
            </label>
            <textarea
              v-model="paymentForm.notes"
              class="input resize-none"
              rows="2"
              placeholder="Observaciones adicionales..."
            ></textarea>
          </div>

          <!-- Bonus Preview (when auto-calculating) -->
          <div v-if="selectedObligation && paymentForm.amount && !paymentForm.bonusAlreadyApplied" class="p-4 bg-emerald-900/20 rounded-xl border border-emerald-700/30">
            <p class="text-sm text-emerald-400 font-medium mb-2">Bonificaciones que se aplicarán:</p>
            <div class="flex justify-between text-sm">
              <span class="text-slate-300">Pago anticipado (5%)</span>
              <span :class="isEarlyPayment ? 'text-emerald-400' : 'text-slate-500'">
                {{ isEarlyPayment ? 'Aplicable' : 'No aplicable' }}
              </span>
            </div>
            <div class="flex justify-between text-sm mt-1">
              <span class="text-slate-300">Transfermóvil (3%)</span>
              <span :class="paymentForm.paymentMethod === 'transfermovil' ? 'text-emerald-400' : 'text-slate-500'">
                {{ paymentForm.paymentMethod === 'transfermovil' ? 'Aplicable' : 'No aplicable' }}
              </span>
            </div>
          </div>

          <!-- Submit -->
          <div class="flex gap-3 pt-4 border-t border-slate-700/50 mt-6">
            <button type="button" @click="closeModal" class="flex-1 btn btn-secondary py-3">
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="submitting"
              class="flex-[2] btn py-3 font-semibold text-white transition-all"
              :class="isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'"
            >
              <span v-if="submitting" class="flex items-center justify-center gap-2">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {{ isEditing ? 'Guardando...' : 'Registrando...' }}
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ isEditing ? 'Guardar Cambios' : 'Registrar Pago' }}
              </span>
            </button>
          </div>
        </form>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { paymentsApi, obligationsApi } from '../services/api'

const route = useRoute()

const loading = ref(true)
const submitting = ref(false)
const showPaymentModal = ref(false)
const payments = ref([])
const pendingObligations = ref([])
const allObligations = ref([])
const paymentSummary = ref({ totalPaid: 0, totalBonus: 0, totalPayments: 0 })
const filterMethod = ref('')
const sortBy = ref('date-desc')
const toast = ref({ show: false, message: '', type: 'success' })
const editingPaymentId = ref(null)

const paymentForm = ref({
  obligationId: '',
  amount: null,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'efectivo',
  reference: '',
  notes: '',
  bonusMode: 'already', // 'none', 'already', 'calculate'
  bonusAmountSaved: 0
})

const isEditing = computed(() => !!editingPaymentId.value)

const filteredPayments = computed(() => {
  if (!filterMethod.value) return payments.value
  return payments.value.filter(p => p.paymentMethod === filterMethod.value)
})

const sortedPayments = computed(() => {
  const sorted = [...filteredPayments.value]
  switch (sortBy.value) {
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate))
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    case 'amount-asc':
      return sorted.sort((a, b) => a.amount - b.amount)
    case 'amount-desc':
      return sorted.sort((a, b) => b.amount - a.amount)
    default:
      return sorted
  }
})

const averagePayment = computed(() => {
  if (!paymentSummary.value.totalPayments) return 0
  return paymentSummary.value.totalPaid / paymentSummary.value.totalPayments
})

const availableObligations = computed(() => {
  if (isEditing.value) {
    return allObligations.value
  }
  return pendingObligations.value
})

const selectedObligation = computed(() => {
  return allObligations.value.find(o => o._id === paymentForm.value.obligationId) ||
         pendingObligations.value.find(o => o._id === paymentForm.value.obligationId)
})

const isEarlyPayment = computed(() => {
  if (!selectedObligation.value || !paymentForm.value.paymentDate) return false
  const payDate = new Date(paymentForm.value.paymentDate)
  const dueDate = new Date(selectedObligation.value.dueDate)
  return payDate < dueDate
})

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

function getDayFromDate(date) {
  return new Date(date).getDate()
}

function getMonthFromDate(date) {
  return new Date(date).toLocaleDateString('es-ES', { month: 'short' })
}

function getMethodLabel(method) {
  const labels = {
    efectivo: 'Efectivo',
    transfermovil: 'Transfermóvil',
    banco: 'Banco',
    otro: 'Otro'
  }
  return labels[method] || method
}

function getMethodClass(method) {
  const classes = {
    efectivo: 'bg-slate-600/50 text-slate-200',
    transfermovil: 'bg-blue-600/30 text-blue-300 border border-blue-500/30',
    banco: 'bg-purple-600/30 text-purple-300 border border-purple-500/30',
    otro: 'bg-slate-600/50 text-slate-200'
  }
  return classes[method] || classes.otro
}

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

function closeModal() {
  showPaymentModal.value = false
  editingPaymentId.value = null
  paymentForm.value = {
    obligationId: '',
    amount: null,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'efectivo',
    reference: '',
    notes: '',
    bonusMode: 'already',
    bonusAmountSaved: 0
  }
}

function editPayment(payment) {
  editingPaymentId.value = payment._id
  // Determinar el modo de bonificación basado en los datos del pago
  let bonusMode = 'none'
  if (payment.bonusAmount > 0) {
    bonusMode = 'already'
  }
  
  paymentForm.value = {
    obligationId: payment.obligation?._id || payment.obligation,
    amount: payment.amount,
    paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
    paymentMethod: payment.paymentMethod,
    reference: payment.reference || '',
    notes: payment.notes || '',
    bonusMode: bonusMode,
    bonusAmountSaved: payment.bonusAmount || 0
  }
  showPaymentModal.value = true
}

async function loadData() {
  loading.value = true
  try {
    const [paymentsRes, summaryRes, pendingRes, allRes] = await Promise.all([
      paymentsApi.getAll(),
      paymentsApi.getSummary(2025),
      obligationsApi.getAll({ status: 'pendiente' }),
      obligationsApi.getAll()
    ])
    
    payments.value = paymentsRes.data
    paymentSummary.value = summaryRes.data
    pendingObligations.value = pendingRes.data
    allObligations.value = allRes.data

    // Check if obligationId was passed in URL
    if (route.query.obligationId) {
      paymentForm.value.obligationId = route.query.obligationId
      const obligation = pendingObligations.value.find(o => o._id === route.query.obligationId)
      if (obligation) {
        paymentForm.value.amount = obligation.amount
        showPaymentModal.value = true
      }
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

async function submitPayment() {
  if (!paymentForm.value.obligationId || !paymentForm.value.amount) return

  submitting.value = true
  try {
    const paymentData = {
      amount: paymentForm.value.amount,
      paymentDate: paymentForm.value.paymentDate,
      paymentMethod: paymentForm.value.paymentMethod,
      reference: paymentForm.value.reference,
      notes: paymentForm.value.notes,
      bonusMode: paymentForm.value.bonusMode,
      bonusAmountSaved: paymentForm.value.bonusAmountSaved
    }
    
    if (isEditing.value) {
      await paymentsApi.update(editingPaymentId.value, paymentData)
      showToast('Pago actualizado exitosamente', 'success')
    } else {
      await paymentsApi.create({
        ...paymentData,
        obligationId: paymentForm.value.obligationId
      })
      showToast('Pago registrado exitosamente', 'success')
    }
    closeModal()
    await loadData()
  } catch (error) {
    showToast('Error: ' + error.message, 'error')
  } finally {
    submitting.value = false
  }
}

async function deletePayment(id) {
  if (!confirm('¿Estás seguro de eliminar este pago?')) return

  try {
    await paymentsApi.delete(id)
    showToast('Pago eliminado', 'success')
    await loadData()
  } catch (error) {
    showToast('Error al eliminar: ' + error.message, 'error')
  }
}

onMounted(() => {
  loadData()
})
</script>
