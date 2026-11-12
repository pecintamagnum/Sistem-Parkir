import { api } from '../api.js';
import { store } from '../store.js';

export const laporanOwnerView = {
  currentData: null,

  render() {
    return `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">📊 Rekap Laporan Transaksi & Keuangan (Owner)</h2>
            <p style="font-size: 13px; color: #64748b;">
              Laporan pendapatan parkir dan riwayat pergerakan kendaraan sesuai periode waktu yang diminta.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" id="btn-export-csv" class="btn btn-outline">
              📥 Export ke Excel / CSV
            </button>
            <button type="button" id="btn-cetak-laporan" class="btn btn-primary">
              🖨️ Cetak Laporan Resmi (Print)
            </button>
          </div>
        </div>

        <!-- Filter Periode Waktu & Kategori -->
        <div class="card" style="background: #ffffff; border: 1px solid #cbd5e1;">
          <div class="card-header" style="border-bottom: none; padding-bottom: 0; margin-bottom: 12px;">
            <div class="card-title">🔍 Filter Laporan Sesuai Waktu yang Diminta</div>
          </div>
          
          <div class="grid grid-cols-4">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="lap-start-date">Tanggal Mulai</label>
              <input type="date" id="lap-start-date" class="form-control">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="lap-end-date">Tanggal Akhir</label>
              <input type="date" id="lap-end-date" class="form-control">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="lap-jenis">Jenis Kendaraan</label>
              <select id="lap-jenis" class="form-control">
                <option value="">Semua Jenis</option>
                <option value="motor">Sepeda Motor</option>
                <option value="mobil">Mobil</option>
                <option value="lainnya">Lainnya / Truk</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="lap-status">Status Transaksi</label>
              <select id="lap-status" class="form-control">
                <option value="">Semua Status</option>
                <option value="keluar">Selesai (Sudah Bayar)</option>
                <option value="masuk">Aktif di Dalam</option>
              </select>
            </div>
          </div>

          <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" id="btn-reset-filter" class="btn btn-sm btn-outline">
              🔄 Reset Filter
            </button>
            <button type="button" id="btn-apply-filter" class="btn btn-sm btn-primary">
              Terapkan Filter 🎯
            </button>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-4" style="margin-bottom: 20px;">
          <div class="stat-card green">
            <div>
              <div class="stat-value" id="lap-total-pendapatan">Rp 0</div>
              <div class="stat-label">Total Pendapatan Parkir</div>
            </div>
            <div class="stat-icon green">💰</div>
          </div>

          <div class="stat-card blue">
            <div>
              <div class="stat-value" id="lap-total-trx">0</div>
              <div class="stat-label">Total Transaksi Tercatat</div>
            </div>
            <div class="stat-icon blue">🧾</div>
          </div>

          <div class="stat-card amber">
            <div>
              <div class="stat-value" id="lap-total-aktif">0</div>
              <div class="stat-label">Sedang Parkir (Belum Keluar)</div>
            </div>
            <div class="stat-icon amber">⏳</div>
          </div>

          <div class="stat-card purple">
            <div>
              <div class="stat-value" id="lap-rata-durasi">0 Jam</div>
              <div class="stat-label">Rata-Rata Durasi Parkir</div>
            </div>
            <div class="stat-icon purple">⏱️</div>
          </div>
        </div>

        <!-- Tabel Transaksi -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📋 Rincian Data Transaksi Parkir</div>
            <span style="font-size: 12px; color: #64748b;" id="lap-info-period">Periode: Semua Waktu</span>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode Karcis</th>
                  <th>Nomor Plat</th>
                  <th>Jenis</th>
                  <th>Area Parkir</th>
                  <th>Waktu Masuk</th>
                  <th>Waktu Keluar</th>
                  <th>Durasi</th>
                  <th>Total Biaya</th>
                  <th>Petugas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="lap-tbody">
                <tr>
                  <td colspan="11" style="text-align: center; color: #64748b; padding: 24px;">Memuat data laporan...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- TEMPLATE CETAK LAPORAN RESMI (A4 PRINT VIEW) -->
      <div id="official-print-report" class="printable-report">
        <div class="report-header-kop">
          <h2 style="margin: 0; font-size: 20pt; text-transform: uppercase; letter-spacing: 1px;">SISTEM MANAJEMEN PARKIR MANDIRI</h2>
          <p style="margin: 4px 0; font-size: 11pt;">Laporan Rekapitulasi Transaksi & Pendapatan Keuangan Perparkiran</p>
          <p style="margin: 0; font-size: 9pt; color: #555;">Jl. Pendidikan No. 1, Kota Pelajar | Telp: (021) 778899 | Website: www.sistemparkir.id</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 10pt;">
          <div>
            <b>Filter Periode:</b> <span id="print-periode-label">Semua Waktu</span><br>
            <b>Kategori Kendaraan:</b> <span id="print-jenis-label">Semua Jenis</span>
          </div>
          <div style="text-align: right;">
            <b>Tanggal Cetak:</b> <span id="print-date-today">-</span><br>
            <b>Dicetak Oleh:</b> <span id="print-user-name">Owner / Pimpinan</span>
          </div>
        </div>

        <!-- Summary Print Box -->
        <div style="border: 1px solid #333; padding: 10px; margin-bottom: 15px; display: flex; justify-content: space-around; font-size: 10pt; background-color: #f9f9f9;">
          <div>Total Transaksi: <b id="print-total-trx">0</b></div>
          <div>Kendaraan Selesai: <b id="print-total-keluar">0</b></div>
          <div>Kendaraan Aktif: <b id="print-total-aktif">0</b></div>
          <div>Total Pendapatan: <b id="print-total-pendapatan">Rp 0</b></div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>Kode Karcis</th>
              <th>Plat Nomor</th>
              <th>Jenis</th>
              <th>Area</th>
              <th>Waktu Masuk</th>
              <th>Waktu Keluar</th>
              <th>Durasi</th>
              <th>Biaya</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="print-tbody">
            <!-- Populated via JS -->
          </tbody>
        </table>

        <div class="report-signature">
          <div class="signature-box">
            <p>Mengetahui,</p>
            <p style="font-weight: bold;">Pimpinan / Owner Perusahaan</p>
            <div style="height: 60px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">( .................................... )</p>
            <p style="font-size: 9pt; color: #555;">NIP/Jabatan Resmi</p>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    const startDateInput = document.getElementById('lap-start-date');
    const endDateInput = document.getElementById('lap-end-date');
    const jenisSelect = document.getElementById('lap-jenis');
    const statusSelect = document.getElementById('lap-status');
    const btnApply = document.getElementById('btn-apply-filter');
    const btnReset = document.getElementById('btn-reset-filter');
    const btnExport = document.getElementById('btn-export-csv');
    const btnCetak = document.getElementById('btn-cetak-laporan');

    // Default dates: hari ini
    const todayStr = new Date().toISOString().split('T')[0];

    const loadReport = async () => {
      const sDate = startDateInput?.value || '';
      const eDate = endDateInput?.value || '';
      const jenis = jenisSelect?.value || '';
      const status = statusSelect?.value || '';

      const tbody = document.getElementById('lap-tbody');
      tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: #64748b; padding: 24px;">Memuat data laporan...</td></tr>';

      try {
        const res = await api.getRekapTransaksi({
          startDate: sDate,
          endDate: eDate,
          jenis,
          status,
          limit: 200
        });

        this.currentData = res.data;
        const summary = res.data.summary || {};
        const list = res.data.transaksi || [];

        // Update Stat Cards
        document.getElementById('lap-total-pendapatan').innerText = store.formatRupiah(summary.total_pendapatan || 0);
        document.getElementById('lap-total-trx').innerText = summary.total_transaksi || 0;
        document.getElementById('lap-total-aktif').innerText = summary.total_aktif_masuk || 0;
        document.getElementById('lap-rata-durasi').innerText = `${summary.rata_rata_durasi_jam || 0} Jam`;

        // Update Periode Info Label
        const periodText = sDate && eDate ? `${store.formatDate(sDate)} s/d ${store.formatDate(eDate)}` : 'Semua Waktu';
        document.getElementById('lap-info-period').innerText = `Periode: ${periodText}`;

        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: #64748b; padding: 24px;">Tidak ada transaksi pada filter periode ini.</td></tr>';
          return;
        }

        tbody.innerHTML = list.map((trx, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 700; color: #2563eb;">${trx.kode_karcis}</td>
            <td>
              <span style="font-family: monospace; font-weight: 800; font-size: 13px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 6px; border-radius: 4px;">
                ${trx.plat_nomor}
              </span>
            </td>
            <td style="text-transform: capitalize;">${trx.jenis_kendaraan}</td>
            <td>${trx.nama_area || '-'}</td>
            <td>${store.formatDateTime(trx.waktu_masuk)}</td>
            <td>${trx.waktu_keluar ? store.formatDateTime(trx.waktu_keluar) : '<span style="color: #64748b;">-</span>'}</td>
            <td>${trx.durasi_jam ? trx.durasi_jam + ' Jam' : '-'}</td>
            <td style="font-weight: 700; color: #166534;">${trx.biaya_total ? store.formatRupiah(trx.biaya_total) : '-'}</td>
            <td>${trx.nama_petugas || 'Petugas'}</td>
            <td>
              ${trx.status === 'keluar' 
                ? '<span class="badge badge-success">🏁 Selesai</span>' 
                : '<span class="badge badge-info">🟢 Aktif</span>'}
            </td>
          </tr>
        `).join('');

      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: #ef4444; padding: 24px;">Gagal memuat laporan: ${err.message}</td></tr>`;
      }
    };

    btnApply?.addEventListener('click', () => loadReport());
    btnReset?.addEventListener('click', () => {
      startDateInput.value = '';
      endDateInput.value = '';
      jenisSelect.value = '';
      statusSelect.value = '';
      loadReport();
    });

    // Handle Cetak Laporan Resmi (Print)
    btnCetak?.addEventListener('click', () => {
      if (!this.currentData) {
        store.showToast('Data laporan belum siap dicetak.', 'warning');
        return;
      }

      const summary = this.currentData.summary || {};
      const list = this.currentData.transaksi || [];

      // Update Print Fields
      const sDate = startDateInput.value;
      const eDate = endDateInput.value;
      document.getElementById('print-periode-label').innerText = sDate && eDate ? `${sDate} s/d ${eDate}` : 'Semua Periode';
      document.getElementById('print-jenis-label').innerText = jenisSelect.value || 'Semua Jenis';
      document.getElementById('print-date-today').innerText = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      document.getElementById('print-total-trx').innerText = summary.total_transaksi || 0;
      document.getElementById('print-total-keluar').innerText = summary.total_sudah_keluar || 0;
      document.getElementById('print-total-aktif').innerText = summary.total_aktif_masuk || 0;
      document.getElementById('print-total-pendapatan').innerText = store.formatRupiah(summary.total_pendapatan || 0);

      const printTbody = document.getElementById('print-tbody');
      printTbody.innerHTML = list.map((trx, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${trx.kode_karcis}</td>
          <td><b>${trx.plat_nomor}</b></td>
          <td style="text-transform: capitalize;">${trx.jenis_kendaraan}</td>
          <td>${trx.nama_area || '-'}</td>
          <td>${store.formatDateTime(trx.waktu_masuk)}</td>
          <td>${trx.waktu_keluar ? store.formatDateTime(trx.waktu_keluar) : '-'}</td>
          <td>${trx.durasi_jam ? trx.durasi_jam + ' Jam' : '-'}</td>
          <td>${trx.biaya_total ? store.formatRupiah(trx.biaya_total) : '-'}</td>
          <td>${trx.status === 'keluar' ? 'Selesai' : 'Aktif'}</td>
        </tr>
      `).join('');

      store.printOfficialReport();
    });

    // Handle Export CSV
    btnExport?.addEventListener('click', () => {
      if (!this.currentData || !this.currentData.transaksi || this.currentData.transaksi.length === 0) {
        store.showToast('Tidak ada data untuk diekspor.', 'warning');
        return;
      }

      const list = this.currentData.transaksi;
      const headers = ['No', 'Kode Karcis', 'Plat Nomor', 'Jenis', 'Area', 'Waktu Masuk', 'Waktu Keluar', 'Durasi Jam', 'Total Biaya', 'Status', 'Petugas'];
      
      const rows = list.map((t, i) => [
        i + 1,
        `"${t.kode_karcis}"`,
        `"${t.plat_nomor}"`,
        `"${t.jenis_kendaraan}"`,
        `"${t.nama_area || ''}"`,
        `"${t.waktu_masuk || ''}"`,
        `"${t.waktu_keluar || ''}"`,
        t.durasi_jam || 0,
        t.biaya_total || 0,
        `"${t.status}"`,
        `"${t.nama_petugas || ''}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + 
        [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laporan_Parkir_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      store.showToast('Laporan CSV berhasil diunduh!', 'success');
    });

    await loadReport();
  }
};

