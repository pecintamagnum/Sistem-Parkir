import { api } from '../api.js';
import { store } from '../store.js';

export const logAktivitasView = {
  render() {
    return `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">📜 Akses Log Aktivitas Sistem (Admin)</h2>
            <p style="font-size: 13px; color: #64748b;">
              Audit trail rekam jejak setiap aksi petugas, administrator, dan pergerakan transaksi parkir.
            </p>
          </div>
          <button type="button" id="btn-refresh-log" class="btn btn-outline">
            🔄 Refresh Log
          </button>
        </div>

        <div class="card">
          <!-- Filter Bar -->
          <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
              <input type="text" id="log-search" class="form-control" placeholder="Cari aktivitas atau username petugas...">
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 12px; color: #64748b;">Dari:</span>
              <input type="date" id="log-start-date" class="form-control" style="width: 150px;">
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 12px; color: #64748b;">Sampai:</span>
              <input type="date" id="log-end-date" class="form-control" style="width: 150px;">
            </div>
          </div>

          <!-- Tabel Log -->
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Waktu Kejadian</th>
                  <th>Pengguna / Pelaku</th>
                  <th>Role</th>
                  <th>Deskripsi Aktivitas</th>
                </tr>
              </thead>
              <tbody id="log-tbody">
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 24px;">Memuat riwayat log...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    const tbody = document.getElementById('log-tbody');
    const searchInput = document.getElementById('log-search');
    const startDate = document.getElementById('log-start-date');
    const endDate = document.getElementById('log-end-date');
    const btnRefresh = document.getElementById('btn-refresh-log');

    const loadData = async () => {
      const search = searchInput?.value.trim() || '';
      const sDate = startDate?.value || '';
      const eDate = endDate?.value || '';

      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Memuat log aktivitas...</td></tr>';

      try {
        const res = await api.getLogs({ search, startDate: sDate, endDate: eDate, limit: 100 });
        const list = (res.data && res.data.logs) ? res.data.logs : [];

        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Belum ada log aktivitas yang tercatat.</td></tr>';
          return;
        }

        tbody.innerHTML = list.map((l, idx) => {
          let roleBadge = '<span class="badge badge-info">Petugas</span>';
          if (l.role === 'admin') roleBadge = '<span class="badge badge-warning">Admin</span>';
          if (l.role === 'owner') roleBadge = '<span class="badge badge-neutral">Owner</span>';

          return `
            <tr>
              <td>${idx + 1}</td>
              <td style="white-space: nowrap; font-size: 12px;">${store.formatDateTime(l.waktu_aktivitas)}</td>
              <td style="font-weight: 600;">${l.username || l.nama_lengkap || 'System'}</td>
              <td>${roleBadge}</td>
              <td style="color: #1e293b;">${l.aktivitas}</td>
            </tr>
          `;
        }).join('');

      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 20px;">Gagal: ${err.message}</td></tr>`;
      }
    };

    searchInput?.addEventListener('input', () => loadData());
    startDate?.addEventListener('change', () => loadData());
    endDate?.addEventListener('change', () => loadData());
    btnRefresh?.addEventListener('click', () => loadData());

    await loadData();
  }
};

