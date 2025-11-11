<template>
  <div class="auth-container">
    <div class="auth-card card">
      <h2 class="text-center mb-4">Login with Email Link</h2>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <p class="text-center mb-4" style="color: #6B7280;">
        Enter your email address and we'll send you a magic link to login.
      </p>

      <form @submit.prevent="handleSubmit">
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

        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          <span v-if="loading" class="loading"></span>
          <span v-else>Send Magic Link</span>
        </button>
      </form>

      <p class="text-center mt-3">
        <router-link to="/login" class="link">Back to Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const email = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const result = await authStore.requestMagicLink(email.value);
    success.value = result.message;
    email.value = '';
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
