<template>
  <div id="app" class="app-container">
    <!-- Application Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="app-title">
            <span class="title-icon">📊</span>
            WebGL Dashboard
          </h1>
          <span class="version-badge">v{{ appVersion }}</span>
        </div>
        
        <nav class="header-nav">
          <router-link 
            to="/" 
            class="nav-link"
            :class="{ active: $route.name === 'Dashboard' }"
          >
            <span class="nav-icon">🏠</span>
            Dashboard
          </router-link>
        </nav>

        <div class="header-actions">
          <button 
            class="action-btn"
            @click="toggleTheme"
            :title="`Switch to ${isDark ? 'light' : 'dark'} theme`"
          >
            <span class="action-icon">{{ isDark ? '☀️' : '🌙' }}</span>
          </button>
          
          <button 
            class="action-btn"
            @click="showAbout = true"
            title="About"
          >
            <span class="action-icon">ℹ️</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-main">
      <div class="content-wrapper">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p class="loading-text">Loading dashboard...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="error-state">
          <div class="error-content">
            <span class="error-icon">⚠️</span>
            <h2>Something went wrong</h2>
            <p>{{ errorMessage }}</p>
            <button class="retry-btn" @click="retryLoad">
              Try Again
            </button>
          </div>
        </div>

        <!-- Router View -->
        <router-view 
          v-else
          class="router-content"
          :key="$route.fullPath"
        />
      </div>
    </main>

    <!-- Application Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">
          <span class="copyright">
            © 2024 WebGL Dashboard. Built with Vue 3 & WebGL-Plot.
          </span>
        </div>
        
        <div class="footer-right">
          <span class="status-indicator" :class="{ online: isOnline }">
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
        </div>
      </div>
    </footer>

    <!-- About Modal -->
    <div v-if="showAbout" class="modal-overlay" @click="showAbout = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>About WebGL Dashboard</h3>
          <button class="close-btn" @click="showAbout = false">×</button>
        </div>
        <div class="modal-body">
          <p>A high-performance dashboard application for data visualization using WebGL.</p>
          <h4>Features:</h4>
          <ul>
            <li>Customizable plot widgets with WebGL rendering</li>
            <li>Resizable and movable grid layout</li>
            <li>Multiple data sources and real-time updates</li>
            <li>Semi-logarithmic axis support</li>
            <li>Configurable legends and styling</li>
          </ul>
          <h4>Technology Stack:</h4>
          <ul>
            <li>Vue.js 3 with Composition API</li>
            <li>AG-Grid for layout management</li>
            <li>WebGL-Plot for high-performance rendering</li>
            <li>Pinia for state management</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// Reactive state
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const showAbout = ref(false)
const isDark = ref(false)
const isOnline = ref(navigator.onLine)

// Computed properties
const appVersion = computed(() => '1.0.0')

// Router instance
const router = useRouter()

// Theme management
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme from localStorage
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // Use system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

// Network status handlers
const handleOnline = () => {
  isOnline.value = true
}

const handleOffline = () => {
  isOnline.value = false
}

// Error handling
const retryLoad = () => {
  hasError.value = false
  isLoading.value = true
  // Simulate reload
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

// Global error handler
const handleGlobalError = (error) => {
  console.error('Application error:', error)
  hasError.value = true
  errorMessage.value = error.message || 'An unexpected error occurred'
  isLoading.value = false
}

// Lifecycle hooks
onMounted(() => {
  // Initialize theme
  initTheme()
  
  // Add event listeners
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', (event) => {
    handleGlobalError(event.reason)
  })
  
  // Simulate initial loading
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
  
  console.log('🎉 WebGL Dashboard App mounted successfully')
})

onUnmounted(() => {
  // Cleanup event listeners
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('error', handleGlobalError)
})

// Watch for route changes to handle loading states
router.beforeEach((to, from, next) => {
  if (to.name !== from.name) {
    isLoading.value = true
  }
  next()
})

router.afterEach(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Header Styles */
.app-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.title-icon {
  font-size: 1.8rem;
}

.version-badge {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.header-nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  background: var(--primary-color);
  color: white;
}

.nav-icon {
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.action-icon {
  font-size: 1.2rem;
}

/* Main Content */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
}

.router-content {
  height: 100%;
  min-height: 600px;
}

/* Loading State */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  z-index: 999;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  color: var(--text-secondary);
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: var(--primary-dark);
}

/* Footer */
.app-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
}

.status-indicator.online::before {
  background: #28a745;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--bg-hover);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body h4 {
  color: var(--primary-color);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.modal-body ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.modal-body li {
  margin-bottom: 0.25rem;
  color: var(--text-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .content-wrapper {
    padding: 1rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .modal-content {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
}
</style>