<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
      <p class="text-slate-400">Gestiona tu información personal y configuración de cuenta</p>
    </div>

    <!-- Profile Card -->
    <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
      <!-- Profile Header -->
      <div class="relative h-32 bg-gradient-to-r from-emerald-500 to-teal-600">
        <div class="absolute -bottom-12 left-8">
          <div class="w-24 h-24 bg-slate-800 rounded-2xl border-4 border-slate-900 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
            {{ userInitials }}
          </div>
        </div>
      </div>

      <!-- Profile Info -->
      <div class="pt-16 px-8 pb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold text-white">{{ user?.name || 'Usuario' }}</h2>
            <p class="text-slate-400">Contribuyente ONAT</p>
          </div>
          <div class="mt-4 md:mt-0 flex gap-3">
            <span class="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Cuenta Activa
            </span>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="successMessage" class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ errorMessage }}
        </div>

        <!-- Edit Profile Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column - Profile Info -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Información Personal
            </h3>
            
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
              <input
                v-model="editForm.name"
                type="text"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Tu nombre completo"
              />
            </div>

            <!-- NIT -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">NIT</label>
              <input
                v-model="editForm.nit"
                type="text"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Tu NIT"
              />
              <p class="mt-2 text-xs text-slate-500">El NIT es tu identificador único en el sistema</p>
            </div>

            <!-- Save Profile Button -->
            <button
              @click="saveProfile"
              :disabled="savingProfile"
              class="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="savingProfile" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Guardar Cambios
              </span>
            </button>
          </div>

          <!-- Right Column - Password -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Cambiar Contraseña
            </h3>

            <!-- Current Password -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Contraseña Actual</label>
              <div class="relative">
                <input
                  v-model="passwordForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-12"
                  placeholder="Tu contraseña actual"
                />
                <button
                  type="button"
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-300"
                >
                  <svg v-if="!showCurrentPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Nueva Contraseña</label>
              <div class="relative">
                <input
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-12"
                  placeholder="Tu nueva contraseña"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-300"
                >
                  <svg v-if="!showNewPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <p class="mt-2 text-xs text-slate-500">Mínimo 4 caracteres</p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Confirmar Nueva Contraseña</label>
              <input
                v-model="passwordForm.confirmPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Confirma tu nueva contraseña"
              />
            </div>

            <!-- Change Password Button -->
            <button
              @click="changePassword"
              :disabled="savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword"
              class="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="savingPassword" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cambiando...
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Cambiar Contraseña
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Card -->
    <div class="mt-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
      <h3 class="text-lg font-semibold text-white mb-6">Resumen de Actividad</h3>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-slate-900/50 rounded-xl">
          <p class="text-3xl font-bold text-emerald-400">{{ stats.totalPayments }}</p>
          <p class="text-sm text-slate-400 mt-1">Pagos Realizados</p>
        </div>
        <div class="text-center p-4 bg-slate-900/50 rounded-xl">
          <p class="text-3xl font-bold text-blue-400">{{ stats.totalObligations }}</p>
          <p class="text-sm text-slate-400 mt-1">Obligaciones</p>
        </div>
        <div class="text-center p-4 bg-slate-900/50 rounded-xl">
          <p class="text-3xl font-bold text-purple-400">{{ formatCurrency(stats.totalPaid) }}</p>
          <p class="text-sm text-slate-400 mt-1">Total Pagado</p>
        </div>
        <div class="text-center p-4 bg-slate-900/50 rounded-xl">
          <p class="text-3xl font-bold text-amber-400">{{ formatCurrency(stats.totalBonus) }}</p>
          <p class="text-sm text-slate-400 mt-1">Ahorro Bonificaciones</p>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <div class="mt-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
      <h3 class="text-lg font-semibold text-white mb-6">Acciones de Cuenta</h3>
      
      <div class="space-y-4">
        <!-- Importar MiONAT -->
        <button 
          @click="importVectorFiscal"
          :disabled="importing"
          class="w-full flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div class="text-left">
              <p class="font-medium text-white">Importar MiONAT 2025</p>
              <p class="text-sm text-slate-400">Cargar obligaciones del año fiscal actual</p>
            </div>
          </div>
          <svg v-if="!importing" class="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <svg v-else class="w-5 h-5 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Import Success Modal -->
    <div v-if="showImportSuccess" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md mx-4 text-center">
        <div class="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">¡Importación Exitosa!</h3>
        <p class="text-slate-400 mb-6">Se han importado {{ importResult.created }} obligaciones para el año fiscal 2025.</p>
        <button 
          @click="showImportSuccess = false"
          class="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { authApi, obligationsApi, paymentsApi } from '../services/api'

