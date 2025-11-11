<template>
  <div class="project-history">
    <div v-if="loading" class="loading-container">
      <div class="loading-large"></div>
      <p>Loading history...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
      <router-link :to="`/project/${route.params.id}`" class="link">Back to Project</router-link>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <router-link :to="`/project/${route.params.id}`" class="back-link">
            ← Back to Project
          </router-link>
          <h1>Version History</h1>
          <p class="text-muted">{{ project?.projectName }}</p>
          <p v-if="project?.currentVersion" class="current-version-info">
            Currently on <strong>Version {{ project.currentVersion }}</strong>
          </p>
        </div>
        <button @click="showSaveDialog = true" class="btn btn-primary" v-if="hasGeneratedTeams">
          💾 Save Current Version
        </button>
      </div>

      <!-- Save Version Dialog -->
      <div v-if="showSaveDialog" class="modal-overlay" @click="showSaveDialog = false">
        <div class="modal-content" @click.stop>
          <h3>Save Current Version</h3>
          <p class="text-muted">Add notes to describe this version</p>
          <textarea
            v-model="versionNotes"
            class="form-textarea"
            placeholder="e.g., Initial optimization, Adjusted for skill balance, etc."
            rows="4"
          ></textarea>
          <div class="modal-actions">
            <button @click="showSaveDialog = false" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="saveCurrentVersion" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading"></span>
              <span v-else>Save Version</span>
            </button>
          </div>
        </div>
      </div>

      <!-- History Timeline -->
      <div v-if="history && history.length > 0" class="timeline">
        <div
          v-for="version in history"
          :key="version.version"
          class="timeline-item"
          :class="{ 'current-version': version.version === project.currentVersion }"
        >
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="version-header">
              <div>
                <h3>
                  Version {{ version.version }}
                  <span v-if="version.version === project.currentVersion" class="badge badge-current">
                    Current
                  </span>
                </h3>
                <p class="version-date">
                  {{ formatDate(version.generatedAt) }}
                </p>
              </div>
              <div class="version-score">
                Score: {{ version.optimizationScore?.toFixed(1) || 'N/A' }}
              </div>
            </div>

            <p v-if="version.notes" class="version-notes">{{ version.notes }}</p>

            <div class="version-stats">
              <div class="stat-item">
                <span class="stat-label">Teams:</span>
                <span class="stat-value">{{ version.teams?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Participants:</span>
                <span class="stat-value">{{ countParticipants(version.teams) }}</span>
              </div>
            </div>

            <div class="version-actions">
              <button
                v-if="version.version !== project.currentVersion"
                @click="restoreVersion(version.version)"
                class="btn btn-restore btn-sm"
                :disabled="restoring"
              >
                <span v-if="restoring === version.version" class="loading"></span>
                <span v-else>🔄 Restore This Version</span>
              </button>
              <button @click="toggleTeamsView(version.version)" class="btn btn-outline btn-sm">
                {{ expandedVersions.includes(version.version) ? 'Hide' : 'View' }} Teams
              </button>
              <button
                v-if="version.version !== project.currentVersion"
                @click="deleteVersion(version.version)"
                class="btn btn-delete btn-sm"
                :disabled="deleting"
                title="Delete this version"
              >
                <span v-if="deleting === version.version" class="loading"></span>
                <span v-else>🗑️ Delete</span>
              </button>
            </div>

            <!-- Expanded Teams View -->
            <div v-if="expandedVersions.includes(version.version)" class="teams-preview">
              <div
                v-for="team in version.teams"
                :key="team.teamNumber"
                class="team-preview-card"
              >
                <div class="team-preview-header">
                  <strong>{{ team.teamName || `Team ${team.teamNumber}` }}</strong>
                  <span class="team-preview-count">{{ team.members.length }} members</span>
                </div>
                <div class="team-preview-members">
                  <span
                    v-for="member in team.members"
                    :key="member.name"
                    class="member-badge"
                  >
                    {{ member.name }} <span class="member-role">({{ member.role }})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No version history available</p>
        <p class="text-muted">
          Versions will appear here after you save them. Click "Save Current Version" to create your first version.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTeamsStore } from '../stores/teams';

const route = useRoute();
const teamsStore = useTeamsStore();

const project = ref(null);
const history = ref([]);
const loading = ref(true);
const error = ref('');
const showSaveDialog = ref(false);
const versionNotes = ref('');
const saving = ref(false);
const restoring = ref(null);
const deleting = ref(null);
const expandedVersions = ref([]);

const hasGeneratedTeams = computed(() => {
  return project.value?.generatedTeams?.length > 0;
});

onMounted(async () => {
  try {
    project.value = await teamsStore.fetchProject(route.params.id);
    history.value = await teamsStore.fetchHistory(route.params.id);
    // Sort by version descending (newest first)
    history.value.sort((a, b) => b.version - a.version);
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
});

const saveCurrentVersion = async () => {
  saving.value = true;
  try {
    const result = await teamsStore.saveVersion(project.value._id, versionNotes.value);
    project.value = teamsStore.currentProject;

    // Refresh history
    history.value = await teamsStore.fetchHistory(route.params.id);
    history.value.sort((a, b) => b.version - a.version);

    showSaveDialog.value = false;
    versionNotes.value = '';
  } catch (err) {
    alert(err);
  } finally {
    saving.value = false;
  }
};

const restoreVersion = async (version) => {
  if (!confirm(`Restore version ${version}? This will replace your current teams and make this the active version.`)) {
    return;
  }

  restoring.value = version;
  try {
    project.value = await teamsStore.restoreVersion(project.value._id, version);

    // Refresh history to update current version indicator
    history.value = await teamsStore.fetchHistory(route.params.id);
    history.value.sort((a, b) => b.version - a.version);

    alert(`✓ Version ${version} restored successfully!\n\nThis is now your current active version. You can view it in the Project Detail page.`);
  } catch (err) {
    alert(`Failed to restore version: ${err}`);
  } finally {
    restoring.value = null;
  }
};

const deleteVersion = async (version) => {
  if (!confirm(`Delete version ${version}? This action cannot be undone.\n\nThe version will be permanently removed from history.`)) {
    return;
  }

  deleting.value = version;
  try {
    await teamsStore.deleteVersion(project.value._id, version);

    // Refresh history to update the list
    history.value = await teamsStore.fetchHistory(route.params.id);
    history.value.sort((a, b) => b.version - a.version);

    alert(`✓ Version ${version} deleted successfully!`);
  } catch (err) {
    alert(`Failed to delete version: ${err}`);
  } finally {
    deleting.value = null;
  }
};

const toggleTeamsView = (version) => {
  const index = expandedVersions.value.indexOf(version);
  if (index > -1) {
    expandedVersions.value.splice(index, 1);
  } else {
    expandedVersions.value.push(version);
  }
};

const countParticipants = (teams) => {
  if (!teams) return 0;
  return teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
  font-size: 0.875rem;
}

.current-version-info {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #DBEAFE;
  border-left: 3px solid #3B82F6;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #1E40AF;
  display: inline-block;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 0.5rem 0;
  color: #1F2937;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
  margin: 1rem 0;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #E5E7EB;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
}

.timeline-marker {
  position: absolute;
  left: -1.45rem;
  top: 0.5rem;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #9CA3AF;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #E5E7EB;
}

.current-version .timeline-marker {
  background-color: #4F46E5;
  box-shadow: 0 0 0 2px #4F46E5;
}

.timeline-content {
  background-color: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 1.5rem;
  margin-left: 1rem;
}

.current-version .timeline-content {
  border-color: #4F46E5;
  background-color: #F5F7FF;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.version-header h3 {
  margin: 0;
  color: #1F2937;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.version-date {
  color: #6B7280;
  font-size: 0.875rem;
  margin: 0.25rem 0 0 0;
}

.version-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4F46E5;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-current {
  background-color: #4F46E5;
  color: white;
}

.version-notes {
  background-color: #F9FAFB;
  padding: 0.75rem;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  margin: 1rem 0;
  border-left: 3px solid #4F46E5;
}

.version-stats {
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  color: #6B7280;
  font-size: 0.875rem;
}

.stat-value {
  color: #1F2937;
  font-weight: 600;
}

.version-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-outline {
  background-color: white;
  border: 1px solid #D1D5DB;
  color: #374151;
}

.btn-outline:hover {
  background-color: #F9FAFB;
  border-color: #9CA3AF;
}

.btn-restore {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: none;
  font-weight: 600;
}

.btn-restore:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.btn-restore:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete {
  background-color: #DC2626;
  color: white;
  border: none;
  font-weight: 600;
}

.btn-delete:hover:not(:disabled) {
  background-color: #B91C1C;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.teams-preview {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E5E7EB;
}

.team-preview-card {
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.team-preview-card:last-child {
  margin-bottom: 0;
}

.team-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #E5E7EB;
}

.team-preview-count {
  color: #6B7280;
  font-size: 0.875rem;
}

.team-preview-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.member-badge {
  padding: 0.375rem 0.75rem;
  background-color: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1F2937;
}

.member-role {
  color: #6B7280;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6B7280;
}

.empty-state p {
  margin: 0.5rem 0;
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

.loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.6s linear infinite;
}

.link {
  color: #4F46E5;
  text-decoration: none;
  margin-left: 0.5rem;
}

.link:hover {
  text-decoration: underline;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .timeline {
    padding-left: 1.5rem;
  }

  .timeline-content {
    margin-left: 0.5rem;
  }

  .version-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .version-actions {
    flex-direction: column;
  }

  .version-actions button {
    width: 100%;
  }
}
</style>
