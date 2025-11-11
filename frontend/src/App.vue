<template>
  <div id="app">
    <Navbar v-if="authStore.isAuthenticated" />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth';
import Navbar from './components/Navbar.vue';

const authStore = useAuthStore();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #4F46E5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338CA;
}

.btn-secondary {
  background-color: #6B7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4B5563;
}

.btn-danger {
  background-color: #DC2626;
  color: white;
}

.btn-danger:hover {
  background-color: #B91C1C;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Forms */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* Cards */
.card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.alert-success {
  background-color: #D1FAE5;
  color: #065F46;
  border: 1px solid #6EE7B7;
}

.alert-error {
  background-color: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FCA5A5;
}

.alert-info {
  background-color: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #93C5FD;
}

/* Utility classes */
.text-center {
  text-align: center;
}

.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 2rem; }

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 1rem;
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
