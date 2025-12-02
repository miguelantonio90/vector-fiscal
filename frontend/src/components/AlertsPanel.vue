<template>
  <div class="relative">
    <!-- Alert Button -->
    <button 
      @click="togglePanel"
      class="relative p-2 text-slate-400 hover:text-white transition-colors"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span 
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-onat-red text-white text-xs rounded-full flex items-center justify-center animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Panel Dropdown -->
    <transition name="slide-fade">
      <div 
        v-if="showPanel"
        class="absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <h3 class="font-display font-bold text-white">Alertas</h3>
          <div class="flex items-center gap-2">
            <button 
              @click="generateAlerts"
              class="text-xs text-slate-400 hover:text-white transition-colors"
              title="Actualizar alertas"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': generating }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              v-if="unreadCount > 0"
              @click="markAllRead"
              class="text-xs text-onat-red hover:text-onat-accent transition-colors"
            >
              Marcar todas leídas
            </button>
          </div>
        </div>

        <!-- Alerts List -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="w-6 h-6 border-2 border-onat-red border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else-if="alerts.length === 0" class="text-center py-8">
            <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-slate-400 text-sm">No hay alertas</p>
          </div>

          <div v-else>
            <div 
              v-for="alert in alerts" 
              :key="alert._id"
              class="px-4 py-3 border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors cursor-pointer"
              :class="{ 'bg-slate-800/20': !alert.isRead }"
              @click="markAsRead(alert)"
            >
              <div class="flex items-start gap-3">
                <div 
                  class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  :class="getAlertDot(alert)"
                ></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-white" :class="{ 'font-medium': !alert.isRead }">
                    {{ alert.message }}
                  </p>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ formatDate(alert.alertDate) }}
                  </p>
                </div>
                <button 
                  @click.stop="deleteAlert(alert._id)"
                  class="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Backdrop -->
    <div 
      v-if="showPanel"
      class="fixed inset-0 z-40"
      @click="showPanel = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { alertsApi } from '../services/api'

const showPanel = ref(false)
const loading = ref(false)
const generating = ref(false)
const alerts = ref([])
const summary = ref({ total: 0, unread: 0 })

const unreadCount = computed(() => summary.value.unread)

function togglePanel() {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    loadAlerts()
  }
}

function formatDate(date) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function getAlertDot(alert) {
  if (alert.type === 'vencido') return 'bg-red-500 animate-pulse'
  if (alert.type === 'vencimiento_proximo') return 'bg-amber-500'
  if (alert.type === 'bonificacion_disponible') return 'bg-emerald-500'
  return 'bg-slate-500'
}

async function loadAlerts() {
  loading.value = true
  try {
    const [alertsRes, summaryRes] = await Promise.all([
      alertsApi.getAll(),
      alertsApi.getSummary()
    ])
    alerts.value = alertsRes.data
    summary.value = summaryRes.data
  } catch (error) {
    console.error('Error loading alerts:', error)
  } finally {
    loading.value = false
  }
}

async function generateAlerts() {
  generating.value = true
  try {
    await alertsApi.generate()
    await loadAlerts()
  } catch (error) {
    console.error('Error generating alerts:', error)
  } finally {
    generating.value = false
  }
}

async function markAsRead(alert) {
  if (alert.isRead) return
  try {
    await alertsApi.markAsRead(alert._id)
    alert.isRead = true
    summary.value.unread = Math.max(0, summary.value.unread - 1)
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

async function markAllRead() {
  try {
    await alertsApi.markAllAsRead()
    alerts.value.forEach(a => a.isRead = true)
    summary.value.unread = 0
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

async function deleteAlert(id) {
  try {
    await alertsApi.delete(id)
    const index = alerts.value.findIndex(a => a._id === id)
    if (index !== -1) {
      if (!alerts.value[index].isRead) {
        summary.value.unread = Math.max(0, summary.value.unread - 1)
      }
      alerts.value.splice(index, 1)
      summary.value.total--
    }
  } catch (error) {
    console.error('Error deleting alert:', error)
  }
}

async function loadSummary() {
  try {
    const res = await alertsApi.getSummary()
    summary.value = res.data
  } catch (error) {
    console.error('Error loading summary:', error)
  }
}

onMounted(() => {
  loadSummary()
  // Generate alerts on load
  generateAlerts()
})

// Expose for parent component
defineExpose({ unreadCount, loadSummary })
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

