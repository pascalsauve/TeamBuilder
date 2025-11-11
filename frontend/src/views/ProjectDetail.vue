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
          <div class="action-buttons">
            <button @click="optimizeTeams" class="btn btn-primary" :disabled="optimizing">
              <span v-if="optimizing" class="loading"></span>
              <span v-else>{{ project.isOptimized ? 'Re-optimize' : 'Optimize Teams' }}</span>
            </button>

            <div class="dropdown" v-if="hasGeneratedTeams">
              <button class="btn btn-secondary">Export ▾</button>
              <div class="dropdown-menu">
                <a @click.prevent="exportTeamsCSV" href="#">Teams CSV</a>
                <a @click.prevent="exportParticipantsCSV" href="#">Participants CSV</a>
                <a @click.prevent="exportTeamsPDF" href="#">Teams PDF</a>
              </div>
            </div>

            <router-link
              v-if="hasGeneratedTeams"
              :to="`/project/${project._id}/stats`"
              class="btn btn-secondary"
            >
              Statistics
            </router-link>

            <router-link
              v-if="hasGeneratedTeams"
              :to="`/project/${project._id}/history`"
              class="btn btn-secondary"
            >
              History
            </router-link>

            <button
              v-if="hasGeneratedTeams"
              @click="sendNotifications"
              class="btn btn-secondary"
              :disabled="sendingNotifications"
            >
              <span v-if="sendingNotifications" class="loading"></span>
              <span v-else>Send Notifications</span>
            </button>
          </div>
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h2>Participants ({{ project.participants.length }})</h2>
              <div style="display: flex; gap: 0.5rem;">
                <button @click="downloadSampleCSV" class="btn btn-sm btn-outline">
                  Sample CSV
                </button>
                <button @click="triggerImport" class="btn btn-sm btn-outline">
                  Import CSV
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv"
                  @change="handleImport"
                  style="display: none;"
                />
              </div>
            </div>

            <div class="add-participant-form">
              <input
                v-model="newParticipant.name"
                type="text"
                class="form-input"
                placeholder="Name *"
              />
              <input
                v-model="newParticipant.role"
                type="text"
                class="form-input"
                placeholder="Role *"
              />
              <input
                v-model="newParticipant.email"
                type="email"
                class="form-input"
                placeholder="Email (optional)"
              />
              <div class="skills-input-wrapper">
                <input
                  v-model="newSkillInput"
                  type="text"
                  class="form-input"
                  placeholder="Add skills..."
                  @keydown.enter.prevent="addSkillToNew"
                  list="skills-datalist"
                />
                <datalist id="skills-datalist">
                  <option v-for="skill in allSkills" :key="skill" :value="skill" />
                </datalist>
                <button @click="addSkillToNew" class="btn btn-sm btn-outline" type="button">+ Skill</button>
              </div>
              <div v-if="newParticipant.skills.length > 0" class="skills-display">
                <span v-for="(skill, idx) in newParticipant.skills" :key="idx" class="skill-badge">
                  {{ skill }}
                  <button @click="removeSkillFromNew(idx)" class="skill-remove">×</button>
                </span>
              </div>
              <button @click="addParticipant" class="btn btn-secondary">Add Participant</button>
            </div>

            <div v-if="importResult" class="alert" :class="importResult.hasWarnings ? 'alert-warning' : 'alert-success'">
              <strong>Import Result:</strong><br>
              Added: {{ importResult.added }} participants
              <span v-if="importResult.warnings && importResult.warnings.length > 0">
                <br>{{ importResult.warnings.join(', ') }}
              </span>
            </div>

            <div v-if="project.participants.length > 0" class="items-list">
              <div
                v-for="participant in project.participants"
                :key="participant._id"
                class="list-item participant-item"
              >
                <div class="participant-info">
                  <div>
                    <strong>{{ participant.name }}</strong>
                    <span class="role-badge">{{ participant.role }}</span>
                  </div>
                  <div v-if="participant.email" class="participant-email">
                    📧 {{ participant.email }}
                  </div>
                  <div v-if="participant.skills && participant.skills.length > 0" class="participant-skills">
                    <span v-for="skill in participant.skills" :key="skill" class="skill-tag">
                      {{ skill }}
                    </span>
                  </div>
                </div>
                <div class="participant-actions">
                  <button
                    @click="editParticipant(participant)"
                    class="btn-icon-small"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    @click="removeParticipant(participant._id)"
                    class="btn-remove"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
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
                <option value="skill_based">Skill-based requirements</option>
              </select>

              <!-- Participant-based constraints -->
              <div v-if="newConstraint.type && newConstraint.type !== 'role_distribution' && newConstraint.type !== 'skill_based'" class="mt-2">
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

              <!-- Skill-based constraint -->
              <div v-if="newConstraint.type === 'skill_based'" class="mt-2">
                <label class="form-label">Skill Requirements</label>

                <div v-for="(skillReq, index) in newConstraint.skillRequirements" :key="index" class="skill-requirement-row">
                  <input
                    v-model="skillReq.skill"
                    type="text"
                    class="form-input"
                    placeholder="Skill name (e.g., JavaScript)"
                  />
                  <input
                    v-model.number="skillReq.minCount"
                    type="number"
                    class="form-input"
                    placeholder="Min"
                    min="0"
                    :max="project.teamSize"
                  />
                  <input
                    v-model.number="skillReq.maxCount"
                    type="number"
                    class="form-input"
                    placeholder="Max"
                    min="0"
                    :max="project.teamSize"
                  />
                  <button @click="removeSkillRequirement(index)" class="btn-remove-small">×</button>
                </div>

                <button @click="addSkillRequirement" class="btn btn-outline btn-sm mt-2">
                  + Add Skill
                </button>

                <input
                  v-model="newConstraint.description"
                  type="text"
                  class="form-input mt-2"
                  placeholder="Description (optional)"
                />

                <button
                  @click="addConstraint"
                  class="btn btn-secondary mt-2"
                  :disabled="!isSkillConstraintValid"
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
                  <div v-else-if="constraint.type === 'skill_based' && constraint.skillRequirements" class="constraint-participants">
                    <span v-for="(skillReq, idx) in constraint.skillRequirements" :key="idx" class="role-req-badge">
                      {{ skillReq.skill }}: {{ skillReq.minCount }}-{{ skillReq.maxCount }}
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

      <!-- Edit Participant Modal -->
      <div v-if="editingParticipant" class="modal-overlay" @click="cancelEdit">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Edit Participant</h3>
            <button @click="cancelEdit" class="btn-close">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="editForm.name"
                type="text"
                class="form-input"
                placeholder="Name"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Role *</label>
              <input
                v-model="editForm.role"
                type="text"
                class="form-input"
                placeholder="Role"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                v-model="editForm.email"
                type="email"
                class="form-input"
                placeholder="email@example.com"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Skills</label>
              <div class="skills-input-wrapper">
                <input
                  v-model="editSkillInput"
                  type="text"
                  class="form-input"
                  placeholder="Add skills..."
                  @keydown.enter.prevent="addSkillToEdit"
                  list="edit-skills-datalist"
                />
                <datalist id="edit-skills-datalist">
                  <option v-for="skill in allSkills" :key="skill" :value="skill" />
                </datalist>
                <button @click="addSkillToEdit" class="btn btn-sm btn-outline" type="button">
                  + Add
                </button>
              </div>
              <div v-if="editForm.skills && editForm.skills.length > 0" class="skills-display mt-2">
                <span v-for="(skill, idx) in editForm.skills" :key="idx" class="skill-badge">
                  {{ skill }}
                  <button @click="removeSkillFromEdit(idx)" class="skill-remove">×</button>
                </span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
            <button @click="saveEdit" class="btn btn-primary" :disabled="!editForm.name || !editForm.role">
              Save Changes
            </button>
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
const sendingNotifications = ref(false);
const importResult = ref(null);
const fileInput = ref(null);

