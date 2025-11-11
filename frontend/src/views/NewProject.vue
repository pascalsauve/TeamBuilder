<template>
  <div class="new-project">
    <div class="page-header">
      <h1>Create New Project</h1>
      <router-link to="/dashboard" class="btn btn-secondary">Cancel</router-link>
    </div>

    <div class="card">
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <input
            v-model="projectName"
            type="text"
            class="form-input"
            placeholder="e.g., Spring 2024 Hackathon"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Team Size</label>
            <input
              v-model.number="teamSize"
              type="number"
              class="form-input"
              min="2"
              max="20"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Randomness Factor (%)</label>
            <input
              v-model.number="randomnessFactor"
              type="number"
              class="form-input"
              min="0"
              max="100"
              required
            />
            <small style="color: #6B7280;">Higher values create more random teams</small>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Participants</label>
          <div class="participants-input">
            <div class="input-row">
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
                placeholder="Role (e.g., Developer, Designer)"
              />
              <button
                type="button"
                @click="addParticipant"
                class="btn btn-secondary"
              >
                Add
              </button>
            </div>
          </div>

          <div v-if="participants.length > 0" class="participants-list">
            <div
              v-for="(participant, index) in participants"
              :key="index"
              class="participant-item"
            >
              <div>
                <strong>{{ participant.name }}</strong>
                <span class="role-badge">{{ participant.role }}</span>
              </div>
              <button
                type="button"
                @click="removeParticipant(index)"
                class="btn-remove"
              >
                ×
              </button>
            </div>
          </div>
          <p v-else class="text-muted">No participants added yet</p>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading || participants.length === 0"
          >
            <span v-if="loading" class="loading"></span>
            <span v-else>Create Project</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTeamsStore } from '../stores/teams';

const router = useRouter();
const teamsStore = useTeamsStore();

const projectName = ref('');
const teamSize = ref(4);
const randomnessFactor = ref(30);
const participants = ref([]);
const newParticipant = ref({ name: '', role: '' });
const loading = ref(false);
const error = ref('');

const addParticipant = () => {
  if (!newParticipant.value.name || !newParticipant.value.role) {
    error.value = 'Please enter both name and role';
    return;
  }

  if (participants.value.some(p => p.name === newParticipant.value.name)) {
    error.value = 'Participant with this name already exists';
    return;
  }

  participants.value.push({ ...newParticipant.value });
  newParticipant.value = { name: '', role: '' };
  error.value = '';
};

const removeParticipant = (index) => {
  participants.value.splice(index, 1);
};

const handleSubmit = async () => {
  if (participants.value.length === 0) {
    error.value = 'Please add at least one participant';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const project = await teamsStore.createProject({
      projectName: projectName.value,
      teamSize: teamSize.value,
      randomnessFactor: randomnessFactor.value,
      participants: participants.value,
    });

    router.push(`/project/${project._id}`);
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #1F2937;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.participants-input {
  margin-bottom: 1rem;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
}

.participants-list {
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #F9FAFB;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.participant-item:last-child {
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

.text-muted {
  color: #9CA3AF;
  font-style: italic;
}

.form-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #E5E7EB;
}
</style>
