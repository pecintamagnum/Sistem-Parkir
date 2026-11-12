import { auth } from '../auth.js';
import { api } from '../api.js';
import { store } from '../store.js';

export const dashboardView = {
  render() {
    const user = auth.getUser() || { nama_lengkap: 'Pengguna', role: 'petugas' };

    return `
      <div class="page-container">
        
        <!-- Welcome Banner -->
        <div class="card" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; border: none; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: gap; gap: 16px;">
            <div>
              <span class="badge ${user.role === 'admin' ? 'badge-warning' : user.role === 'petugas' ? 'badge-info' : 'badge-neutral'}" style="margin-bottom: 8px;">
                ROLE: ${user.role.toUpperCase()}
              </span>
              <h2 style="font-size: 22px; font-weight: 800;">Halo, ${user.nama_lengkap}! 👋</h2>
              <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
                Selamat datang di Sistem Informasi Parkir Berbasis Petugas (Manual Gate Operator).
              </p>
            </div>
            ${user.role === 'petugas' ? `
              <div style="display: flex; gap: 10px;">
                <a href="#/parkir-masuk" class="btn btn-primary">
                  🟢 Loket Masuk
                </a>
                <a href="#/parkir-keluar" class="btn btn-success">
                  🔴 Loket Keluar
                </a>
              </div>
            ` : user.role === 'owner' ? `
              <div>
                <a href="#/laporan" class="btn btn-primary">
                  📊 Lihat Laporan Keuangan
                </a>
              </div>
            ` : `
              <div>
                <a href="#/users" class="btn btn-outline" style="color: #fff; border-color: #475569;">
                  👥 Kelola Petugas & User
                </a>
              </div>
            `}
          </div>
        </div>

        <!-- Stat Widgets Section -->
        <div class="grid grid-cols-4" id="dashboard-stats-grid">
          <div class="stat-card blue">
            <div>
              <div class="stat-value" id="stat-transaksi-today">-</div>
              <div class="stat-label">Total Transaksi Hari Ini</div>
            </div>
            <div class="stat-icon blue">🚗</div>
          </div>

          <div class="stat-card green">
            <div>
              <div class="stat-value" id="stat-pendapatan-today">-</div>
              <div class="stat-label">Pendapatan Hari Ini</div>
            </div>
            <div class="stat-icon green">💰</div>
          </div>

          <div class="stat-card amber">
            <div>
              <div class="stat-value" id="stat-aktif-masuk">-</div>
              <div class="stat-label">Sedang Parkir (Aktif)</div>
            </div>
            <div class="stat-icon amber">🅿️</div>
          </div>

          <div class="stat-card purple">
            <div>
              <div class="stat-value" id="stat-sudah-keluar">-</div>
              <div class="stat-label">Selesai / Sudah Keluar</div>
            </div>
            <div class="stat-icon purple">🏁</div>
          </div>
        </div>

        <!-- 2 Column Section: Kapasitas Area & Transaksi Terkini -->
        <div class="grid grid-cols-2" style="margin-top: 20px;">
          
          <!-- Card Kapasitas Area Parkir -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">📍 Kapasitas Area Parkir Real-Time</div>
                <div class="card-desc">Status ketersediaan slot kendaraan di setiap area</div>
              </div>
              ${user.role === 'admin' ? `<a href="#/tarif-area" class="btn btn-sm btn-outline">Edit Area</a>` : ''}
            </div>
            <div id="area-capacity-container" style="display: flex; flex-direction: column; gap: 14px;">
              <p style="color: #64748b; font-size: 13px;">Memuat data area...</p>
            </div>
          </div>

          <!-- Card Transaksi Terkini -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">⚡ Transaksi Parkir Terkini</div>
                <div class="card-desc">5 aktivitas kendaraan parkir paling baru</div>
              </div>
              <a href="#/monitoring" class="btn btn-sm btn-outline">Lihat Semua</a>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Plat / Karcis</th>
                    <th>Jenis</th>
                    <th>Area</th>
                    <th>Waktu</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="dashboard-recent-table">
                  <tr>
                    <td colspan="5" style="text-align: center; color: #64748b;">Memuat data transaksi...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  async init() {
    try {
      const res = await api.getDashboardOverview();
      const data = res.data || {};
      const today = data.today || {};

      // Fill Stat Cards
      document.getElementById('stat-transaksi-today').innerText = today.total_transaksi_hari_ini || 0;
      document.getElementById('stat-pendapatan-today').innerText = store.formatRupiah(today.pendapatan_hari_ini || 0);
      document.getElementById('stat-aktif-masuk').innerText = today.kendaraan_masuk_hari_ini || 0;
      document.getElementById('stat-sudah-keluar').innerText = today.kendaraan_keluar_hari_ini || 0;

      // Render Area Capacities
      const areaContainer = document.getElementById('area-capacity-container');
      const areas = data.area_kapasitas || [];
      if (areas.length === 0) {
        areaContainer.innerHTML = '<p style="color: #64748b; font-size: 13px;">Belum ada area parkir terdaftar.</p>';
      } else {
        areaContainer.innerHTML = areas.map(area => {
          const persen = parseFloat(area.persentase_terisi) || 0;
          let progressClass = 'progress-green';
          let statusBadge = '<span class="badge badge-success">Tersedia</span>';

          if (persen >= 100) {
            progressClass = 'progress-red';
            statusBadge = '<span class="badge badge-danger">PENUH</span>';
          } else if (persen >= 75) {
            progressClass = 'progress-amber';
            statusBadge = '<span class="badge badge-warning">Hampir Penuh</span>';
          }

          return `
            <div class="area-capacity-card">
              <div class="area-capacity-header">
                <div>
                  <span class="area-capacity-title">${area.nama_area}</span>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                    Terisi: <b>${area.terisi}</b> / ${area.kapasitas} slot (Sisa: <b>${area.sisa_slot || (area.kapasitas - area.terisi)}</b>)
                  </div>
                </div>
                <div>${statusBadge}</div>
              </div>
              <div class="capacity-progress">
                <div class="capacity-progress-bar ${progressClass}" style="width: ${Math.min(100, persen)}%;"></div>
              </div>
              <div style="font-size: 11px; text-align: right; color: #64748b;">
                ${persen}% Terisi
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Recent Transactions
      const recentTbody = document.getElementById('dashboard-recent-table');
      const recents = data.transaksi_terbaru || [];
      if (recents.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">Belum ada aktivitas parkir.</td></tr>';
      } else {
        recentTbody.innerHTML = recents.map(trx => `
          <tr>
            <td>
              <div style="font-weight: 700; font-family: monospace;">${trx.plat_nomor}</div>
              <div style="font-size: 11px; color: #64748b;">${trx.kode_karcis}</div>
            </td>
            <td style="text-transform: capitalize;">${trx.jenis_kendaraan}</td>
            <td>${trx.nama_area || '-'}</td>
            <td>${store.formatTime(trx.waktu_masuk)}</td>
            <td>
              ${trx.status === 'masuk' 
                ? '<span class="badge badge-info">🟢 Masuk</span>' 
                : '<span class="badge badge-success">🏁 Selesai</span>'}
            </td>
          </tr>
        `).join('');
      }

    } catch (err) {
      console.error('[DASHBOARD INIT ERROR]', err);
      store.showToast('Gagal memuat ringkasan dashboard.', 'warning');
    }
  }
};