const user = ref(null)
const stats = ref({
  totalPayments: 0,
  totalObligations: 0,
  totalPaid: 0,
  totalBonus: 0
})

// Edit form
const editForm = ref({
  name: '',
  nit: ''
})

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// UI State
const savingProfile = ref(false)
const savingPassword = ref(false)
const importing = ref(false)
const showImportSuccess = ref(false)
const importResult = ref({ created: 0 })
const successMessage = ref('')
const errorMessage = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

const userInitials = computed(() => {
  if (!user.value?.name) return 'U'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2
  }).format(value || 0).replace('CUP', '$')
}

const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}

const loadProfile = async () => {
  try {
    const response = await authApi.me()
    user.value = response.data
    editForm.value.name = response.data.name
    editForm.value.nit = response.data.nit
    localStorage.setItem('user', JSON.stringify(response.data))
  } catch (error) {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user.value = JSON.parse(storedUser)
      editForm.value.name = user.value.name
      editForm.value.nit = user.value.nit
    }
  }
}

const loadStats = async () => {
  try {
    const [obligationsSummary, paymentsSummary] = await Promise.all([
      obligationsApi.getSummary(2025),
      paymentsApi.getSummary(2025)
    ])
    
    stats.value = {
      totalPayments: paymentsSummary.data.totalPayments || 0,
      totalObligations: obligationsSummary.data.total || 0,
      totalPaid: paymentsSummary.data.totalPaid || 0,
      totalBonus: paymentsSummary.data.totalBonus || 0
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const saveProfile = async () => {
  clearMessages()
  
  if (!editForm.value.name || !editForm.value.nit) {
    errorMessage.value = 'Nombre y NIT son requeridos'
    return
  }
  
  savingProfile.value = true
  try {
    const response = await authApi.updateProfile(editForm.value.name, editForm.value.nit)
    user.value = response.data.user
    localStorage.setItem('user', JSON.stringify(response.data.user))
    successMessage.value = 'Perfil actualizado exitosamente'
    
    // Disparar evento para actualizar el sidebar
    window.dispatchEvent(new CustomEvent('user-updated', { detail: response.data.user }))
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Error al actualizar el perfil'
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  clearMessages()
  
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    errorMessage.value = 'Contraseña actual y nueva son requeridas'
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    errorMessage.value = 'Las contraseñas nuevas no coinciden'
    return
  }
  
  if (passwordForm.value.newPassword.length < 4) {
    errorMessage.value = 'La nueva contraseña debe tener al menos 4 caracteres'
    return
  }
  
  savingPassword.value = true
  try {
    await authApi.changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
    successMessage.value = 'Contraseña actualizada exitosamente'
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Error al cambiar la contraseña'
  } finally {
    savingPassword.value = false
  }
}

const importVectorFiscal = async () => {
  importing.value = true
  try {
    const response = await obligationsApi.importVectorFiscal()
    const created = response.data.results?.filter(r => r.action === 'created').length || 0
    importResult.value = { created }
    showImportSuccess.value = true
    await loadStats()
  } catch (error) {
    console.error('Error importing:', error)
    errorMessage.value = 'Error al importar obligaciones'
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadProfile()
  loadStats()
})
</script>
