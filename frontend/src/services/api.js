import axios from 'axios'

// En desarrollo usa el proxy de Vite, en producción usa la URL del backend
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado - limpiar y redirigir a login
      // Solo redirigir si NO estamos ya en una ruta pública (login/register)
      const isPublicRoute = window.location.pathname === '/login' || window.location.pathname === '/register'
      if (!isPublicRoute) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (nit, password) => api.post('/auth/login', { nit, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (name, nit) => api.put('/auth/profile', { name, nit }),
  changePassword: (currentPassword, newPassword) => api.put('/auth/password', { currentPassword, newPassword }),
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
}

// Obligations API
export const obligationsApi = {
  getAll: (params = {}) => api.get('/obligations', { params }),
  getById: (id) => api.get(`/obligations/${id}`),
  create: (data) => api.post('/obligations', data),
  update: (id, data) => api.put(`/obligations/${id}`, data),
  delete: (id) => api.delete(`/obligations/${id}`),
  getUpcoming: () => api.get('/obligations/upcoming'),
  getOverdue: () => api.get('/obligations/overdue'),
  getSummary: (year = 2025) => api.get('/obligations/summary', { params: { year } }),
  importVectorFiscal: () => api.post('/obligations/import')
}

// Payments API
export const paymentsApi = {
  getAll: (params = {}) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  getSummary: (year = 2025) => api.get('/payments/summary', { params: { year } })
}

// Incomes API
export const incomesApi = {
  getAll: (params = {}) => api.get('/incomes', { params }),
  getByMonthYear: (month, year) => api.get(`/incomes/${month}/${year}`),
  upsert: (data) => api.post('/incomes', data),
  delete: (month, year) => api.delete(`/incomes/${month}/${year}`),
  getAnnualSummary: (year = 2025) => api.get('/incomes/summary', { params: { year } })
}

// Calculator API
export const calculatorApi = {
  calculateMonthly: (grossIncome) => 
    api.post('/calculator/monthly', { grossIncome }),
  calculateAnnual: (monthlyIncomes = null, averageMonthlyIncome = null) => 
    api.post('/calculator/annual', { monthlyIncomes, averageMonthlyIncome }),
  calculateIncomeAdvance: (grossIncome) =>
    api.post('/calculator/income-advance', { grossIncome }),
  calculateBonus: (amount, isEarlyPayment = false, useTransfermovil = false) => 
    api.post('/calculator/bonus', { amount, isEarlyPayment, useTransfermovil }),
  getRates: () => api.get('/calculator/rates')
}

// Alerts API
export const alertsApi = {
  getAll: (params = {}) => api.get('/alerts', { params }),
  getSummary: () => api.get('/alerts/summary'),
  generate: () => api.post('/alerts/generate'),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  delete: (id) => api.delete(`/alerts/${id}`)
}

// Users API (Admin only)
export const usersApi = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats')
}

// Predictions API (AI/Estimaciones)
export const predictionsApi = {
  // Predicción de ingresos futuros
  predictIncome: (months = 3) => api.get('/predictions/income', { params: { months } }),
  
  // Estimación de impuestos futuros
  estimateTaxes: (months = 3) => api.get('/predictions/taxes', { params: { months } }),
  
  // Análisis de flujo de caja
  getCashFlow: (year = new Date().getFullYear()) => api.get('/predictions/cashflow', { params: { year } }),
  
  // Insights para el dashboard
  getInsights: () => api.get('/predictions/insights'),
  
  // Calcular impuestos para un ingreso específico
  calculate: (income, includeBonus = true) => api.post('/predictions/calculate', { income, includeBonus }),
  
  // Resumen completo de predicciones
  getSummary: (year = new Date().getFullYear()) => api.get('/predictions/summary', { params: { year } }),
  
  // Declaración Jurada Anual (DJ-08)
  getAnnualDeclaration: (year = new Date().getFullYear() - 1) => api.get('/predictions/annual-declaration', { params: { year } })
}

export default api
