<template>
  <div class="min-h-screen">
    <!-- Login/Register pages - no sidebar -->
    <template v-if="isPublicRoute">
      <router-view />
    </template>

    <!-- Main app with sidebar -->
    <template v-else>
      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 h-full w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 z-50 print:hidden">
        <!-- Logo -->
        <div class="p-6 border-b border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 class="font-display text-xl font-bold text-white">Vector Fiscal</h1>
              <p class="text-xs text-slate-400">ONAT 2025</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="p-4 space-y-2">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all group"
            :class="{ 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500': $route.path === item.path }"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.name }}</span>
            <span 
              v-if="item.badge" 
              class="ml-auto bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full"
            >
              {{ item.badge }}
            </span>
          </router-link>
        </nav>

        <!-- User Info -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <router-link 
            to="/perfil"
            class="flex items-center gap-3 px-4 py-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {{ userInitials }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ userName }}</p>
              <p class="text-xs text-slate-400">NIT: {{ userNit }}</p>
            </div>
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </router-link>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="ml-64 min-h-screen print:ml-0">
        <!-- Top Bar -->
        <header class="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 px-8 py-4 print:hidden">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-display font-bold text-white">{{ currentPageTitle }}</h2>
              <p class="text-sm text-slate-400">{{ currentDate }}</p>
            </div>
            
            <!-- Right side buttons -->
            <div class="flex items-center gap-3">
              <!-- Alerts indicator with dropdown -->
              <div class="relative" v-if="pendingObligations.length > 0">
                <button 
                  @click="showNotifications = !showNotifications"
                  class="relative p-2 text-slate-400 hover:text-white transition-colors"
                  title="Alertas pendientes"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span class="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {{ pendingObligations.length }}
                  </span>
                </button>

                <!-- Notifications Dropdown -->
                <transition name="dropdown">
                  <div 
                    v-if="showNotifications"
                    class="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <!-- Header -->
                    <div class="px-4 py-3 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
                      <h3 class="font-semibold text-white">Próximos Vencimientos</h3>
                      <span class="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                        {{ pendingObligations.length }} pendientes
                      </span>
                    </div>

                    <!-- Notifications List -->
                    <div class="max-h-80 overflow-y-auto">
                      <div 
                        v-for="obligation in pendingObligations" 
                        :key="obligation._id"
                        class="px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <div class="flex items-start gap-3">
                          <div :class="[
                            'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                            getDaysUntilDue(obligation.dueDate) <= 7 ? 'bg-red-500/20 text-red-400' : 
                            getDaysUntilDue(obligation.dueDate) <= 15 ? 'bg-amber-500/20 text-amber-400' : 
                            'bg-emerald-500/20 text-emerald-400'
                          ]">
                            {{ obligation.periodicity === 'mensual' ? 'M' : 'T' }}
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-white truncate">{{ obligation.description }}</p>
                            <p class="text-xs text-slate-400">{{ obligation.period }}</p>
                            <div class="flex items-center gap-2 mt-1">
                              <span :class="[
                                'text-xs font-medium',
                                getDaysUntilDue(obligation.dueDate) <= 7 ? 'text-red-400' : 
                                getDaysUntilDue(obligation.dueDate) <= 15 ? 'text-amber-400' : 
                                'text-emerald-400'
                              ]">
                                {{ getDaysUntilDue(obligation.dueDate) <= 0 ? '¡Vencido!' : `Vence en ${getDaysUntilDue(obligation.dueDate)} días` }}
                              </span>
                              <span class="text-xs text-slate-500">•</span>
                              <span class="text-xs text-slate-400">
                                {{ obligation.amount > 0 ? formatCurrency(obligation.amount) : '~estimado' }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Empty state -->
                      <div v-if="pendingObligations.length === 0" class="px-4 py-8 text-center">
                        <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-slate-400 text-sm">¡Todo al día!</p>
                        <p class="text-slate-500 text-xs">No tienes obligaciones pendientes</p>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-4 py-3 bg-slate-900/50 border-t border-slate-700">
                      <router-link 
                        to="/calendario"
                        @click="showNotifications = false"
                        class="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Ver calendario completo
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </router-link>
                    </div>
                  </div>
                </transition>

                <!-- Backdrop to close dropdown -->
                <div 
                  v-if="showNotifications" 
                  @click="showNotifications = false"
                  class="fixed inset-0 z-40"
                ></div>
              </div>

              <!-- Logout button -->
              <button 
                @click="handleLogout"
                class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Cerrar sesión"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span class="text-sm font-medium hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="p-8 print:p-0">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, h, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi, obligationsApi } from './services/api'

