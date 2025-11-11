<template>
  <div class="auth-container">
    <div class="auth-card card">
      <h2 class="text-center mb-4">Login to Team Builder</h2>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Username or Email</label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            placeholder="Enter your username or email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          <span v-if="loading" class="loading"></span>
          <span v-else>Login</span>
        </button>
      </form>

      <div class="divider">OR</div>

      <router-link to="/magic-link" class="btn btn-secondary" style="width: 100%; margin-bottom: 1rem;">
        Login with Email Link
      </router-link>

      <p class="text-center mt-3">
        Don't have an account?
        <router-link to="/register" class="link">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await authStore.login(username.value, password.value);
    success.value = 'Login successful! Redirecting...';
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 4rem);
}

.auth-card {
  width: 100%;
  max-width: 450px;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #6B7280;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background-color: #D1D5DB;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.link {
  color: #4F46E5;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>
