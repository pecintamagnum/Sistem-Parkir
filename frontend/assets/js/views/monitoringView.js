import { api } from '../api.js';
import { store } from '../store.js';

export const monitoringView = {
  render() {
    return `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">🅿️ Monitoring Kendaraan Parkir Aktif</h2>
            <p style="font-size: 13px; color: #64748b;">
              Daftar seluruh kendaraan yang saat ini sedang berada di dalam area parkir.
            </p>
          </div>
          <a href="#/parkir-masuk" class="btn btn-primary">
            ➕ Input Parkir Masuk
          </a>
        </div>

        <div class="card">
          <!-- Filter Bar -->
          <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
              <input 
                type="text" 
                id="monitor-search" 
                class="form-control" 
                placeholder="Cari Plat Nomor, Kode Karcis, atau Pemilik..."
              >
            </div>
            <div style="width: 200px;">
              <select id="monitor-area-filter" class="form-control">
                <option value="">Semua Area</option>
              </select>
            </div>
            <button type="button" id="btn-refresh-monitor" class="btn btn-outline">
              🔄 Muat Ulang
            </button>
          </div>

          <!-- Tabel Kendaraan Aktif -->
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode Karcis</th>
                  <th>Plat Nomor</th>
                  <th>Jenis Kendaraan</th>
                  <th>Area Parkir</th>
                  <th>Waktu Masuk</th>
                  <th>Durasi Berjalan</th>
                  <th>Petugas Masuk</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody id="monitor-tbody">
                <tr>
                  <td colspan="9" style="text-align: center; color: #64748b; padding: 24px;">
                    Memuat data kendaraan aktif...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total Info -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 13px; color: #64748b;">
            <div id="monitor-count-info">Menampilkan 0 kendaraan aktif</div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    const searchInput = document.getElementById('monitor-search');
    const areaFilter = document.getElementById('monitor-area-filter');
    const btnRefresh = document.getElementById('btn-refresh-monitor');

    // Load filter area options
    try {
      const resArea = await api.getArea();
      const areas = resArea.data || [];
      areaFilter.innerHTML = '<option value="">Semua Area</option>' + 
        areas.map(a => `<option value="${a.id_area}">${a.nama_area}</option>`).join('');
    } catch (e) {
      console.warn(e);
    }

    const loadData = async () => {
      const search = searchInput?.value.trim() || '';
      const id_area = areaFilter?.value || '';

      const tbody = document.getElementById('monitor-tbody');
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 24px;">Memuat data...</td></tr>';

      try {
        const res = await api.getTransaksiAktif({ search, id_area, limit: 100 });
        const list = (res.data && res.data.transaksi) ? res.data.transaksi : [];
        const countInfo = document.getElementById('monitor-count-info');
        if (countInfo) countInfo.innerText = `Menampilkan ${list.length} kendaraan aktif di dalam area`;

        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 24px;">Tidak ada kendaraan yang sedang parkir saat ini.</td></tr>';
          return;
        }

        tbody.innerHTML = list.map((trx, idx) => {
          const now = Date.now();
          const masukTime = new Date(trx.waktu_masuk).getTime();
          const diffMinutes = Math.max(1, Math.floor((now - masukTime) / (60 * 1000)));
          const jam = Math.floor(diffMinutes / 60);
          const menit = diffMinutes % 60;
          const durasiStr = `${jam > 0 ? jam + ' jam ' : ''}${menit} menit`;

          return `
            <tr>
              <td>${idx + 1}</td>
              <td style="font-family: monospace; font-weight: 700; color: #2563eb;">${trx.kode_karcis}</td>
              <td>
                <span style="font-family: monospace; font-weight: 800; font-size: 14px; background: #f1f5f9; padding: 3px 6px; border-radius: 4px;">
                  ${trx.plat_nomor}
                </span>
              </td>
              <td style="text-transform: capitalize;">
                ${trx.jenis_kendaraan === 'motor' ? '🏍️ Motor' : trx.jenis_kendaraan === 'mobil' ? '🚗 Mobil' : '🚚 ' + trx.jenis_kendaraan}
              </td>
              <td>${trx.nama_area || '-'}</td>
              <td>${store.formatDateTime(trx.waktu_masuk)}</td>
              <td>
                <span class="badge badge-warning">⏱️ ${durasiStr}</span>
              </td>
              <td>${trx.nama_petugas || 'Petugas'}</td>
              <td>
                <button type="button" class="btn btn-sm btn-success btn-checkout-quick" data-plat="${trx.plat_nomor}">
                  Keluar & Bayar ➡️
                </button>
              </td>
            </tr>
          `;
        }).join('');

        // Listener tombol checkout cepat
        document.querySelectorAll('.btn-checkout-quick').forEach(btn => {
          btn.addEventListener('click', () => {
            const plat = btn.getAttribute('data-plat');
            window.location.hash = `#/parkir-keluar?search=${encodeURIComponent(plat)}`;
          });
        });

      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #ef4444; padding: 24px;">Gagal memuat data: ${err.message}</td></tr>`;
      }
    };

    searchInput?.addEventListener('input', () => loadData());
    areaFilter?.addEventListener('change', () => loadData());
    btnRefresh?.addEventListener('click', () => loadData());

    // Initial load
    await loadData();
  }
};

