# MiONAT - Sistema de Gestión Tributaria

Sistema web multi-usuario para gestionar pagos tributarios a la ONAT (Oficina Nacional de Administración Tributaria) de Cuba para el año fiscal 2025.

![MiONAT](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=flat-square&logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss)

## ✨ Características

### Sistema Multi-Usuario
- **Autenticación JWT**: Login seguro con token
- **Registro de usuarios**: Cada usuario se identifica por su NIT
- **Datos aislados**: Cada usuario solo ve sus propias obligaciones, pagos e ingresos
- **Perfil editable**: Cambiar nombre, NIT y contraseña

### Gestión Fiscal
- **Dashboard**: Vista general con progreso de obligaciones y métricas clave
- **Calendario**: Visualización de fechas límite con indicadores de estado
- **Calculadora**: Cálculo automático de impuestos según la Ley 174/2025
- **Pagos**: Registro y edición de pagos con bonificaciones
- **Ingresos**: Registro mensual de ingresos con gráfico de evolución
- **Reportes**: Resumen fiscal exportable a PDF

### Notificaciones
- **Alertas en tiempo real**: Popup con próximos vencimientos
- **Indicadores de urgencia**: Colores según días restantes
- **Badge dinámico**: Contador de obligaciones pendientes

## 📁 Estructura del Proyecto

```
mionat/
├── backend/                    # API Node.js + Express
│   └── src/
│       ├── config/            # Configuración de base de datos
│       ├── controllers/       # Lógica de negocio
│       ├── middleware/        # Autenticación JWT
│       ├── models/            # Modelos MongoDB (User, Obligation, Payment, Income)
│       ├── routes/            # Rutas de la API
│       └── utils/             # Calculadora de impuestos
│
└── frontend/                   # Vue.js 3 + Vite
    └── src/
        ├── services/          # Cliente API con interceptores
        └── views/             # Vistas (Dashboard, Calendar, Payments, etc.)
```

## 🚀 Instalación

### Requisitos
- Node.js 18+
- MongoDB 6+
- npm o yarn

### Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mionat
JWT_SECRET=tu-clave-secreta-aqui
JWT_EXPIRES_IN=30d
```

Iniciar servidor:
```bash
npm run dev
# o con nodemon
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔐 Autenticación

### Registro de Usuario
```bash
POST /api/auth/register
{
  "name": "Tu Nombre",
  "nit": "12345678901",
  "password": "tu-contraseña"
}
```

### Login
```bash
POST /api/auth/login
{
  "nit": "12345678901",
  "password": "tu-contraseña"
}
# Respuesta: { token: "jwt...", user: {...} }
```

### Rutas Protegidas
Todas las rutas (excepto `/auth/login` y `/auth/register`) requieren el header:
```
Authorization: Bearer <token>
```

## 📡 API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| PUT | `/api/auth/profile` | Actualizar nombre y NIT |
| PUT | `/api/auth/password` | Cambiar contraseña |

### Obligaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/obligations` | Listar obligaciones |
| GET | `/api/obligations/upcoming` | Próximos vencimientos |
| GET | `/api/obligations/summary` | Resumen del año |
| POST | `/api/obligations/import` | Importar obligaciones 2025 |
| PUT | `/api/obligations/:id` | Actualizar obligación |

### Pagos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/payments` | Listar pagos |
| POST | `/api/payments` | Registrar pago |
| PUT | `/api/payments/:id` | Editar pago |
| DELETE | `/api/payments/:id` | Eliminar pago |
| GET | `/api/payments/summary` | Resumen de pagos |

### Ingresos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/incomes` | Listar ingresos |
| POST | `/api/incomes` | Crear/actualizar ingreso mensual |
| GET | `/api/incomes/summary` | Resumen anual |

