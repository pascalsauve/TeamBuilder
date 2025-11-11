<template>
  <div class="project-stats">
    <div v-if="loading" class="loading-container">
      <div class="loading-large"></div>
      <p>Loading statistics...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
      <router-link :to="`/project/${route.params.id}`" class="link">Back to Project</router-link>
    </div>

    <div v-else-if="stats">
      <!-- Header -->
      <div class="page-header">
        <div>
          <router-link :to="`/project/${route.params.id}`" class="back-link">
            ← Back to Project
          </router-link>
          <h1>Project Statistics</h1>
          <p class="text-muted">{{ project?.projectName }}</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Participants</div>
          <div class="stat-value">{{ stats.totalParticipants }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Total Teams</div>
          <div class="stat-value">{{ stats.totalTeams }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Average Team Size</div>
          <div class="stat-value">{{ stats.averageTeamSize.toFixed(1) }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Optimization Score</div>
          <div class="stat-value">{{ project?.optimizationScore?.toFixed(1) || 'N/A' }}</div>
        </div>
      </div>

      <!-- Role Distribution -->
      <div class="card mt-4">
        <h2>Role Distribution</h2>
        <div class="role-stats">
          <div
            v-for="(count, role) in stats.roleDistribution"
            :key="role"
            class="role-stat-item"
          >
            <div class="role-stat-header">
              <span class="role-name">{{ role }}</span>
              <span class="role-count">{{ count }} participants</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(count / stats.totalParticipants) * 100}%` }"
              ></div>
            </div>
            <div class="role-percentage">
              {{ ((count / stats.totalParticipants) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Team Statistics -->
      <div class="card mt-4">
        <h2>Team Breakdown</h2>
        <div class="table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Members</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in stats.teamStats" :key="team.teamNumber">
                <td>
                  <strong>{{ team.teamName || `Team ${team.teamNumber}` }}</strong>
                </td>
                <td>{{ team.memberCount }}</td>
                <td>
                  <div class="role-tags">
                    <span
                      v-for="(count, role) in team.roleBreakdown"
                      :key="role"
                      class="role-tag"
                    >
                      {{ role }}: {{ count }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Constraints Summary -->
      <div class="card mt-4">
        <h2>Constraints Summary</h2>
        <div class="stats-grid">
          <div class="stat-card-small">
            <div class="stat-label">Cannot Be Together</div>
            <div class="stat-value-small">{{ stats.constraints.cannotBeTogether }}</div>
          </div>
          <div class="stat-card-small">
            <div class="stat-label">Must Be Together</div>
            <div class="stat-value-small">{{ stats.constraints.mustBeTogether }}</div>
          </div>
          <div class="stat-card-small">
            <div class="stat-label">Role Distribution</div>
            <div class="stat-value-small">{{ stats.constraints.roleDistribution }}</div>
          </div>
          <div class="stat-card-small">
            <div class="stat-label">Skill-Based</div>
            <div class="stat-value-small">{{ stats.constraints.skillBased }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTeamsStore } from '../stores/teams';

const route = useRoute();
const teamsStore = useTeamsStore();

const stats = ref(null);
const project = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    project.value = await teamsStore.fetchProject(route.params.id);
    stats.value = await teamsStore.fetchStats(route.params.id);
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.back-link {
  color: #6B7280;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  display: inline-block;
}

.back-link:hover {
  color: #4F46E5;
}

.page-header h1 {
  font-size: 2rem;
  color: #1F2937;
  margin: 0.5rem 0 0 0;
}

.text-muted {
  color: #6B7280;
  margin-top: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
}

.stat-card-small {
  background-color: #F9FAFB;
  border: 2px solid #E5E7EB;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-card-small .stat-label {
  color: #6B7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value-small {
  font-size: 2rem;
  font-weight: 700;
  color: #1F2937;
}

.role-stats {
  margin-top: 1.5rem;
}

.role-stat-item {
  margin-bottom: 1.5rem;
}

.role-stat-item:last-child {
  margin-bottom: 0;
}

.role-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.role-name {
  font-weight: 600;
  color: #1F2937;
}

.role-count {
  color: #6B7280;
  font-size: 0.875rem;
}

.progress-bar {
  height: 24px;
  background-color: #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667EEA 0%, #764BA2 100%);
  transition: width 0.3s ease;
}

.role-percentage {
  margin-top: 0.25rem;
  text-align: right;
  color: #6B7280;
  font-size: 0.875rem;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th {
  text-align: left;
  padding: 0.75rem;
  background-color: #F9FAFB;
  color: #6B7280;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 2px solid #E5E7EB;
}

.stats-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #E5E7EB;
  color: #1F2937;
}

.stats-table tbody tr:hover {
  background-color: #F9FAFB;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.role-tag {
  padding: 0.25rem 0.5rem;
  background-color: #E0E7FF;
  color: #4338CA;
  border-radius: 4px;
  font-size: 0.875rem;
  white-space: nowrap;
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

.link {
  color: #4F46E5;
  text-decoration: none;
  margin-left: 0.5rem;
}

.link:hover {
  text-decoration: underline;
}

.mt-4 {
  margin-top: 2rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
