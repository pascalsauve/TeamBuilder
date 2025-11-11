<template>
  <div class="auth-container">
    <div class="auth-card card">
      <h2 class="text-center mb-4">Create Account</h2>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            placeholder="Choose a username"
            required
            minlength="3"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Choose a password (min 6 characters)"
            required
            minlength="6"
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          <span v-if="loading" class="loading"></span>
          <span v-else>Register</span>
        </button>
      </form>

      <p class="text-center mt-3">
        Already have an account?
        <router-link to="/login" class="link">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

const handleRegister = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const result = await authStore.register(username.value, email.value, password.value);
    success.value = result.message;
    username.value = '';
    email.value = '';
    password.value = '';
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

.link {
  color: #4F46E5;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>
