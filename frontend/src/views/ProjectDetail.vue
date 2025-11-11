<template>
  <div class="project-detail">
    <div v-if="loading" class="loading-container">
      <div class="loading-large"></div>
      <p>Loading project...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
      <router-link to="/dashboard" class="link">Back to Dashboard</router-link>
    </div>

    <div v-else-if="project">
      <!-- Header -->
      <div class="page-header">
        <div>
          <router-link to="/dashboard" class="back-link">← Back to Dashboard</router-link>
          <h1>{{ project.projectName }}</h1>
        </div>
        <div class="header-actions">
          <button @click="optimizeTeams" class="btn btn-primary" :disabled="optimizing">
            <span v-if="optimizing" class="loading"></span>
            <span v-else>{{ project.isOptimized ? 'Re-optimize' : 'Optimize Teams' }}</span>
          </button>
        </div>
      </div>

      <!-- Project Settings -->
      <div class="card mb-4">
        <h2>Project Settings</h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="form-label">Team Size</label>
            <input
              v-model.number="project.teamSize"
              type="number"
              class="form-input"
              min="2"
              max="20"
              @change="updateProject"
            />
          </div>
          <div class="setting-item">
            <label class="form-label">Randomness Factor (%)</label>
            <input
              v-model.number="project.randomnessFactor"
              type="number"
              class="form-input"
              min="0"
              max="100"
              @change="updateProject"
            />
          </div>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="content-grid">
        <!-- Left Column: Participants & Constraints -->
        <div>
          <!-- Participants -->
          <div class="card mb-4">
            <h2>Participants ({{ project.participants.length }})</h2>

            <div class="add-form">
              <input
                v-model="newParticipant.name"
                type="text"
                class="form-input"
                placeholder="Name"
              />
              <input
                v-model="newParticipant.role"
                type="text"
                class="form-input"
                placeholder="Role"
              />
              <button @click="addParticipant" class="btn btn-secondary">Add</button>
            </div>

            <div v-if="project.participants.length > 0" class="items-list">
              <div
                v-for="participant in project.participants"
                :key="participant._id"
                class="list-item"
              >
                <div>
                  <strong>{{ participant.name }}</strong>
                  <span class="role-badge">{{ participant.role }}</span>
                </div>
                <button
                  @click="removeParticipant(participant._id)"
                  class="btn-remove"
                >
                  ×
                </button>
              </div>
            </div>
            <p v-else class="text-muted">No participants added</p>
          </div>

          <!-- Constraints -->
          <div class="card">
            <h2>Constraints ({{ project.constraints.length }})</h2>

            <div class="constraint-form">
              <select v-model="newConstraint.type" class="form-select">
                <option value="">Select constraint type...</option>
                <option value="cannot_be_together">Cannot be together</option>
                <option value="must_be_together">Must be together</option>
                <option value="role_distribution">Role distribution (exact count per team)</option>
              </select>

              <!-- Participant-based constraints -->
              <div v-if="newConstraint.type && newConstraint.type !== 'role_distribution'" class="mt-2">
                <label class="form-label">Select Participants</label>
                <div class="checkbox-group">
                  <label
                    v-for="participant in project.participants"
                    :key="participant._id"
                    class="checkbox-label"
                  >
                    <input
                      type="checkbox"
                      :value="participant.name"
                      v-model="newConstraint.participants"
                    />
                    {{ participant.name }}
                  </label>
                </div>

                <input
                  v-model="newConstraint.description"
                  type="text"
                  class="form-input mt-2"
                  placeholder="Description (optional)"
                />

                <button
                  @click="addConstraint"
                  class="btn btn-secondary mt-2"
                  :disabled="newConstraint.participants.length < 2"
                >
                  Add Constraint
                </button>
              </div>

              <!-- Role distribution constraint -->
              <div v-if="newConstraint.type === 'role_distribution'" class="mt-2">
                <label class="form-label">Set required count for each role per team</label>
                <div class="role-requirements">
                  <div
                    v-for="role in uniqueRoles"
                    :key="role"
                    class="role-requirement-item"
                  >
                    <label class="role-label">{{ role }}</label>
                    <input
                      v-model.number="newConstraint.roleRequirements[role]"
                      type="number"
                      class="form-input role-input"
                      min="0"
                      :max="project.teamSize"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div class="mt-2" style="padding: 0.75rem; background-color: #F0F9FF; border-radius: 6px; font-size: 0.875rem;">
                  <strong>Total per team:</strong> {{ roleRequirementTotal }} / {{ project.teamSize }}
                  <span v-if="roleRequirementTotal !== project.teamSize" style="color: #DC2626; margin-left: 0.5rem;">
                    (Must equal team size)
                  </span>
                </div>

                <input
                  v-model="newConstraint.description"
                  type="text"
                  class="form-input mt-2"
                  placeholder="Description (optional)"
                />

                <button
                  @click="addConstraint"
                  class="btn btn-secondary mt-2"
                  :disabled="roleRequirementTotal !== project.teamSize"
                >
                  Add Constraint
                </button>
              </div>
            </div>

            <div v-if="project.constraints.length > 0" class="items-list mt-3">
              <div
                v-for="constraint in project.constraints"
                :key="constraint._id"
                class="list-item constraint-item"
              >
                <div>
                  <div class="constraint-type">
                    {{ formatConstraintType(constraint.type) }}
                  </div>
                  <div v-if="constraint.type === 'role_distribution' && constraint.roleRequirements" class="constraint-participants">
                    <span v-for="(count, role) in constraint.roleRequirements" :key="role" class="role-req-badge">
                      {{ role }}: {{ count }}
                    </span>
                  </div>
                  <div v-else class="constraint-participants">
                    {{ constraint.participants?.join(', ') || 'N/A' }}
                  </div>
                  <div v-if="constraint.description" class="constraint-desc">
                    {{ constraint.description }}
                  </div>
                </div>
                <button
                  @click="removeConstraint(constraint._id)"
                  class="btn-remove"
                >
                  ×
                </button>
              </div>
            </div>
            <p v-else class="text-muted">No constraints added</p>
          </div>
        </div>

        <!-- Right Column: Teams -->
        <div>
          <div class="card">
            <div class="teams-header">
              <h2>Generated Teams</h2>
              <span v-if="project.isOptimized" class="badge badge-success">
                Score: {{ project.optimizationScore.toFixed(1) }}
              </span>
            </div>

            <div v-if="optimizationResult" class="alert alert-info mb-3">
              <strong>Optimization Results:</strong><br>
              Score: {{ optimizationResult.score.toFixed(1) }} |
              Violations: {{ optimizationResult.violations }} |
              {{ optimizationResult.constraintsSatisfied ? '✓ All constraints satisfied' : '⚠ Some constraints violated' }}
            </div>

            <div v-if="project.generatedTeams && project.generatedTeams.length > 0">
              <div
                v-for="team in project.generatedTeams"
                :key="team.teamNumber"
                class="team-card"
              >
                <div class="team-header">
                  <input
                    v-model="team.teamName"
                    type="text"
                    class="team-name-input"
                    @change="updateTeams"
                    :placeholder="`Team ${team.teamNumber}`"
                  />
                  <span class="team-count">{{ team.members.length }} members</span>
                </div>

                <div class="team-members">
                  <div
                    v-for="(member, idx) in team.members"
                    :key="idx"
                    class="member-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, team.teamNumber, idx)"
                    @dragover.prevent
                    @drop="handleDrop($event, team.teamNumber, idx)"
                  >
                    <div>
                      <strong>{{ member.name }}</strong>
                      <span class="member-role">{{ member.role }}</span>
                    </div>
                    <select
                      @change="moveToTeam($event, team.teamNumber, idx)"
                      class="team-select"
                    >
                      <option value="">Move to...</option>
                      <option
                        v-for="t in project.generatedTeams"
                        :key="t.teamNumber"
                        :value="t.teamNumber"
                        :disabled="t.teamNumber === team.teamNumber"
                      >
                        {{ t.teamName || `Team ${t.teamNumber}` }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <p>No teams generated yet</p>
              <p class="text-muted">Click "Optimize Teams" to generate teams based on your participants and constraints</p>
            </div>
          </div>
        </div>
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
const loading = ref(true);
const error = ref('');
const optimizing = ref(false);
const optimizationResult = ref(null);

const newParticipant = ref({ name: '', role: '' });
const newConstraint = ref({
  type: '',
  participants: [],
  description: '',
  roleRequirements: {},
});

const draggedItem = ref(null);

// Computed properties
const uniqueRoles = computed(() => {
  if (!project.value) return [];
  const roles = new Set(project.value.participants.map(p => p.role));
  return Array.from(roles).sort();
});

const roleRequirementTotal = computed(() => {
  return Object.values(newConstraint.value.roleRequirements).reduce((sum, count) => sum + (count || 0), 0);
});

onMounted(async () => {
  try {
    project.value = await teamsStore.fetchProject(route.params.id);
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
});

const updateProject = async () => {
  try {
    await teamsStore.updateProject(project.value._id, {
      teamSize: project.value.teamSize,
      randomnessFactor: project.value.randomnessFactor,
    });
  } catch (err) {
    alert(err);
  }
};

const addParticipant = async () => {
  if (!newParticipant.value.name || !newParticipant.value.role) {
    alert('Please enter both name and role');
    return;
  }

  try {
    project.value = await teamsStore.addParticipant(project.value._id, newParticipant.value);
    newParticipant.value = { name: '', role: '' };
  } catch (err) {
    alert(err);
  }
};

const removeParticipant = async (participantId) => {
  if (!confirm('Remove this participant?')) return;

  try {
    project.value = await teamsStore.removeParticipant(project.value._id, participantId);
  } catch (err) {
    alert(err);
  }
};

const addConstraint = async () => {
  if (newConstraint.value.type === 'role_distribution') {
    // Validate role distribution
    if (roleRequirementTotal.value !== project.value.teamSize) {
      alert(`Role requirements must total ${project.value.teamSize} (current: ${roleRequirementTotal.value})`);
      return;
    }

    // Build description
    const roleDesc = Object.entries(newConstraint.value.roleRequirements)
      .filter(([_, count]) => count > 0)
      .map(([role, count]) => `${count} ${role}`)
      .join(', ');

    try {
      const constraintData = {
        type: newConstraint.value.type,
        roleRequirements: newConstraint.value.roleRequirements,
        description: newConstraint.value.description || `Each team must have: ${roleDesc}`,
      };

      project.value = await teamsStore.addConstraint(project.value._id, constraintData);
      newConstraint.value = { type: '', participants: [], description: '', roleRequirements: {} };
    } catch (err) {
      alert(err);
    }
  } else {
    // Participant-based constraints
    if (newConstraint.value.participants.length < 2) {
      alert('Please select at least 2 participants');
      return;
    }

    try {
      const constraintData = {
        type: newConstraint.value.type,
        participants: newConstraint.value.participants,
        description: newConstraint.value.description || `${formatConstraintType(newConstraint.value.type)}: ${newConstraint.value.participants.join(', ')}`,
      };

      project.value = await teamsStore.addConstraint(project.value._id, constraintData);
      newConstraint.value = { type: '', participants: [], description: '', roleRequirements: {} };
    } catch (err) {
      alert(err);
    }
  }
};

const removeConstraint = async (constraintId) => {
  if (!confirm('Remove this constraint?')) return;

  try {
    project.value = await teamsStore.removeConstraint(project.value._id, constraintId);
  } catch (err) {
    alert(err);
  }
};

const optimizeTeams = async () => {
  optimizing.value = true;
  optimizationResult.value = null;

  try {
    const result = await teamsStore.optimizeTeams(project.value._id);
    project.value = result.project;
    optimizationResult.value = result.optimization;
  } catch (err) {
    alert(err);
  } finally {
    optimizing.value = false;
  }
};

const updateTeams = async () => {
  try {
    await teamsStore.updateTeams(project.value._id, project.value.generatedTeams);
  } catch (err) {
    alert(err);
  }
};

const moveToTeam = async (event, fromTeamNumber, memberIndex) => {
  const toTeamNumber = parseInt(event.target.value);
  if (!toTeamNumber) return;

  const fromTeam = project.value.generatedTeams.find(t => t.teamNumber === fromTeamNumber);
  const toTeam = project.value.generatedTeams.find(t => t.teamNumber === toTeamNumber);

  const member = fromTeam.members.splice(memberIndex, 1)[0];
  toTeam.members.push(member);

  event.target.value = '';
  await updateTeams();
};

const handleDragStart = (event, teamNumber, memberIndex) => {
  draggedItem.value = { teamNumber, memberIndex };
};

const handleDrop = async (event, toTeamNumber, toMemberIndex) => {
  if (!draggedItem.value) return;

  const { teamNumber: fromTeamNumber, memberIndex: fromMemberIndex } = draggedItem.value;

  if (fromTeamNumber === toTeamNumber && fromMemberIndex === toMemberIndex) return;

  const fromTeam = project.value.generatedTeams.find(t => t.teamNumber === fromTeamNumber);
  const toTeam = project.value.generatedTeams.find(t => t.teamNumber === toTeamNumber);

  const member = fromTeam.members.splice(fromMemberIndex, 1)[0];

  if (fromTeamNumber === toTeamNumber) {
    toTeam.members.splice(toMemberIndex, 0, member);
  } else {
    toTeam.members.push(member);
  }

  draggedItem.value = null;
  await updateTeams();
};

const formatConstraintType = (type) => {
  const types = {
    'cannot_be_together': 'Cannot be together',
    'must_be_together': 'Must be together',
    'role_distribution': 'Role distribution',
    'team_size': 'Team size',
  };
  return types[type] || type;
};
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

.header-actions {
  margin-top: 1rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.add-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.items-list {
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #F9FAFB;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.list-item:last-child {
  margin-bottom: 0;
}

.role-badge {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: #E0E7FF;
  color: #4338CA;
  border-radius: 4px;
  font-size: 0.875rem;
}

.btn-remove {
  background: none;
  border: none;
  color: #DC2626;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-remove:hover {
  background-color: #FEE2E2;
}

.constraint-form {
  margin-top: 1rem;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #F9FAFB;
  border-radius: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.constraint-item {
  flex-direction: row;
}

.constraint-type {
  font-weight: 600;
  color: #4F46E5;
  font-size: 0.875rem;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.constraint-participants {
  color: #1F2937;
  margin-bottom: 0.25rem;
}

.constraint-desc {
  color: #6B7280;
  font-size: 0.875rem;
}

.role-requirements {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #F9FAFB;
  border-radius: 6px;
}

.role-requirement-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.role-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.role-input {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.role-req-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  margin-right: 0.5rem;
  background-color: #DBEAFE;
  color: #1E40AF;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.teams-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.team-card {
  background-color: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #D1D5DB;
}

.team-name-input {
  font-size: 1.25rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #1F2937;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.team-name-input:hover,
.team-name-input:focus {
  background-color: white;
  outline: none;
}

.team-count {
  color: #6B7280;
  font-size: 0.875rem;
}

.team-members {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: white;
  border-radius: 4px;
  cursor: move;
  transition: transform 0.2s;
}

.member-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-role {
  margin-left: 0.5rem;
  color: #6B7280;
  font-size: 0.875rem;
}

.team-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6B7280;
}

.text-muted {
  color: #9CA3AF;
  font-style: italic;
  padding: 1rem;
  text-align: center;
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

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success {
  background-color: #D1FAE5;
  color: #065F46;
}

.mb-3 {
  margin-bottom: 1.5rem;
}

.mb-4 {
  margin-bottom: 2rem;
}

.mt-2 {
  margin-top: 1rem;
}

.mt-3 {
  margin-top: 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