const newParticipant = ref({ name: '', role: '', email: '', skills: [] });
const newSkillInput = ref('');
const newConstraint = ref({
  type: '',
  participants: [],
  description: '',
  roleRequirements: {},
  skillRequirements: [],
});
const editingParticipant = ref(null);
const editForm = ref({ name: '', role: '', email: '', skills: [] });
const editSkillInput = ref('');

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

const hasGeneratedTeams = computed(() => {
  return project.value?.generatedTeams?.length > 0;
});

const isSkillConstraintValid = computed(() => {
  if (newConstraint.value.skillRequirements.length === 0) return false;
  return newConstraint.value.skillRequirements.every(req =>
    req.skill && req.skill.trim() !== '' &&
    req.minCount >= 0 &&
    req.maxCount >= req.minCount
  );
});

const allSkills = computed(() => {
  if (!project.value) return [];
  const skillsSet = new Set();
  project.value.participants.forEach(p => {
    if (p.skills) {
      p.skills.forEach(skill => skillsSet.add(skill));
    }
  });
  return Array.from(skillsSet).sort();
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
    newParticipant.value = { name: '', role: '', email: '', skills: [] };
    newSkillInput.value = '';
  } catch (err) {
    alert(err);
  }
};

const addSkillToNew = () => {
  const skill = newSkillInput.value.trim();
  if (skill && !newParticipant.value.skills.includes(skill)) {
    newParticipant.value.skills.push(skill);
    newSkillInput.value = '';
  }
};