### Calculadora
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/calculator/monthly` | Calcular impuestos mensuales |
| POST | `/api/calculator/income-advance` | Calcular aporte 0510122 |
| POST | `/api/calculator/bonus` | Calcular bonificaciones |
| GET | `/api/calculator/rates` | Obtener tasas vigentes |

## 💰 Tributos Incluidos

| Código | Descripción | Periodicidad | Cálculo |
|--------|-------------|--------------|---------|
| 0114022 | Impuesto s/ ventas y servicios (PN) | Mensual | 10% sobre ingresos brutos |
| 0510122 | Aporte a cuenta Imp. Ingresos Personales | Mensual | 5% sobre ingresos > 3,260 CUP |
| 0820132 | Pago trimestral | Trimestral | 1,200 CUP fijo |

## 🎁 Bonificaciones

| Tipo | Descuento | Condición |
|------|-----------|-----------|
| Pago anticipado | 5% | Pagar antes de la fecha límite |
| Transfermóvil | 3% | Usar Transfermóvil como método de pago |
| **Combinado** | **8%** | Ambas condiciones |

### Modos de Registro de Bonificación
1. **Sin bonificación**: El monto ingresado es el final
2. **Ya incluida**: Ingresar monto pagado + ahorro en CUP
3. **Calcular automático**: El sistema calcula según método y fecha

## 🛠 Tecnologías

### Backend
- **Node.js** + **Express**: Servidor API REST
- **MongoDB** + **Mongoose**: Base de datos y ODM
- **JWT**: Autenticación con tokens
- **bcryptjs**: Hash de contraseñas

### Frontend
- **Vue.js 3**: Framework reactivo con Composition API
- **Vite**: Build tool ultra-rápido
- **TailwindCSS**: Estilos utility-first
- **Vue Router**: Navegación SPA
- **Axios**: Cliente HTTP

### Diseño
- Tema oscuro con acentos en verde esmeralda
- Fuentes: Playfair Display, Source Sans 3, JetBrains Mono
- Diseño responsive y moderno
- Animaciones suaves

## 📱 Capturas de Pantalla

### Dashboard
- Resumen fiscal con progreso circular
- Métricas: Total, Pagado, Pendiente, Ahorro
- Lista de obligaciones pendientes
- Acciones rápidas

### Perfil
- Edición de nombre y NIT
- Cambio de contraseña
- Importación de obligaciones
- Estadísticas de actividad

### Notificaciones
- Popup con próximos vencimientos
- Indicadores de urgencia por color
- Enlace rápido al calendario

## 🚀 Deploy en Producción (Render + MongoDB Atlas)

### Paso 1: Crear base de datos en MongoDB Atlas (Gratis)

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) y crea una cuenta
2. Crea un nuevo cluster gratuito (M0 Sandbox)
3. En "Database Access", crea un usuario con contraseña
4. En "Network Access", agrega `0.0.0.0/0` para permitir conexiones desde cualquier IP
5. En "Connect", selecciona "Connect your application" y copia la URI:
   ```
   mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/mionat?retryWrites=true&w=majority
   ```

### Paso 2: Deploy en Render (Gratis)

#### Opción A: Deploy automático con Blueprint

1. Haz fork de este repositorio en GitHub
2. Ve a [Render Dashboard](https://dashboard.render.com)
3. Click en "New" → "Blueprint"
4. Conecta tu repositorio de GitHub
5. Render detectará el archivo `render.yaml` y creará los servicios automáticamente
6. Configura la variable `MONGODB_URI` con tu URI de Atlas

#### Opción B: Deploy manual

**Backend (Web Service):**
1. New → Web Service
2. Conecta tu repositorio
3. Configuración:
   - Name: `mionat-api`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
4. Variables de entorno:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...tu-uri-de-atlas...
   JWT_SECRET=una-clave-secreta-muy-larga-y-segura
   JWT_EXPIRES_IN=30d
   FRONTEND_URL=https://mionat.onrender.com
   ```

**Frontend (Static Site):**
1. New → Static Site
2. Conecta tu repositorio
3. Configuración:
   - Name: `mionat`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Variables de entorno:
   ```
   VITE_API_URL=https://mionat-api.onrender.com/api
   ```
5. En "Redirects/Rewrites", agrega:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite

### URLs de producción

Una vez desplegado, tu app estará disponible en:
- **Frontend**: https://mionat.onrender.com
- **Backend API**: https://mionat-api.onrender.com/api
- **Health Check**: https://mionat-api.onrender.com/api/health

### ⚠️ Notas importantes

- Los servicios gratuitos de Render se "duermen" después de 15 minutos de inactividad
- El primer request después de inactividad puede tardar 30-60 segundos
- MongoDB Atlas gratis tiene límite de 512MB de almacenamiento

## 📄 Licencia

Proyecto de uso personal desarrollado para la gestión tributaria en Cuba.

---

**Desarrollado con ❤️ para contribuyentes cubanos**
