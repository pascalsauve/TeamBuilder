import { defineStore } from 'pinia';
import { authAPI } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async register(username, email, password) {
      try {
        const response = await authAPI.register({ username, email, password });
        return { success: true, message: response.data.message };
      } catch (error) {
        throw error.response?.data?.error || 'Registration failed';
      }
    },

    async login(username, password) {
      try {
        const response = await authAPI.login({ username, password });
        this.setAuth(response.data.token, response.data.user);
        return { success: true };
      } catch (error) {
        throw error.response?.data?.error || 'Login failed';
      }
    },

    async verifyEmail(token) {
      try {
        const response = await authAPI.verifyEmail(token);
        this.setAuth(response.data.token, response.data.user);
        return { success: true, message: response.data.message };
      } catch (error) {
        throw error.response?.data?.error || 'Verification failed';
      }
    },

    async requestMagicLink(email) {
      try {
        const response = await authAPI.requestMagicLink(email);
        return { success: true, message: response.data.message };
      } catch (error) {
        throw error.response?.data?.error || 'Request failed';
      }
    },

    async verifyMagicLink(token) {
      try {
        const response = await authAPI.verifyMagicLink(token);
        this.setAuth(response.data.token, response.data.user);
        return { success: true };
      } catch (error) {
        throw error.response?.data?.error || 'Verification failed';
      }
    },

    setAuth(token, user) {
      this.token = token;
      this.user = user;
      this.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },

    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
