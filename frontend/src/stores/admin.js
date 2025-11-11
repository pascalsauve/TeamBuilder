import { defineStore } from 'pinia';
import { adminAPI } from '../services/api';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    projects: [],
    stats: null,
    loading: false,
  }),

  actions: {
    async fetchUsers() {
      this.loading = true;
      try {
        const response = await adminAPI.getUsers();
        this.users = response.data.users;
        return response.data.users;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch users';
      } finally {
        this.loading = false;
      }
    },

    async fetchUser(id) {
      try {
        const response = await adminAPI.getUser(id);
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch user';
      }
    },

    async updateUserRole(id, role) {
      try {
        const response = await adminAPI.updateUserRole(id, role);
        // Update in local state
        const index = this.users.findIndex(u => u._id === id);
        if (index !== -1) {
          this.users[index].role = role;
        }
        return response.data.user;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to update user role';
      }
    },

    async deleteUser(id) {
      try {
        await adminAPI.deleteUser(id);
        // Remove from local state
        this.users = this.users.filter(u => u._id !== id);
      } catch (error) {
        throw error.response?.data?.error || 'Failed to delete user';
      }
    },

    async fetchProjects() {
      this.loading = true;
      try {
        const response = await adminAPI.getProjects();
        this.projects = response.data.projects;
        return response.data.projects;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch projects';
      } finally {
        this.loading = false;
      }
    },

    async fetchStats() {
      try {
        const response = await adminAPI.getStats();
        this.stats = response.data;
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch statistics';
      }
    },
  },
});
