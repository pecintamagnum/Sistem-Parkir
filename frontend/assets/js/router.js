import { auth } from './auth.js';
import { api } from './api.js';
import { store } from './store.js';

import { loginView } from './views/loginView.js';
import { dashboardView } from './views/dashboardView.js';
import { parkirMasukView } from './views/parkirMasukView.js';
import { parkirKeluarView } from './views/parkirKeluarView.js';
import { monitoringView } from './views/monitoringView.js';
import { masterUserView } from './views/masterUserView.js';
import { masterTarifAreaView } from './views/masterTarifAreaView.js';
import { masterKendaraanView } from './views/masterKendaraanView.js';
import { logAktivitasView } from './views/logAktivitasView.js';
import { laporanOwnerView } from './views/laporanOwnerView.js';

class Router {
  constructor() {
    this.routes = {
      '#/login': { view: loginView, auth: false },
      '#/dashboard': { view: dashboardView, auth: true },
      '#/parkir-masuk': { view: parkirMasukView, auth: true, roles: ['petugas', 'admin'] },
      '#/parkir-keluar': { view: parkirKeluarView, auth: true, roles: ['petugas', 'admin'] },
      '#/monitoring': { view: monitoringView, auth: true, roles: ['petugas', 'admin', 'owner'] },
      '#/users': { view: masterUserView, auth: true, roles: ['admin'] },
      '#/tarif-area': { view: masterTarifAreaView, auth: true, roles: ['admin'] },
      '#/kendaraan': { view: masterKendaraanView, auth: true, roles: ['admin', 'petugas'] },
      '#/logs': { view: logAktivitasView, auth: true, roles: ['admin'] },
      '#/laporan': { view: laporanOwnerView, auth: true, roles: ['owner', 'admin'] }
    };

    this.clockInterval = null;
    this.healthInterval = null;
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    window.addEventListener('load', () => this.handleRouting());

    // Cek koneksi backend secara berkala
    this.startHealthCheck();
  }

  async startHealthCheck() {
    await api.checkBackendHealth();
    this.updateStatusPill();
    if (this.healthInterval) clearInterval(this.healthInterval);
    this.healthInterval = setInterval(async () => {
      await api.checkBackendHealth();
      this.updateStatusPill();
    }, 15000);
  }

  updateStatusPill() {
    const pill = document.getElementById('backend-status-pill');
    if (!pill) return;
    if (api.isBackendOnline) {
      pill.className = 'status-pill status-pill-online';
      pill.innerHTML = '<span class="status-dot online"></span> 🟢 API Terhubung (Live)';
    } else {
      pill.className = 'status-pill status-pill-offline';
      pill.innerHTML = '<span class="status-dot offline"></span> 🟡 Mode Simulasi (Offline)';
    }
  }

  handleRouting() {
    const rawHash = window.location.hash || '#/dashboard';
    const [path, queryString] = rawHash.split('?');
    const queryParams = new URLSearchParams(queryString || '');

    // 1. Cek Autentikasi
    if (!auth.isAuthenticated()) {
      if (path !== '#/login') {
        window.location.hash = '#/login';
        return;
      }
    } else {
      if (path === '#/login' || path === '') {
        window.location.hash = '#/dashboard';
        return;
      }
    }

    const route = this.routes[path];

    // Jika route tidak ditemukan
    if (!route) {
      window.location.hash = '#/dashboard';
      return;
    }

    // 2. Cek Role Authorization Guard
    if (route.roles && !route.roles.includes(auth.getRole())) {
      store.showToast(`Akses ditolak. Halaman ini khusus untuk ${route.roles.join('/')}!`, 'error');
      window.location.hash = '#/dashboard';
      return;
    }

    // 3. Render View
    this.renderPage(path, route.view, queryParams);
  }

