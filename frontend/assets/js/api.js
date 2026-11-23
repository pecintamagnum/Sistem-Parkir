export const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.isBackendOnline = true;
  }

  // Cek apakah server backend aktif
  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.isBackendOnline = (res.status === 200 || res.status === 401);
      return this.isBackendOnline;
    } catch (e) {
      this.isBackendOnline = false;
      return false;
    }
  }

  getHeaders() {
    const token = localStorage.getItem('parkir_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Request HTTP murni ke Backend API (Mode Online Live Only)
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {})
        }
      };

      const res = await fetch(url, config);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      this.isBackendOnline = true;
      return data;
    } catch (err) {
      console.error(`[API REQUEST ERROR pada ${endpoint}]:`, err.message);
      if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
        this.isBackendOnline = false;
        throw new Error('Tidak dapat terhubung ke Backend API (Port 5000). Pastikan server backend dan database MySQL aktif!');
      }
      throw err;
    }
  }

  // --- SHORTCUT API CALLS ---
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  getProfile() {
    return this.request('/auth/me');
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  parkirMasuk(data) {
    return this.request('/transaksi/masuk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  cekParkirKeluar(search) {
    return this.request(`/transaksi/cek-keluar?search=${encodeURIComponent(search)}`);
  }

  bayarParkirKeluar(id_parkir, jumlah_bayar) {
    return this.request('/transaksi/keluar', {
      method: 'POST',
      body: JSON.stringify({ id_parkir, jumlah_bayar })
    });
  }

  getTransaksiAktif(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transaksi/aktif?${query}`);
  }

  getDetailTransaksi(id) {
    return this.request(`/transaksi/${id}`);
  }

  getDashboardOverview() {
    return this.request('/reports/dashboard');
  }

  getRekapTransaksi(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/transaksi?${query}`);
  }

  getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users?${query}`);
  }

  createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  getTarif() {
    return this.request('/tarif');
  }

  createTarif(data) {
    return this.request('/tarif', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTarif(id, data) {
    return this.request(`/tarif/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteTarif(id) {
    return this.request(`/tarif/${id}`, { method: 'DELETE' });
  }

  getArea() {
    return this.request('/area');
  }

  createArea(data) {
    return this.request('/area', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateArea(id, data) {
    return this.request(`/area/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteArea(id) {
    return this.request(`/area/${id}`, { method: 'DELETE' });
  }

  getKendaraan(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/kendaraan?${query}`);
  }

  getLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/logs?${query}`);
  }
}

export const api = new ApiService();
