<template>
  <nav class="navbar">
    <div class="navbar-content">
      <router-link to="/dashboard" class="navbar-brand">
        <h1>Team Builder</h1>
      </router-link>

      <div class="navbar-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/project/new" class="nav-link">New Project</router-link>
        <div class="user-menu">
          <span class="username">{{ authStore.user?.username }}</span>
          <button @click="handleLogout" class="btn btn-sm btn-secondary">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  background-color: #1F2937;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  text-decoration: none;
  color: white;
}

.navbar-brand h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: #D1D5DB;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: white;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  color: #D1D5DB;
  font-weight: 500;
}
</style>