  renderPage(path, view, queryParams) {
    const appEl = document.getElementById('app');

    // Jika halaman login: render full tanpa sidebar
    if (path === '#/login') {
      if (this.clockInterval) clearInterval(this.clockInterval);
      appEl.innerHTML = view.render();
      if (view.init) view.init();
      return;
    }

    // Jika belum ada layout master, render shell layout
    if (!document.getElementById('main-shell-wrapper')) {
      appEl.innerHTML = this.getMasterLayoutHtml();
      this.initMasterShellEvents();
    }

    // Update active nav class
    document.querySelectorAll('.nav-item').forEach(item => {
      const targetHash = item.getAttribute('data-hash');
      if (targetHash === path) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Topbar Title
    const titleEl = document.getElementById('page-topbar-title');
    if (titleEl) {
      titleEl.innerText = this.getPageTitle(path);
    }

    // Render content di dalam #page-content
    const contentEl = document.getElementById('page-content');
    contentEl.innerHTML = view.render();
    if (view.init) {
      // Jika view butuh prefill query params (misal pencarian plat pada keluar)
      const searchParam = queryParams.get('search');
      view.init(searchParam);
    }
  }

  getPageTitle(path) {
    const titles = {
      '#/dashboard': '📊 Ringkasan Dashboard',
      '#/parkir-masuk': '🚪 Loket Parkir Masuk (Manual Gate)',
      '#/parkir-keluar': '🏁 Loket Parkir Keluar (Kalkulasi & Bayar)',
      '#/monitoring': '🅿️ Monitoring Kendaraan Aktif',
      '#/users': '👥 Master Data Pengguna',
      '#/tarif-area': '⚙️ Pengaturan Tarif & Area Parkir',
      '#/kendaraan': '🚗 Database Kendaraan',
      '#/logs': '📜 Akses Log Aktivitas Sistem',
      '#/laporan': '📈 Rekap Laporan Transaksi (Owner)'
    };
    return titles[path] || 'Aplikasi Sistem Parkir';
  }

  getMasterLayoutHtml() {
    const user = auth.getUser() || { nama_lengkap: 'Pengguna', role: 'petugas', username: 'petugas' };
    const role = user.role;

    return `
      <div class="app-layout" id="main-shell-wrapper">
        
        <!-- SIDEBAR -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">🚗</div>
            <div>
              <div class="sidebar-title">SISTEM PARKIR</div>
              <div class="sidebar-subtitle">UKK RPL Paket 2</div>
            </div>
          </div>

          <div class="sidebar-menu">
            
            <div class="menu-category">Utama</div>
            <a href="#/dashboard" class="nav-item" data-hash="#/dashboard">
              <span class="nav-icon">📊</span>
              <span>Dashboard</span>
            </a>

            ${(role === 'petugas' || role === 'admin') ? `
              <div class="menu-category">Loket Operator (Manual)</div>
              <a href="#/parkir-masuk" class="nav-item" data-hash="#/parkir-masuk">
                <span class="nav-icon">🟢</span>
                <span>Parkir Masuk</span>
              </a>
              <a href="#/parkir-keluar" class="nav-item" data-hash="#/parkir-keluar">
                <span class="nav-icon">🔴</span>
                <span>Parkir Keluar</span>
              </a>
              <a href="#/monitoring" class="nav-item" data-hash="#/monitoring">
                <span class="nav-icon">🅿️</span>
                <span>Monitoring Aktif</span>
              </a>
            ` : ''}

            ${role === 'admin' ? `
              <div class="menu-category">Master Data (Admin)</div>
              <a href="#/users" class="nav-item" data-hash="#/users">
                <span class="nav-icon">👥</span>
                <span>Manajemen User</span>
              </a>
              <a href="#/tarif-area" class="nav-item" data-hash="#/tarif-area">
                <span class="nav-icon">⚙️</span>
                <span>Tarif & Area</span>
              </a>
              <a href="#/kendaraan" class="nav-item" data-hash="#/kendaraan">
                <span class="nav-icon">🚗</span>
                <span>Data Kendaraan</span>
              </a>
              <a href="#/logs" class="nav-item" data-hash="#/logs">
                <span class="nav-icon">📜</span>
                <span>Log Aktivitas</span>
              </a>
            ` : ''}

            ${(role === 'owner' || role === 'admin') ? `
              <div class="menu-category">Laporan & Evaluasi</div>
              <a href="#/laporan" class="nav-item" data-hash="#/laporan">
                <span class="nav-icon">📈</span>
                <span>Rekap Transaksi</span>
              </a>
            ` : ''}

          </div>

          <div class="sidebar-footer">
            <div class="user-badge-sidebar">
              <div class="user-avatar">${user.nama_lengkap.charAt(0)}</div>
              <div class="user-info-sidebar">
                <div class="user-name-sidebar">${user.nama_lengkap}</div>
                <span class="user-role-badge badge-role-${user.role}">${user.role}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- MAIN WRAPPER -->
        <div class="main-wrapper">
          
          <!-- TOPBAR -->
          <header class="topbar">
            <div class="topbar-left">
              <button type="button" class="btn-sidebar-toggle" id="btn-toggle-sidebar">
                ☰
              </button>
              <h1 class="page-title-top" id="page-topbar-title">Dashboard</h1>
            </div>

            <div class="topbar-right">
              <!-- Live Clock -->
              <div class="live-clock-badge">
                <span>🕒</span>
                <span id="live-clock-text">-:-:- WIB</span>
              </div>

              <!-- Status Pill (Live Backend / Demo Simulation) -->
              <div id="backend-status-pill" class="status-pill status-pill-offline" title="Klik untuk toggle mode simulasi">
                <span class="status-dot offline"></span> 🟡 Mode Simulasi
              </div>

              <!-- Logout Button -->
              <button type="button" class="btn btn-sm btn-outline" id="btn-logout-header" style="color: #ef4444; border-color: #fca5a5;">
                🚪 Logout
              </button>
            </div>
          </header>

          <!-- PAGE CONTENT CONTAINER -->
          <main id="page-content">
            <!-- Rendered by view -->
          </main>

        </div>

      </div>
    `;
  }

  initMasterShellEvents() {
    // Live clock ticker
    const clockEl = document.getElementById('live-clock-text');
    const updateClock = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB';
      }
    };
    updateClock();
    this.clockInterval = setInterval(updateClock, 1000);

    // Initial pill update
    this.updateStatusPill();

    // Toggle Backend Mode Pill (bisa diklik untuk switch live vs mock mode)
    document.getElementById('backend-status-pill')?.addEventListener('click', async () => {
      api.forceMockMode = !api.forceMockMode;
      if (api.forceMockMode) {
        api.isBackendOnline = false;
        store.showToast('Beralih ke MODE SIMULASI (Mock Data).', 'info');
      } else {
        await api.checkBackendHealth();
        store.showToast(api.isBackendOnline ? 'Terhubung kembali ke Live Backend API!' : 'Backend belum online di port 5000.', api.isBackendOnline ? 'success' : 'warning');
      }
      this.updateStatusPill();
      // Reload current page
      this.handleRouting();
    });

    // Mobile sidebar toggle
    const sidebar = document.getElementById('app-sidebar');
    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
    });

    // Logout
    document.getElementById('btn-logout-header')?.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin logout dari sistem?')) {
        auth.logout();
      }
    });
  }
}

export const router = new Router();