const route = useRoute()
const router = useRouter()

// Notifications
const showNotifications = ref(false)
const pendingObligations = ref([])

// User info
const user = ref(null)

// Cargar obligaciones pendientes
const loadPendingObligations = async () => {
  try {
    const response = await obligationsApi.getAll({ status: 'pendiente', year: 2025 })
    // Filtrar solo las que tienen fecha de vencimiento en los próximos 60 días
    const now = new Date()
    const sixtyDaysLater = new Date()
    sixtyDaysLater.setDate(now.getDate() + 60)
    
    pendingObligations.value = response.data
      .filter(o => {
        const dueDate = new Date(o.dueDate)
        return dueDate <= sixtyDaysLater && o.status === 'pendiente'
      })
      .filter(o => {
        // Excluir 0510122 con monto 0
        if (o.tributeCode === '0510122' && (!o.amount || o.amount === 0)) return false
        return true
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 10) // Máximo 10 notificaciones
  } catch (error) {
    console.error('Error loading pending obligations:', error)
  }
}

// Calcular días hasta vencimiento
const getDaysUntilDue = (dueDate) => {
  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2
  }).format(value || 0).replace('CUP', '$')
}

// Cargar usuario desde localStorage y API
const loadUser = async () => {
  // Primero cargar de localStorage para mostrar algo rápido
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  }
  
  // Luego verificar con la API para datos actualizados
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const response = await authApi.me()
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (error) {
      // Si falla, mantener los datos del localStorage
      console.error('Error loading user:', error)
    }
  }
}

// Escuchar evento de actualización de usuario (desde Profile.vue)
const handleUserUpdated = (event) => {
  user.value = event.detail
}

onMounted(() => {
  if (!route.meta.public) {
    loadUser()
    loadPendingObligations()
  }
  window.addEventListener('user-updated', handleUserUpdated)
})

onUnmounted(() => {
  window.removeEventListener('user-updated', handleUserUpdated)
})

// Recargar usuario cuando cambie la ruta (por si acaba de hacer login)
watch(() => route.path, (newPath) => {
  if (!route.meta.public && !user.value) {
    loadUser()
  }
  // Recargar obligaciones pendientes al cambiar de página
  if (!route.meta.public) {
    loadPendingObligations()
  }
})

const userName = computed(() => user.value?.name || 'Cargando...')
const userNit = computed(() => user.value?.nit || '...')
const userInitials = computed(() => {
  if (!user.value?.name) return '...'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const isPublicRoute = computed(() => {
  return route.meta.public === true
})

const handleLogout = () => {
  authApi.logout()
}

// Navigation items with inline SVG icons
const navItems = computed(() => [
  { 
    path: '/', 
    name: 'Dashboard',
    icon: {
      render: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' })
      ])
    }
  },
  { 
    path: '/calendario', 
    name: 'Calendario',
    badge: pendingObligations.value.length || null,
    icon: {
      render: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })
      ])
    }
  },
  { 
    path: '/calculadora', 
    name: 'Calculadora',
    icon: {
      render: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' })
      ])
    }
  },
  { 
    path: '/pagos', 
    name: 'Pagos',
    icon: {
      render: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' })
      ])
    }
  },
  { 
    path: '/ingresos', 
    name: 'Ingresos',
    icon: {
      render: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
      ])
    }
  },
  { 
    path: '/reportes', 
    name: 'Reportes',
    icon: {
      render: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
      ])
    }
  }
])

const currentPageTitle = computed(() => {
  if (route.path === '/perfil') return 'Mi Perfil'
  const item = navItems.value.find(i => i.path === route.path)
  return item?.name || 'Dashboard'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
