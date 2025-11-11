<template>
  <div class="admin-users">
    <div v-if="loading" class="loading-container">
      <div class="loading-large"></div>
      <p>Loading users...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
      <router-link to="/admin" class="link">Back to Admin Dashboard</router-link>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <router-link to="/admin" class="back-link">← Back to Admin Dashboard</router-link>
          <h1>User Management</h1>
          <p class="text-muted">Manage user accounts and permissions</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input
          v-model="searchQuery"
          type="text"
          class="form-input"
          placeholder="Search by username or email..."
        />
        <select v-model="roleFilter" class="form-select">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select v-model="statusFilter" class="form-select">
          <option value="">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="table-container">
          <table class="users-table" v-if="filteredUsers.length > 0">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user._id">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="user-name">{{ user.username }}</div>
                      <div class="user-id">ID: {{ user._id.slice(-8) }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <select
                    :value="user.role"
                    @change="changeUserRole(user._id, $event.target.value)"
                    class="role-select"
                    :disabled="user._id === currentUserId"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="user.isVerified ? 'badge-success' : 'badge-warning'"
                  >
                    {{ user.isVerified ? 'Verified' : 'Unverified' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never' }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      @click="viewUserDetails(user._id)"
                      class="btn-icon"
                      title="View Details"
                    >
                      👁
                    </button>
                    <button
                      @click="deleteUser(user._id)"
                      class="btn-icon btn-danger"
                      :disabled="user._id === currentUserId"
                      title="Delete User"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <p>No users found matching your filters</p>
          </div>
        </div>
      </div>

      <!-- User Details Modal -->
      <div v-if="selectedUser" class="modal-overlay" @click="selectedUser = null">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>User Details</h3>
            <button @click="selectedUser = null" class="btn-close">×</button>
          </div>

          <div class="user-details">
            <div class="detail-row">
              <span class="detail-label">Username:</span>
              <span class="detail-value">{{ selectedUser.username }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ selectedUser.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Role:</span>
              <span class="detail-value">
                <span
                  class="badge"
                  :class="selectedUser.role === 'admin' ? 'badge-admin' : 'badge-user'"
                >
                  {{ selectedUser.role }}
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span
                  class="badge"
                  :class="selectedUser.isVerified ? 'badge-success' : 'badge-warning'"
                >
                  {{ selectedUser.isVerified ? 'Verified' : 'Unverified' }}
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">User ID:</span>
              <span class="detail-value code">{{ selectedUser._id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Joined:</span>
              <span class="detail-value">{{ formatDate(selectedUser.createdAt) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last Login:</span>
              <span class="detail-value">
                {{ selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Projects:</span>
              <span class="detail-value">{{ selectedUser.projectCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';
import { useAuthStore } from '../stores/auth';

const adminStore = useAdminStore();
const authStore = useAuthStore();

const users = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const selectedUser = ref(null);

const currentUserId = computed(() => authStore.user?._id);

const filteredUsers = computed(() => {
  let filtered = [...users.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }

  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter((user) => user.role === roleFilter.value);
  }

  // Status filter
  if (statusFilter.value === 'verified') {
    filtered = filtered.filter((user) => user.isVerified);
  } else if (statusFilter.value === 'unverified') {
    filtered = filtered.filter((user) => !user.isVerified);
  }

  return filtered;
});

onMounted(async () => {
  try {
    users.value = await adminStore.fetchUsers();
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
});

const changeUserRole = async (userId, newRole) => {
  if (!confirm(`Change user role to "${newRole}"?`)) {
    return;
  }

  try {
    await adminStore.updateUserRole(userId, newRole);
    // Update local state
    const user = users.value.find((u) => u._id === userId);
    if (user) {
      user.role = newRole;
    }
  } catch (err) {
    alert(err);
  }
};

const deleteUser = async (userId) => {
  if (userId === currentUserId.value) {
    alert('You cannot delete your own account!');
    return;
  }

  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  try {
    await adminStore.deleteUser(userId);
    users.value = users.value.filter((u) => u._id !== userId);
  } catch (err) {
    alert(err);
  }
};

const viewUserDetails = async (userId) => {
  try {
    const userDetails = await adminStore.fetchUser(userId);
    selectedUser.value = userDetails.user;
  } catch (err) {
    alert(err);
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

.text-muted {
  color: #6B7280;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.filters-bar {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  text-align: left;
  padding: 0.75rem;
  background-color: #F9FAFB;
  color: #6B7280;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 2px solid #E5E7EB;
}

.users-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #E5E7EB;
  color: #1F2937;
  font-size: 0.875rem;
}

.users-table tbody tr:hover {
  background-color: #F9FAFB;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
}

.user-name {
  font-weight: 600;
  color: #1F2937;
}

.user-id {
  font-size: 0.75rem;
  color: #9CA3AF;
  font-family: monospace;
}

.role-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.role-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-success {
  background-color: #D1FAE5;
  color: #065F46;
}

.badge-warning {
  background-color: #FED7AA;
  color: #9A3412;
}

.badge-admin {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.badge-user {
  background-color: #E5E7EB;
  color: #374151;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: 1px solid #D1D5DB;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #F3F4F6;
  border-color: #9CA3AF;
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-danger:hover:not(:disabled) {
  background-color: #FEE2E2;
  border-color: #DC2626;
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

.user-details {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #E5E7EB;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #6B7280;
}

.detail-value {
  color: #1F2937;
  text-align: right;
}

.code {
  font-family: monospace;
  font-size: 0.875rem;
  background-color: #F3F4F6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6B7280;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .filters-bar {
    grid-template-columns: 1fr;
  }
}
</style>
