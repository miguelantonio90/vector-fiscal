<template>
  <div class="space-y-6">
    <!-- Header con estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-400">Total Usuarios</p>
            <p class="text-2xl font-bold text-white font-mono">{{ stats.users?.total || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-400">Usuarios Regulares</p>
            <p class="text-2xl font-bold text-white font-mono">{{ stats.users?.regular || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-400">Administradores</p>
            <p class="text-2xl font-bold text-white font-mono">{{ stats.users?.admins || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-400">Total Pagos</p>
            <p class="text-2xl font-bold text-white font-mono">{{ formatCurrency(stats.payments?.total || 0) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de acciones -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex-1 max-w-md">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre o NIT..."
            class="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
            @input="debouncedSearch"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <select
          v-model="roleFilter"
          class="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          @change="loadUsers"
        >
          <option value="">Todos los roles</option>
          <option value="user">Usuarios</option>
          <option value="admin">Administradores</option>
        </select>

        <button
          @click="openCreateModal"
          class="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>
    </div>

    <!-- Tabla de usuarios -->
    <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-2 text-slate-400">Cargando usuarios...</p>
      </div>

      <!-- Tabla -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-900/50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">NIT</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actividad</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Registro</th>
              <th class="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr v-for="user in users" :key="user._id" class="hover:bg-slate-700/20 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                    user.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  ]">
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <p class="font-medium text-white">{{ user.name }}</p>
                    <p class="text-xs text-slate-400">ID: {{ user._id.slice(-8) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-slate-300">{{ user.nit }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  user.role === 'admin' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                ]">
                  <svg v-if="user.role === 'admin'" class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {{ user.role === 'admin' ? 'Admin' : 'Usuario' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-4 text-xs text-slate-400">
                  <span class="flex items-center gap-1" title="Obligaciones">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {{ user.stats?.obligations || 0 }}
                  </span>
                  <span class="flex items-center gap-1" title="Pagos">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    {{ user.stats?.payments || 0 }}
                  </span>
                  <span class="flex items-center gap-1" title="Ingresos">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {{ user.stats?.incomes || 0 }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(user)"
                    class="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(user)"
                    :disabled="user._id === currentUser?.id"
                    :class="[
                      'p-2 rounded-lg transition-colors',
                      user._id === currentUser?.id 
                        ? 'text-slate-600 cursor-not-allowed' 
                        : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                    ]"
                    title="Eliminar"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="users.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p class="text-slate-400">No se encontraron usuarios</p>
                <p class="text-slate-500 text-sm">Intenta con otros filtros de búsqueda</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="pagination.pages > 1" class="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
        <p class="text-sm text-slate-400">
          Mostrando {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} de {{ pagination.total }} usuarios
        </p>
        <div class="flex items-center gap-2">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span class="px-3 py-1.5 text-sm text-white bg-emerald-500/20 rounded">
            {{ pagination.page }}
          </span>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page === pagination.pages"
            class="px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de crear/editar usuario -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>
          
          <!-- Modal content -->
          <div class="relative bg-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-md overflow-hidden">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white">
                {{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}
              </h3>
              <button @click="closeModal" class="text-slate-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="saveUser" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Nombre completo</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  placeholder="Ej: Juan Pérez García"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">NIT</label>
                <input
                  v-model="form.nit"
                  type="text"
                  required
                  class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
                  placeholder="Ej: 12345678901"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">
                  {{ editingUser ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña' }}
                </label>
                <input
                  v-model="form.password"
                  type="password"
                  :required="!editingUser"
                  class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  placeholder="Mínimo 4 caracteres"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Rol</label>
                <select
                  v-model="form.role"
                  class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <!-- Error message -->
              <div v-if="formError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p class="text-sm text-red-400">{{ formError }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  @click="closeModal"
                  class="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {{ saving ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal de confirmación de eliminación -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showDeleteModal = false"></div>
          
          <!-- Modal content -->
          <div class="relative bg-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-sm overflow-hidden">
            <div class="p-6 text-center">
              <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">¿Eliminar usuario?</h3>
              <p class="text-slate-400 text-sm mb-1">
                Estás a punto de eliminar a <span class="text-white font-medium">{{ userToDelete?.name }}</span>
              </p>
              <p class="text-red-400 text-xs mb-6">
                Esta acción eliminará todas sus obligaciones, pagos e ingresos.
              </p>
              
              <div class="flex items-center gap-3">
                <button
                  @click="showDeleteModal = false"
                  class="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  @click="deleteUser"
                  :disabled="deleting"
                  class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {{ deleting ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usersApi } from '../services/api'

// Estado
const loading = ref(true)
const users = ref([])
const stats = ref({})
const searchQuery = ref('')
const roleFilter = ref('')
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// Modal de crear/editar
const showModal = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const formError = ref('')
const form = ref({
  name: '',
  nit: '',
  password: '',
  role: 'user'
})

// Modal de eliminación
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const deleting = ref(false)

// Usuario actual (para evitar auto-eliminación)
const currentUser = computed(() => {
  const stored = localStorage.getItem('user')
  return stored ? JSON.parse(stored) : null
})

// Cargar usuarios
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (roleFilter.value) params.role = roleFilter.value

    const response = await usersApi.getAll(params)
    users.value = response.data.users
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    loading.value = false
  }
}

// Cargar estadísticas
const loadStats = async () => {
  try {
    const response = await usersApi.getStats()
    stats.value = response.data
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Debounce para búsqueda
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadUsers()
  }, 300)
}

// Cambiar página
const changePage = (page) => {
  pagination.value.page = page
  loadUsers()
}

// Abrir modal de creación
const openCreateModal = () => {
  editingUser.value = null
  form.value = { name: '', nit: '', password: '', role: 'user' }
  formError.value = ''
  showModal.value = true
}

// Abrir modal de edición
const openEditModal = (user) => {
  editingUser.value = user
  form.value = {
    name: user.name,
    nit: user.nit,
    password: '',
    role: user.role
  }
  formError.value = ''
  showModal.value = true
}

// Cerrar modal
const closeModal = () => {
  showModal.value = false
  editingUser.value = null
  formError.value = ''
}

// Guardar usuario
const saveUser = async () => {
  saving.value = true
  formError.value = ''

  try {
    const data = {
      name: form.value.name,
      nit: form.value.nit,
      role: form.value.role
    }
    
    if (form.value.password) {
      data.password = form.value.password
    }

    if (editingUser.value) {
      await usersApi.update(editingUser.value._id, data)
    } else {
      data.password = form.value.password // Requerido para nuevo usuario
      await usersApi.create(data)
    }

    closeModal()
    loadUsers()
    loadStats()
  } catch (error) {
    formError.value = error.response?.data?.error || 'Error al guardar el usuario'
  } finally {
    saving.value = false
  }
}

// Confirmar eliminación
const confirmDelete = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

// Eliminar usuario
const deleteUser = async () => {
  if (!userToDelete.value) return
  
  deleting.value = true
  try {
    await usersApi.delete(userToDelete.value._id)
    showDeleteModal.value = false
    userToDelete.value = null
    loadUsers()
    loadStats()
  } catch (error) {
    console.error('Error deleting user:', error)
    alert(error.response?.data?.error || 'Error al eliminar el usuario')
  } finally {
    deleting.value = false
  }
}

// Helpers
const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0
  }).format(value || 0).replace('CUP', '$')
}

// Inicialización
onMounted(() => {
  loadUsers()
  loadStats()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>

