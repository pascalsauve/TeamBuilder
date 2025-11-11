import { defineStore } from 'pinia';
import { teamsAPI } from '../services/api';

export const useTeamsStore = defineStore('teams', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
  }),

  actions: {
    async fetchProjects() {
      this.loading = true;
      try {
        const response = await teamsAPI.getAll();
        this.projects = response.data.projects;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch projects';
      } finally {
        this.loading = false;
      }
    },

    async fetchProject(id) {
      this.loading = true;
      try {
        const response = await teamsAPI.getOne(id);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch project';
      } finally {
        this.loading = false;
      }
    },

    async createProject(data) {
      try {
        const response = await teamsAPI.create(data);
        this.projects.unshift(response.data.project);
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to create project';
      }
    },

    async updateProject(id, data) {
      try {
        const response = await teamsAPI.update(id, data);
        this.currentProject = response.data.project;
        const index = this.projects.findIndex(p => p._id === id);
        if (index !== -1) {
          this.projects[index] = response.data.project;
        }
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to update project';
      }
    },

    async deleteProject(id) {
      try {
        await teamsAPI.delete(id);
        this.projects = this.projects.filter(p => p._id !== id);
        if (this.currentProject?._id === id) {
          this.currentProject = null;
        }
      } catch (error) {
        throw error.response?.data?.error || 'Failed to delete project';
      }
    },

    async addParticipant(id, participant) {
      try {
        const response = await teamsAPI.addParticipant(id, participant);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to add participant';
      }
    },

    async removeParticipant(id, participantId) {
      try {
        const response = await teamsAPI.removeParticipant(id, participantId);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to remove participant';
      }
    },

    async addConstraint(id, constraint) {
      try {
        const response = await teamsAPI.addConstraint(id, constraint);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to add constraint';
      }
    },

    async removeConstraint(id, constraintId) {
      try {
        const response = await teamsAPI.removeConstraint(id, constraintId);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to remove constraint';
      }
    },

    async optimizeTeams(id) {
      try {
        const response = await teamsAPI.optimize(id);
        this.currentProject = response.data.project;
        return {
          project: response.data.project,
          optimization: response.data.optimization,
        };
      } catch (error) {
        throw error.response?.data?.error || error.response?.data?.details || 'Failed to optimize teams';
      }
    },

    async updateTeams(id, teams) {
      try {
        const response = await teamsAPI.updateTeams(id, teams);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to update teams';
      }
    },
  },
});
