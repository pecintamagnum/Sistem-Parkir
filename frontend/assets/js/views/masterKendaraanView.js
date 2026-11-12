import { api } from '../api.js';
import { store } from '../store.js';

export const masterKendaraanView = {
  render() {
    return `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">🚗 Master Data Kendaraan</h2>
            <p style="font-size: 13px; color: #64748b;">
              Database rekaman kendaraan yang pernah masuk dan terdaftar di sistem perparkiran.
            </p>
          </div>
          <button type="button" id="btn-refresh-kendaraan" class="btn btn-outline">
            🔄 Refresh Data
          </button>
        </div>

        <div class="card">
          <!-- Search Bar -->
          <div style="margin-bottom: 16px;">
            <input 
              type="text" 
              id="kendaraan-search" 
              class="form-control" 
              placeholder="Cari Plat Nomor, Pemilik, atau Warna..."
            >
          </div>

          <!-- Tabel Kendaraan -->
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nomor Polisi (Plat)</th>
                  <th>Jenis Kendaraan</th>
                  <th>Warna</th>
                  <th>Nama Pemilik</th>
                </tr>
              </thead>
              <tbody id="kendaraan-tbody">
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 24px;">Memuat data kendaraan...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    const tbody = document.getElementById('kendaraan-tbody');
    const searchInput = document.getElementById('kendaraan-search');
    const btnRefresh = document.getElementById('btn-refresh-kendaraan');

    const loadData = async () => {
      const search = searchInput?.value.trim() || '';
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Memuat data...</td></tr>';

      try {
        const res = await api.getKendaraan({ search, limit: 100 });
        const list = (res.data && res.data.kendaraan) ? res.data.kendaraan : [];

        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Tidak ada kendaraan ditemukan.</td></tr>';
          return;
        }

        tbody.innerHTML = list.map((k, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <span style="font-family: monospace; font-weight: 800; font-size: 14px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px;">
                ${k.plat_nomor}
              </span>
            </td>
            <td style="text-transform: capitalize;">
              ${k.jenis_kendaraan === 'motor' ? '🏍️ Motor' : k.jenis_kendaraan === 'mobil' ? '🚗 Mobil' : '🚚 ' + k.jenis_kendaraan}
            </td>
            <td>${k.warna || '-'}</td>
            <td style="font-weight: 600;">${k.pemilik || 'Umum'}</td>
          </tr>
        `).join('');

      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 20px;">Gagal: ${err.message}</td></tr>`;
      }
    };

    searchInput?.addEventListener('input', () => loadData());
    btnRefresh?.addEventListener('click', () => loadData());

    await loadData();
  }
};

