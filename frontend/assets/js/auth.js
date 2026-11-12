import { api } from './api.js';
import { store } from './store.js';

class AuthService {
  constructor() {
    this.tokenKey = 'parkir_token';
    this.userKey = 'parkir_user';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getUser() {
    const data = localStorage.getItem(this.userKey);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  }

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }

  hasRole(allowedRoles) {
    const role = this.getRole();
    if (!role) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(role);
    }
    return role === allowedRoles;
  }

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  async login(username, password) {
    try {
      const res = await api.login(username, password);
      if (res && res.data && res.data.token) {
        this.setSession(res.data.token, res.data.user);
        store.showToast(`Selamat datang, ${res.data.user.nama_lengkap}!`, 'success');
        return res.data;
      }
      throw new Error(res.message || 'Gagal login.');
    } catch (err) {
      store.showToast(err.message, 'error');
      throw err;
    }
  }

  async logout() {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
      store.showToast('Anda telah berhasil logout.', 'info');
      window.location.hash = '#/login';
    }
  }
}

export const auth = new AuthService();

