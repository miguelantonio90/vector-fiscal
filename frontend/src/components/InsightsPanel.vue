<template>
  <div class="space-y-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Insights list -->
    <div v-else-if="insights.length > 0" class="space-y-3">
      <div 
        v-for="insight in insights" 
        :key="insight.id"
        class="p-4 rounded-xl border transition-all hover:scale-[1.01]"
        :class="getInsightClasses(insight.type)"
      >
        <div class="flex items-start gap-3">
          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
            :class="getIconBgClass(insight.type)"
          >
            {{ insight.icon }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-white text-sm">{{ insight.title }}</p>
            <p class="text-slate-300 text-sm mt-0.5">{{ insight.message }}</p>
            <p v-if="insight.detail" class="text-slate-400 text-xs mt-1">{{ insight.detail }}</p>
            
            <!-- Action button -->
            <button 
              v-if="insight.action"
              @click="$emit('action', insight)"
              class="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="insight.action.type === 'primary' 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'"
            >
              {{ insight.action.text }}
            </button>

            <!-- Breakdown if available -->
            <div v-if="insight.breakdown" class="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div class="bg-slate-800/50 rounded-lg p-2 text-center">
                <p class="text-slate-400">Ventas</p>
                <p class="text-white font-mono font-semibold">${{ insight.breakdown.salesTax?.toLocaleString() }}</p>
              </div>
              <div class="bg-slate-800/50 rounded-lg p-2 text-center">
                <p class="text-slate-400">Aporte</p>
                <p class="text-white font-mono font-semibold">${{ insight.breakdown.incomeAdvance?.toLocaleString() }}</p>
              </div>
              <div class="bg-emerald-500/10 rounded-lg p-2 text-center">
                <p class="text-emerald-400">Ahorro</p>
                <p class="text-emerald-400 font-mono font-semibold">${{ insight.breakdown.potentialSavings?.toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
        <span class="text-2xl">🔮</span>
      </div>
      <p class="text-slate-400 text-sm">No hay insights disponibles</p>
      <p class="text-slate-500 text-xs mt-1">Registra más datos para obtener predicciones</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  insights: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['action'])

const getInsightClasses = (type) => {
  const classes = {
    urgent: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    positive: 'bg-emerald-500/10 border-emerald-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
    tip: 'bg-purple-500/10 border-purple-500/30'
  }
  return classes[type] || classes.info
}

const getIconBgClass = (type) => {
  const classes = {
    urgent: 'bg-red-500/20',
    warning: 'bg-amber-500/20',
    positive: 'bg-emerald-500/20',
    info: 'bg-blue-500/20',
    tip: 'bg-purple-500/20'
  }
  return classes[type] || classes.info
}
</script>

