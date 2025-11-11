<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Your Team Projects</h1>
      <div class="header-actions">
        <router-link v-if="authStore.isAdmin" to="/admin" class="btn btn-secondary">
          Admin Panel
        </router-link>
        <router-link to="/project/new" class="btn btn-primary">
          Create New Project
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-large"></div>
      <p>Loading projects...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <div v-else-if="teamsStore.projects.length === 0" class="empty-state card">
      <h2>No Projects Yet</h2>
      <p>Create your first hackathon team project to get started!</p>
      <router-link to="/project/new" class="btn btn-primary mt-3">
        Create Your First Project
      </router-link>
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="project in teamsStore.projects"
        :key="project._id"
        class="project-card card"
      >
        <div class="project-header">
          <h3>{{ project.projectName }}</h3>
          <div class="project-status">
            <span v-if="project.isOptimized" class="badge badge-success">Optimized</span>
            <span v-else class="badge badge-warning">Not Optimized</span>
          </div>
        </div>

        <div class="project-stats">
          <div class="stat">
            <span class="stat-label">Participants:</span>
            <span class="stat-value">{{ project.participants.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Team Size:</span>
            <span class="stat-value">{{ project.teamSize }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Teams:</span>
            <span class="stat-value">{{ project.numberOfTeams }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Constraints:</span>
            <span class="stat-value">{{ project.constraints.length }}</span>
          </div>
        </div>

        <div class="project-footer">
          <router-link :to="`/project/${project._id}`" class="btn btn-primary btn-sm">
            View Project
          </router-link>
          <button @click="deleteProject(project._id)" class="btn btn-danger btn-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTeamsStore } from '../stores/teams';
import { useAuthStore } from '../stores/auth';

const teamsStore = useTeamsStore();
const authStore = useAuthStore();
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    await teamsStore.fetchProjects();
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
});

const deleteProject = async (id) => {
  if (!confirm('Are you sure you want to delete this project?')) return;

  try {
    await teamsStore.deleteProject(id);
  } catch (err) {
    alert(err);
  }
};
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  color: #1F2937;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.loading-container {
  text-align: center;
  padding: 4rem 0;
}

.loading-large {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 5px solid rgba(79, 70, 229, 0.3);
  border-radius: 50%;
  border-top-color: #4F46E5;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state h2 {
  color: #6B7280;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #9CA3AF;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.project-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.project-header h3 {
  font-size: 1.25rem;
  color: #1F2937;
  margin: 0;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success {
  background-color: #D1FAE5;
  color: #065F46;
}

.badge-warning {
  background-color: #FEF3C7;
  color: #92400E;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #F9FAFB;
  border-radius: 6px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: #6B7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1F2937;
}

.project-footer {
  display: flex;
  gap: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
