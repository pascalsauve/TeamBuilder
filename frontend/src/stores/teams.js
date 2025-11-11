import { defineStore } from 'pinia';
import { teamsAPI, exportAPI } from '../services/api';

export const useTeamsStore = defineStore('teams', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    stats: null,
    history: [],
  }),

  getters: {
    hasGeneratedTeams: (state) => {
      return state.currentProject?.generatedTeams?.length > 0;
    },
  },

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

    // Export/Import Methods
    async exportTeamsCSV(id) {
      try {
        const response = await exportAPI.exportTeamsCSV(id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `teams-${id}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        throw error.response?.data?.error || 'Failed to export teams CSV';
      }
    },

    async exportParticipantsCSV(id) {
      try {
        const response = await exportAPI.exportParticipantsCSV(id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `participants-${id}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        throw error.response?.data?.error || 'Failed to export participants CSV';
      }
    },

    async exportTeamsPDF(id) {
      try {
        const response = await exportAPI.exportTeamsPDF(id);
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `teams-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        throw error.response?.data?.error || 'Failed to export teams PDF';
      }
    },

    async importParticipants(id, file) {
      try {
        const response = await exportAPI.importParticipants(id, file);
        this.currentProject = response.data.project;
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to import participants';
      }
    },

    async downloadSampleCSV() {
      try {
        const response = await exportAPI.getSampleCSV();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sample-participants.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        throw error.response?.data?.error || 'Failed to download sample CSV';
      }
    },

    // Statistics Methods
    async fetchStats(id) {
      try {
        const response = await exportAPI.getStats(id);
        this.stats = response.data;
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch statistics';
      }
    },

    // History & Versioning Methods
    async saveVersion(id, notes) {
      try {
        const response = await teamsAPI.saveVersion(id, notes);
        this.currentProject = response.data.project;
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to save version';
      }
    },

    async fetchHistory(id) {
      try {
        const response = await teamsAPI.getHistory(id);
        this.history = response.data.history;
        return response.data.history;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to fetch history';
      }
    },

    async restoreVersion(id, version) {
      try {
        const response = await teamsAPI.restoreVersion(id, version);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to restore version';
      }
    },

    async deleteVersion(id, version) {
      try {
        const response = await teamsAPI.deleteVersion(id, version);
        this.history = response.data.history;
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to delete version';
      }
    },

    // Notification Methods
    async sendNotifications(id) {
      try {
        const response = await teamsAPI.sendNotifications(id);
        this.currentProject = response.data.project;
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to send notifications';
      }
    },

    async updateNotificationSettings(id, settings) {
      try {
        const response = await teamsAPI.updateNotificationSettings(id, settings);
        this.currentProject = response.data.project;
        return response.data.project;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to update notification settings';
      }
    },
  },
});