const removeSkillFromNew = (index) => {
  newParticipant.value.skills.splice(index, 1);
};

const editParticipant = (participant) => {
  editingParticipant.value = participant;
  editForm.value = {
    name: participant.name,
    role: participant.role,
    email: participant.email || '',
    skills: participant.skills ? [...participant.skills] : []
  };
  editSkillInput.value = '';
};

const addSkillToEdit = () => {
  const skill = editSkillInput.value.trim();
  if (skill && !editForm.value.skills.includes(skill)) {
    editForm.value.skills.push(skill);
    editSkillInput.value = '';
  }
};

const removeSkillFromEdit = (index) => {
  editForm.value.skills.splice(index, 1);
};

const cancelEdit = () => {
  editingParticipant.value = null;
  editForm.value = { name: '', role: '', email: '', skills: [] };
  editSkillInput.value = '';
};

const saveEdit = async () => {
  if (!editForm.value.name || !editForm.value.role) {
    alert('Name and role are required');
    return;
  }

  try {
    // Find the participant by ID
    const participantIndex = project.value.participants.findIndex(
      p => p._id === editingParticipant.value._id
    );

    if (participantIndex !== -1) {
      project.value.participants[participantIndex] = {
        ...project.value.participants[participantIndex],
        name: editForm.value.name,
        role: editForm.value.role,
        email: editForm.value.email,
        skills: editForm.value.skills
      };

      // Update the project
      await teamsStore.updateProject(project.value._id, {
        participants: project.value.participants
      });

      project.value = teamsStore.currentProject;
    }

    cancelEdit();
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
      newConstraint.value = { type: '', participants: [], description: '', roleRequirements: {}, skillRequirements: [] };
    } catch (err) {
      alert(err);
    }
  } else if (newConstraint.value.type === 'skill_based') {
    // Validate skill-based constraints
    if (!isSkillConstraintValid.value) {
      alert('Please provide valid skill requirements (skill name, min >= 0, max >= min)');
      return;
    }

    // Build description
    const skillDesc = newConstraint.value.skillRequirements
      .map(req => `${req.skill}: ${req.minCount}-${req.maxCount}`)
      .join(', ');

    try {
      const constraintData = {
        type: newConstraint.value.type,
        skillRequirements: newConstraint.value.skillRequirements,
        description: newConstraint.value.description || `Each team must have: ${skillDesc}`,
      };

      project.value = await teamsStore.addConstraint(project.value._id, constraintData);
      newConstraint.value = { type: '', participants: [], description: '', roleRequirements: {}, skillRequirements: [] };
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
      newConstraint.value = { type: '', participants: [], description: '', roleRequirements: {}, skillRequirements: [] };
    } catch (err) {
      alert(err);
    }
  }
};

const addSkillRequirement = () => {
  newConstraint.value.skillRequirements.push({
    skill: '',
    minCount: 0,
    maxCount: 1
  });
};

