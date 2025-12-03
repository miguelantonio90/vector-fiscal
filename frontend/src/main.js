import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Views
import Dashboard from './views/Dashboard.vue'
import Calendar from './views/Calendar.vue'
import Calculator from './views/Calculator.vue'
import Payments from './views/Payments.vue'
import Incomes from './views/Incomes.vue'
import Reports from './views/Reports.vue'
import Profile from './views/Profile.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Users from './views/Users.vue'
import CashFlow from './views/CashFlow.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  { path: '/register', name: 'Register', component: Register, meta: { public: true } },
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/calendario', name: 'Calendar', component: Calendar },
  { path: '/calculadora', name: 'Calculator', component: Calculator },
  { path: '/pagos', name: 'Payments', component: Payments },
  { path: '/ingresos', name: 'Incomes', component: Incomes },
  { path: '/flujo-caja', name: 'CashFlow', component: CashFlow },
  { path: '/reportes', name: 'Reports', component: Reports },
  { path: '/perfil', name: 'Profile', component: Profile },
  { path: '/usuarios', name: 'Users', component: Users, meta: { adminOnly: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard para proteger rutas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isPublicRoute = to.meta.public
  const isAdminRoute = to.meta.adminOnly
  
  if (!token && !isPublicRoute) {
    // No hay token y la ruta no es pública - redirigir a login
    next('/login')
  } else if (token && isPublicRoute) {
    // Hay token y está intentando acceder a login/register - redirigir a dashboard
    next('/')
  } else if (isAdminRoute) {
    // Verificar si el usuario es admin
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      if (userData.role !== 'admin') {
        // No es admin - redirigir a dashboard
        next('/')
        return
      }
    }
    next()
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
