import { computed, ref } from 'vue'

/** Rutas que piden datos al entrar. El resto no muestra máscara. */
const FETCH_ROUTES = new Set([
  'Dashboard',
  'Calendar',
  'Payments',
  'Incomes',
  'CashFlow',
  'AnnualDeclaration',
  'Reports',
  'VectorFiscal',
  'Users',
  'Profile'
])

export const pageLoading = ref(false)
const activeRoute = ref('')

export function markRouteLoading(name) {
  activeRoute.value = name || ''
  pageLoading.value = FETCH_ROUTES.has(name)
}

/**
 * Misma bandera que usa cada vista (`loading`), ligada a la máscara global.
 * Un finally de la página anterior no apaga la máscara de la página nueva.
 */
export function usePageLoading(routeName) {
  return computed({
    get: () => pageLoading.value && activeRoute.value === routeName,
    set(value) {
      if (value) {
        activeRoute.value = routeName
        pageLoading.value = true
        return
      }
      if (activeRoute.value === routeName) {
        pageLoading.value = false
      }
    }
  })
}
