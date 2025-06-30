import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import AG-Grid styles
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

// Import global styles
import './assets/styles/main.css'

// Router configuration
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('./components/Dashboard.vue')
  },
  {
    path: '/widget/:id',
    name: 'Widget',
    component: () => import('./components/PlotWidget.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Pinia store setup
const pinia = createPinia()

// Create Vue application
const app = createApp(App)

// Install plugins
app.use(router)
app.use(pinia)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component instance:', instance)
  console.error('Error info:', info)
}

// Global properties
app.config.globalProperties.$appName = 'WebGL Dashboard'
app.config.globalProperties.$version = '1.0.0'

// Development tools
if (import.meta.env.DEV) {
  app.config.performance = true
  console.log('🚀 WebGL Dashboard starting in development mode')
}

// Mount the application
app.mount('#app')

// Export app instance for testing
export default app