import { ref, computed, unref } from 'vue'
import { incomesApi, obligationsApi } from '../services/api'
import { calculateLateFee } from '../utils/businessDays'

/**
 * Totales a depositar: ingresos + impuestos mensuales + trimestrales $1200 + mora.
 * @param {import('vue').Ref<number>|number} yearRef - año fiscal
 */
export function useDepositTotals(yearRef) {
  const loading = ref(false)
  const ingresos = ref([])
  const obligaciones = ref([])

  function getYear() {
    return unref(yearRef) || new Date().getFullYear()
  }

  function getAdjustedDueDay(year, monthIndex) {
    const d = new Date(year, monthIndex, 20)
    const dow = d.getDay()
    return dow === 0 ? 22 : dow === 6 ? 21 : 20
  }

  function getMonthlyDueDateObj(mesNumero, year = getYear()) {
    const nextMonth = mesNumero === 12 ? 1 : mesNumero + 1
    const nextYear = mesNumero === 12 ? year + 1 : year
    const day = getAdjustedDueDay(nextYear, nextMonth - 1)
    return new Date(nextYear, nextMonth - 1, day)
  }

  function getQuarterlyDueDateObj(mesNumero, year = getYear()) {
    const qEnd = mesNumero <= 3 ? 3 : mesNumero <= 6 ? 6 : mesNumero <= 9 ? 9 : 12
    const dueMonth = qEnd === 12 ? 1 : qEnd + 1
    const dueYear = qEnd === 12 ? year + 1 : year
    const day = getAdjustedDueDay(dueYear, dueMonth - 1)
    return new Date(dueYear, dueMonth - 1, day)
  }

  function calcSurcharge(principal, dueDate) {
    return calculateLateFee(principal, dueDate)
  }

  const monthNames = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  function dueDateForMonth(mesNumero) {
    const name = monthNames[mesNumero]
    const obl = obligaciones.value.find(o =>
      o.tributeCode === '0114022' &&
      o.dueDate &&
      String(o.period || '').toLowerCase().startsWith(name + ':')
    )
    return obl?.dueDate || getMonthlyDueDateObj(mesNumero)
  }

  function cargosDelMes(mesNumero) {
    const ingreso = ingresos.value.find(ing => ing.month === mesNumero)
    const amount = ingreso?.amount || ingreso?.grossIncome || 0
    if (!amount) return { ventas: 0, aporte: 0, principal: 0, mora: 0, total: 0 }

    const ventas = Math.round(amount * 0.10 * 100) / 100
    const aporte = amount > 3260 ? Math.round((amount - 3260) * 0.05 * 100) / 100 : 0
    const due = dueDateForMonth(mesNumero)
    const moraVentas = calcSurcharge(ventas, due)?.amount || 0
    const moraAporte = calcSurcharge(aporte, due)?.amount || 0
    const principal = Math.round((ventas + aporte) * 100) / 100
    const mora = Math.round((moraVentas + moraAporte) * 100) / 100
    return {
      ventas,
      aporte,
      principal,
      mora,
      total: Math.round((principal + mora) * 100) / 100
    }
  }

  const totalIngresos = computed(() =>
    ingresos.value.reduce((sum, ing) => sum + (ing.amount || ing.grossIncome || 0), 0)
  )

  const trimestralesPendientes = computed(() => {
    return obligaciones.value
      .filter(o => o.tributeCode === '0820132' && o.status !== 'pagado')
      .map(o => {
        const principal = o.amount > 0 ? o.amount : 1200
        const due = o.dueDate ? new Date(o.dueDate) : getQuarterlyDueDateObj(3)
        const mora = calcSurcharge(principal, due)?.amount || 0
        return {
          _id: o._id,
          period: o.period || 'Trimestre',
          principal,
          mora,
          total: Math.round((principal + mora) * 100) / 100,
          dueDate: due
        }
      })
      .sort((a, b) => a.dueDate - b.dueDate)
  })

  const totalMensualesPrincipal = computed(() =>
    ingresos.value.reduce((sum, ing) => sum + cargosDelMes(ing.month).principal, 0)
  )

  const totalMensualesMora = computed(() =>
    ingresos.value.reduce((sum, ing) => sum + cargosDelMes(ing.month).mora, 0)
  )

  const totalTrimestralPrincipal = computed(() =>
    trimestralesPendientes.value.reduce((sum, t) => sum + t.principal, 0)
  )

  const totalTrimestralMora = computed(() =>
    trimestralesPendientes.value.reduce((sum, t) => sum + t.mora, 0)
  )

  const totalMora = computed(() =>
    Math.round((totalMensualesMora.value + totalTrimestralMora.value) * 100) / 100
  )

  const totalADepositar = computed(() =>
    Math.round((
      totalMensualesPrincipal.value +
      totalTrimestralPrincipal.value +
      totalMora.value
    ) * 100) / 100
  )

  async function loadDepositTotals(year = getYear()) {
    loading.value = true
    try {
      const [incomesRes, obligationsRes] = await Promise.all([
        incomesApi.getAll({ year }),
        obligationsApi.getAll({ year })
      ])
      ingresos.value = (incomesRes.data || []).map(ing => ({
        ...ing,
        amount: ing.grossIncome || ing.amount || 0
      }))
      obligaciones.value = obligationsRes.data || []
    } catch (error) {
      console.error('Error loading deposit totals:', error)
      ingresos.value = []
      obligaciones.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    ingresos,
    obligaciones,
    cargosDelMes,
    calcSurcharge,
    getMonthlyDueDateObj,
    getQuarterlyDueDateObj,
    totalIngresos,
    trimestralesPendientes,
    totalMensualesPrincipal,
    totalMensualesMora,
    totalTrimestralPrincipal,
    totalTrimestralMora,
    totalMora,
    totalADepositar,
    loadDepositTotals
  }
}
