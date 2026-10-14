const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api/v1` : '/api/v1';

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function request(endpoint, options = {}) {
  const csrfToken = getCookie('csrftoken');
  const authToken = localStorage.getItem('auth_token');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (authToken) {
    defaultHeaders['Authorization'] = `Token ${authToken}`;
  }

  if (csrfToken && options.method && options.method !== 'GET') {
    defaultHeaders['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include session cookies
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.detail || (data && typeof data === 'object' ? JSON.stringify(data) : null) || `Server error (${response.status}: ${response.statusText})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  getCurrentUser: () => request('/auth/me/'),
  updateAvatar: (avatar) => request('/auth/me/', { method: 'POST', body: JSON.stringify({ avatar }) }),
  sendOTP: (email, purpose) => request('/auth/send-otp/', { method: 'POST', body: JSON.stringify({ email, purpose }) }),
  signup: (signupData) => request('/auth/signup/', { method: 'POST', body: JSON.stringify(signupData) }),
  resetPassword: (resetData) => request('/auth/reset-password/', { method: 'POST', body: JSON.stringify(resetData) }),


  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary/'),

  // Products
  getProducts: (params = '') => request(`/products/${params}`),
  createProduct: (productData) => request('/products/', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id, productData) => request(`/products/${id}/`, { method: 'PATCH', body: JSON.stringify(productData) }),
  archiveProduct: (id) => request(`/products/${id}/archive/`, { method: 'POST' }),
  restoreProduct: (id) => request(`/products/${id}/restore/`, { method: 'POST' }),
  setAlertThreshold: (id, min_stock_level) => request(`/products/${id}/set-threshold/`, { method: 'POST', body: JSON.stringify({ min_stock_level }) }),


  // Categories & Suppliers
  getCategories: () => request('/categories/'),
  getSuppliers: () => request('/suppliers/'),

  // Stock Transactions
  getTransactions: (params = '') => request(`/stock-transactions/${params}`),
  createTransaction: (txData) => request('/stock-transactions/', { method: 'POST', body: JSON.stringify(txData) }),

  // Alerts
  getAlerts: () => request('/alerts/'),
  acknowledgeAlert: (id) => request(`/alerts/${id}/acknowledge/`, { method: 'POST' }),
  resolveAlert: (id) => request(`/alerts/${id}/resolve/`, { method: 'POST' }),
  markAllAlertsRead: () => request('/alerts/mark-all-read/', { method: 'POST' }),
  getAlertPdfUrl: () => `${API_BASE}/alerts/download-pdf/`,


  // Audit Logs
  getAuditLogs: () => request('/audit-logs/'),

  // Employees & Staff Management
  getUsers: (params = '') => request(`/users/${params}`),
  createUser: (userData) => request('/users/', { method: 'POST', body: JSON.stringify(userData) }),
  updateEmployee: (id, userData) => request(`/users/${id}/`, { method: 'PUT', body: JSON.stringify(userData) }),
  toggleUserActive: (id) => request(`/users/${id}/toggle-active/`, { method: 'POST' }),
  updateUserRole: (id, role) => request(`/users/${id}/update-role/`, { method: 'POST', body: JSON.stringify({ role }) }),

  // Onboarding & Interactive Tour Gateway
  getOnboardingStatus: () => request('/onboarding/status/'),
  startTour: () => request('/onboarding/start/', { method: 'POST' }),
  saveTourProgress: (chapter, step_index) => request('/onboarding/save-progress/', { method: 'POST', body: JSON.stringify({ chapter, step_index }) }),
  completeTourChapter: (chapter) => request('/onboarding/complete-chapter/', { method: 'POST', body: JSON.stringify({ chapter }) }),
  completeChecklistItem: (item_id) => request('/onboarding/complete-checklist-item/', { method: 'POST', body: JSON.stringify({ item_id }) }),
  dismissChecklist: () => request('/onboarding/dismiss-checklist/', { method: 'POST' }),
  skipTour: () => request('/onboarding/skip/', { method: 'POST' }),
  finishTour: () => request('/onboarding/finish/', { method: 'POST' }),
  restartTour: () => request('/onboarding/restart/', { method: 'POST' }),

  // Export URL helpers
  getExportUrl: (type) => `${API_BASE}/reports/export/${type}/`,
};