const removeSkillRequirement = (index) => {
  newConstraint.value.skillRequirements.splice(index, 1);
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

// Export/Import Functions
const exportTeamsCSV = async () => {
  try {
    await teamsStore.exportTeamsCSV(project.value._id);
  } catch (err) {
    alert(err);
  }
};

const exportParticipantsCSV = async () => {
  try {
    await teamsStore.exportParticipantsCSV(project.value._id);
  } catch (err) {
    alert(err);
  }
};

const exportTeamsPDF = async () => {
  try {
    await teamsStore.exportTeamsPDF(project.value._id);
  } catch (err) {
    alert(err);
  }
};

const downloadSampleCSV = async () => {
  try {
    await teamsStore.downloadSampleCSV();
  } catch (err) {
    alert(err);
  }
};

const triggerImport = () => {
  fileInput.value.click();
};

const handleImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const result = await teamsStore.importParticipants(project.value._id, file);
    project.value = teamsStore.currentProject;
    importResult.value = {
      added: result.added,
      warnings: result.warnings,
      hasWarnings: result.hasWarnings,
    };

    // Clear the result after 5 seconds
    setTimeout(() => {
      importResult.value = null;
    }, 5000);

    // Reset file input
    event.target.value = '';
  } catch (err) {
    alert(err);
    event.target.value = '';
  }
};

// Notification Functions
const sendNotifications = async () => {
  if (!confirm('Send team assignment emails to all participants? (Only participants with email addresses will receive notifications)')) {
    return;
  }

  sendingNotifications.value = true;
  try {
    const result = await teamsStore.sendNotifications(project.value._id);
    project.value = teamsStore.currentProject;

    let message = `Notifications sent!\n\nSent: ${result.sent}\nSkipped (no email): ${result.skipped}`;
    if (result.failed > 0) {
      message += `\nFailed: ${result.failed}`;
      if (result.errors && result.errors.length > 0) {
        message += `\n\nErrors:\n${result.errors.join('\n')}`;
      }
    }
    alert(message);
  } catch (err) {
    alert(err);
  } finally {
    sendingNotifications.value = false;
  }
};

const formatConstraintType = (type) => {
  const types = {
    'cannot_be_together': 'Cannot be together',
    'must_be_together': 'Must be together',
    'role_distribution': 'Role distribution',
    'skill_based': 'Skill-based requirements',
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

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 180px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  padding: 0.5rem 0;
  z-index: 10;
  margin-top: 0.25rem;
}

.dropdown-menu a {
  display: block;
  padding: 0.5rem 1rem;
  color: #374151;
  text-decoration: none;
  cursor: pointer;
}

.dropdown-menu a:hover {
  background-color: #F3F4F6;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
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

.alert-warning {
  background-color: #FEF3C7;
  border-left: 4px solid #F59E0B;
  color: #92400E;
}

.alert-success {
  background-color: #D1FAE5;
  border-left: 4px solid #10B981;
  color: #065F46;
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

.add-participant-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #F9FAFB;
  border-radius: 8px;
}

.skills-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.skills-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: #E0E7FF;
  color: #4338CA;
  border-radius: 4px;
  font-size: 0.875rem;
}

.skill-remove {
  background: none;
  border: none;
  color: #6366F1;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 0.125rem;
}

.skill-remove:hover {
  color: #4338CA;
}

.skill-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #DBEAFE;
  color: #1E40AF;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.participant-info {
  flex: 1;
}

.participant-email {
  font-size: 0.875rem;
  color: #6B7280;
  margin-top: 0.25rem;
}

.participant-skills {
  margin-top: 0.5rem;
}

.participant-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-icon-small {
  background: none;
  border: 1px solid #D1D5DB;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-icon-small:hover {
  background-color: #F3F4F6;
  border-color: #9CA3AF;
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

.skill-requirement-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  align-items: center;
}

.btn-remove-small {
  background: none;
  border: 1px solid #DC2626;
  color: #DC2626;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-small:hover {
  background-color: #FEE2E2;
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
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header h3 {
  margin: 0;
  color: #1F2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.btn-close:hover {
  background-color: #F3F4F6;
  color: #6B7280;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #E5E7EB;
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
