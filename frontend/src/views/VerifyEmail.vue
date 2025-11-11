<template>
  <div class="auth-container">
    <div class="auth-card card text-center">
      <h2 class="mb-4">Email Verification</h2>

      <div v-if="loading">
        <div class="loading-large"></div>
        <p class="mt-3">Verifying your email...</p>
      </div>

      <div v-else-if="error" class="alert alert-error">
        {{ error }}
        <p class="mt-3">
          <router-link to="/login" class="link">Return to Login</router-link>
        </p>
      </div>

      <div v-else-if="success">
        <div class="success-icon">✓</div>
        <div class="alert alert-success">{{ success }}</div>
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref('');
const success = ref('');

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    error.value = 'No verification token provided';
    loading.value = false;
    return;
  }

  try {
    const result = await authStore.verifyEmail(token);
    success.value = result.message;
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
});
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

.loading-large {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 5px solid rgba(79, 70, 229, 0.3);
  border-radius: 50%;
  border-top-color: #4F46E5;
  animation: spin 1s ease-in-out infinite;
}

.success-icon {
  font-size: 4rem;
  color: #059669;
  margin-bottom: 1rem;
}

.link {
  color: #4F46E5;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
