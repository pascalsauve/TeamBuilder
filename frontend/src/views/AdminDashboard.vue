<template>
  <div class="admin-dashboard">
    <div v-if="loading" class="loading-container">
      <div class="loading-large"></div>
      <p>Loading admin dashboard...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
      <router-link to="/dashboard" class="link">Back to Dashboard</router-link>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <router-link to="/dashboard" class="back-link">← Back to Dashboard</router-link>
          <h1>Admin Dashboard</h1>
          <p class="text-muted">System overview and management</p>
        </div>
        <router-link to="/admin/users" class="btn btn-primary">
          Manage Users
        </router-link>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-sublabel">
              {{ stats.activeUsers }} active this month
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">Total Projects</div>
            <div class="stat-value">{{ stats.totalProjects }}</div>
            <div class="stat-sublabel">
              {{ stats.optimizedProjects }} optimized
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔧</div>
          <div class="stat-content">
            <div class="stat-label">Admin Users</div>
            <div class="stat-value">{{ stats.adminUsers }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-label">Projects This Month</div>
            <div class="stat-value">{{ stats.projectsThisMonth }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="card mt-4">
        <h2>Recent Projects</h2>
        <div class="table-container">
          <table class="admin-table" v-if="projects.length > 0">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Owner</th>
                <th>Participants</th>
                <th>Teams</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in projects" :key="project._id">
                <td>
                  <strong>{{ project.projectName }}</strong>
                </td>
                <td>{{ project.userId?.username || 'N/A' }}</td>
                <td>{{ project.participants?.length || 0 }}</td>
                <td>{{ project.generatedTeams?.length || 0 }}</td>
                <td>
                  <span
                    class="badge"
                    :class="project.isOptimized ? 'badge-success' : 'badge-pending'"
                  >
                    {{ project.isOptimized ? 'Optimized' : 'Pending' }}
                  </span>
                </td>
                <td>{{ formatDate(project.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-muted">No projects found</p>
        </div>
      </div>

      <!-- Recent Users -->
      <div class="card mt-4">
        <h2>Recent Users</h2>
        <div class="table-container">
          <table class="admin-table" v-if="users.length > 0">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user._id">
                <td>
                  <strong>{{ user.username }}</strong>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <span
                    class="badge"
                    :class="user.role === 'admin' ? 'badge-admin' : 'badge-user'"
                  >
                    {{ user.role }}
                  </span>
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
              </tr>
            </tbody>
          </table>
          <p v-else class="text-muted">No users found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';

const adminStore = useAdminStore();

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalProjects: 0,
  optimizedProjects: 0,
  adminUsers: 0,
  projectsThisMonth: 0,
});
const users = ref([]);
const projects = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const [statsData, usersData, projectsData] = await Promise.all([
      adminStore.fetchStats(),
      adminStore.fetchUsers(),
      adminStore.fetchProjects(),
    ]);

    stats.value = statsData;
    users.value = usersData.slice(0, 10); // Show only recent 10 users
    projects.value = projectsData.slice(0, 10); // Show only recent 10 projects
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
  padding: 1rem;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #6B7280;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1F2937;
  line-height: 1.2;
}

.stat-sublabel {
  color: #9CA3AF;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  padding: 0.75rem;
  background-color: #F9FAFB;
  color: #6B7280;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 2px solid #E5E7EB;
}

.admin-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #E5E7EB;
  color: #1F2937;
  font-size: 0.875rem;
}

.admin-table tbody tr:hover {
  background-color: #F9FAFB;
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

.badge-pending {
  background-color: #FEF3C7;
  color: #92400E;
}

.badge-admin {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.badge-user {
  background-color: #E5E7EB;
  color: #374151;
}

.badge-warning {
  background-color: #FED7AA;
  color: #9A3412;
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

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
