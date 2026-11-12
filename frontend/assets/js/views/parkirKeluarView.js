import { api } from '../api.js';
import { store } from '../store.js';

export const parkirKeluarView = {
  currentTrx: null,

  render() {
    return `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">🏁 Loket Gerbang Parkir Keluar (Petugas)</h2>
            <p style="font-size: 13px; color: #64748b;">
              Cari plat nomor atau kode karcis, kalkulasi durasi & biaya otomatis, terima pembayaran, lalu cetak struk keluar.
            </p>
          </div>
          <a href="#/monitoring" class="btn btn-outline">
            📋 Cari Dari Daftar Aktif
          </a>
        </div>

        <div class="grid grid-cols-3">
          
          <!-- Kolom 1 & 2: Form Cari & Kalkulasi Biaya -->
          <div style="grid-column: span 2;">
            
            <!-- Pencarian Plat / Karcis -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">🔍 Identifikasi Kendaraan Keluar</div>
                <div class="card-desc">Cari berdasarkan Kode Karcis atau Nomor Plat Polisi</div>
              </div>

              <form id="form-cari-keluar" style="display: flex; gap: 12px;">
                <input 
                  type="text" 
                  id="keluar-search-input" 
                  class="form-control input-plate" 
                  placeholder="Ketik Plat (misal: B 1234 ABC) atau Kode Karcis"
                  required
                  autocomplete="off"
                  style="flex: 1;"
                >
                <button type="submit" id="btn-cari-keluar" class="btn btn-primary" style="padding: 0 24px;">
                  Periksa Kendaraan 🔎
                </button>
              </form>
            </div>

            <!-- Detail Kalkulasi Biaya (Muncul setelah pencarian sukses) -->
            <div class="card" id="keluar-detail-card" style="display: none;">
              <div class="card-header">
                <div>
                  <div class="card-title">💳 Rincian Tagihan Parkir</div>
                  <div class="card-desc">Kalkulasi durasi waktu & tarif parkir otomatis</div>
                </div>
                <span class="badge badge-info" id="badge-status-karcis">Kendaraan Masuk</span>
              </div>

              <!-- Info Grid Ringkasan -->
              <div class="grid grid-cols-2" style="margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div>
                  <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Nomor Polisi</div>
                  <div id="res-plat" style="font-size: 20px; font-weight: 800; font-family: monospace;">-</div>
                  <div id="res-jenis" style="font-size: 13px; color: #475569; margin-top: 2px;">-</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Kode Karcis</div>
                  <div id="res-kode" style="font-size: 16px; font-weight: 700; color: #2563eb;">-</div>
                  <div id="res-area" style="font-size: 13px; color: #475569; margin-top: 2px;">-</div>
                </div>
              </div>

              <!-- Tabel Waktu & Durasi -->
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <table class="data-table">
                  <tbody>
                    <tr>
                      <td style="width: 40%; font-weight: 600;">Waktu Masuk</td>
                      <td id="res-waktu-masuk">-</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Waktu Keluar (Saat Ini)</td>
                      <td id="res-waktu-keluar">-</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Total Durasi Parkir</td>
                      <td>
                        <span id="res-durasi-jam" style="font-weight: 800; color: #2563eb; font-size: 16px;">- Jam</span>
                        <span style="font-size: 11px; color: #64748b; margin-left: 6px;">(Dibulatkan ke atas / Ceil)</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Tarif Parkir / Jam</td>
                      <td id="res-tarif-jam">-</td>
                    </tr>
                    <tr style="background-color: #eff6ff;">
                      <td style="font-weight: 800; font-size: 16px; color: #1e3a8a;">TOTAL BIAYA PARKIR</td>
                      <td>
                        <span id="res-total-biaya" style="font-size: 24px; font-weight: 800; color: #1d4ed8;">Rp 0</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Form Pembayaran Tunai -->
              <div style="background: #ffffff; border: 2px solid #cbd5e1; border-radius: 12px; padding: 20px;">
                <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
                  💵 Penerimaan Pembayaran Tunai
                </h4>

                <div class="form-group">
                  <label class="form-label" for="keluar-bayar-input">
                    Nominal Uang Diterima dari Pengendara (Rp) <span class="required">*</span>
                  </label>
                  <input 
                    type="number" 
                    id="keluar-bayar-input" 
                    class="form-control" 
                    placeholder="Masukkan jumlah uang, misal: 10000" 
                    min="0"
                    style="font-size: 20px; font-weight: 700; height: 50px;"
                  >
                </div>

                <!-- Tombol Shortcut Uang Tunai -->
                <div class="cash-preset-grid">
                  <button type="button" class="btn-preset" id="preset-pas">Uang Pas</button>
                  <button type="button" class="btn-preset" data-val="5000">Rp 5.000</button>
                  <button type="button" class="btn-preset" data-val="10000">Rp 10.000</button>
                  <button type="button" class="btn-preset" data-val="20000">Rp 20.000</button>
                  <button type="button" class="btn-preset" data-val="50000">Rp 50.000</button>
                  <button type="button" class="btn-preset" data-val="100000">Rp 100.000</button>
                </div>

                <!-- Live Display Kembalian -->
                <div style="margin-top: 16px; padding: 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; font-size: 14px;">Uang Kembalian:</span>
                  <span id="display-kembalian" style="font-size: 20px; font-weight: 800; color: #10b981;">Rp 0</span>
                </div>

                <div id="warning-kurang" style="display: none; color: #ef4444; font-size: 13px; font-weight: 600; margin-top: 8px;">
                  ⚠️ Uang pembayaran masih kurang dari total tagihan!
                </div>

                <button type="button" id="btn-proses-bayar" class="btn btn-success btn-lg btn-block" style="margin-top: 20px;">
                  ✅ Selesaikan Pembayaran & Cetak Struk Keluar
                </button>
              </div>

            </div>

          </div>

          <!-- Kolom 3: Alur Manual Petugas & Bantuan -->
          <div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">🚦 Alur Loket Keluar</div>
              </div>
              <ol style="font-size: 12px; color: #475569; padding-left: 18px; line-height: 1.8;">
                <li>Pengendara menyerahkan karcis atau menyebutkan nomor plat.</li>
                <li>Petugas menginput nomor plat / kode pada kolom cari.</li>
                <li>Sistem menampilkan durasi waktu dan total tagihan.</li>
                <li>Petugas menerima uang tunai dari pengendara.</li>
                <li>Input nominal uang dan serahkan kembalian (jika ada).</li>
                <li>Klik tombol <b>Selesaikan Pembayaran</b>.</li>
                <li>Cetak struk resmi keluar dan berikan kepada pengendara.</li>
                <li>Palang pintu terbuka / kendaraan dipersilakan keluar.</li>
              </ol>
            </div>

            <!-- Kartu Info Waktu Realtime -->
            <div class="card" style="text-align: center; background: #f0fdf4; border-color: #bbf7d0;">
              <div style="font-size: 12px; color: #166534; font-weight: 700;">TARIF PARKIR BERLAKU</div>
              <div style="font-size: 11px; color: #15803d; margin-top: 4px;">
                Motor: Rp 2.000/jam | Mobil: Rp 5.000/jam | Lainnya: Rp 10.000/jam
              </div>
            </div>
          </div>

        </div>

        <!-- MODAL POPUP CETAK STRUK PEMBAYARAN KELUAR -->
        <div id="modal-struk-keluar" class="modal-overlay">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title">🏁 Struk Pembayaran Parkir Selesai</div>
              <button class="btn-close-modal" id="btn-close-struk-x">&times;</button>
            </div>
            
            <div class="modal-body">
              <!-- Thermal Receipt Struk -->
              <div class="thermal-receipt" id="thermal-struk-ticket">
                <div class="receipt-header">
                  <div class="receipt-title">STRUK PEMBAYARAN PARKIR</div>
                  <div class="receipt-subtitle">Sistem Informasi Parkir UKK RPL Paket 2</div>
                  <div class="receipt-subtitle">Gerbang Keluar Operator Manual</div>
                </div>

                <div class="receipt-body">
                  <div class="receipt-row">
                    <span>No. Karcis</span>
                    <b id="struk-kode">-</b>
                  </div>
                  <div class="receipt-row">
                    <span>Plat Nomor</span>
                    <b id="struk-plat" style="font-size: 15px;">-</b>
                  </div>
                  <div class="receipt-row">
                    <span>Jenis</span>
                    <span id="struk-jenis" style="text-transform: capitalize;">-</span>
                  </div>
                  <div class="receipt-row">
                    <span>Area</span>
                    <span id="struk-area">-</span>
                  </div>
                  <div class="receipt-divider"></div>
                  <div class="receipt-row">
                    <span>Waktu Masuk</span>
                    <span id="struk-masuk">-</span>
                  </div>
                  <div class="receipt-row">
                    <span>Waktu Keluar</span>
                    <span id="struk-keluar">-</span>
                  </div>
                  <div class="receipt-row">
                    <span>Durasi Parkir</span>
                    <b id="struk-durasi">- Jam</b>
                  </div>
                  <div class="receipt-row">
                    <span>Tarif / Jam</span>
                    <span id="struk-tarif">-</span>
                  </div>
                  <div class="receipt-divider"></div>
                  <div class="receipt-row" style="font-size: 14px;">
                    <b>TOTAL BIAYA</b>
                    <b id="struk-total">-</b>
                  </div>
                  <div class="receipt-row">
                    <span>Tunai Diterima</span>
                    <span id="struk-bayar">-</span>
                  </div>
                  <div class="receipt-row">
                    <span>Kembalian</span>
                    <b id="struk-kembalian">-</b>
                  </div>
                  <div class="receipt-divider"></div>
                  <div class="receipt-row">
                    <span>Petugas Loket</span>
                    <span id="struk-petugas">-</span>
                  </div>
                </div>

                <div class="receipt-footer">
                  <div>*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</div>
                  <div style="font-size: 10px; margin-top: 4px;">Hati-hati di jalan & semoga selamat sampai tujuan!</div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="btn-close-struk">
                Tutup & Layani Berikutnya
              </button>
              <button type="button" class="btn btn-primary" id="btn-print-struk">
                🖨️ Cetak Struk (Print)
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  init(prefillSearch = '') {
    const searchInput = document.getElementById('keluar-search-input');
    const formCari = document.getElementById('form-cari-keluar');
    const btnCari = document.getElementById('btn-cari-keluar');
    const detailCard = document.getElementById('keluar-detail-card');
    const bayarInput = document.getElementById('keluar-bayar-input');
    const displayKembalian = document.getElementById('display-kembalian');
    const warningKurang = document.getElementById('warning-kurang');
    const btnProsesBayar = document.getElementById('btn-proses-bayar');

    // Auto uppercase search
    searchInput?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    if (prefillSearch) {
      searchInput.value = prefillSearch.toUpperCase();
      this.doCekKeluar(prefillSearch);
    }

    // Handle submit form cari
    formCari?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (!val) {
        store.showToast('Masukkan nomor plat atau kode karcis!', 'warning');
        return;
      }
      await this.doCekKeluar(val);
    });

    // Real-time kalkulasi kembalian saat input uang diterima
    bayarInput?.addEventListener('input', () => {
      this.calculateChange();
    });

    // Preset Cash Buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.currentTrx) return;
        const total = parseFloat(this.currentTrx.total_biaya) || 0;
        const valAttr = btn.getAttribute('data-val');
        if (valAttr) {
          bayarInput.value = valAttr;
        } else if (btn.id === 'preset-pas') {
          bayarInput.value = total;
        }
        this.calculateChange();
      });
    });

    // Handle Bayar & Selesai
    btnProsesBayar?.addEventListener('click', async () => {
      if (!this.currentTrx) return;

      const total = parseFloat(this.currentTrx.total_biaya) || 0;
      const bayar = parseFloat(bayarInput.value) || 0;

      if (bayar < total) {
        store.showToast('Nominal pembayaran masih kurang dari total biaya!', 'warning');
        return;
      }

      btnProsesBayar.disabled = true;
      btnProsesBayar.innerHTML = 'Memproses Transaksi... ⏳';

      try {
        const res = await api.bayarParkirKeluar(this.currentTrx.id_parkir, bayar);
        const struk = res.data.struk_keluar;

        store.showToast('✅ Pembayaran berhasil dicatat!', 'success');

        // Isi modal struk
        document.getElementById('struk-kode').innerText = struk.kode_karcis;
        document.getElementById('struk-plat').innerText = struk.plat_nomor;
        document.getElementById('struk-jenis').innerText = struk.jenis_kendaraan;
        document.getElementById('struk-area').innerText = struk.nama_area || '-';
        document.getElementById('struk-masuk').innerText = store.formatDateTime(struk.waktu_masuk);
        document.getElementById('struk-keluar').innerText = store.formatDateTime(struk.waktu_keluar);
        document.getElementById('struk-durasi').innerText = `${struk.durasi_jam} Jam`;
        document.getElementById('struk-tarif').innerText = `${store.formatRupiah(struk.tarif_per_jam)} / Jam`;
        document.getElementById('struk-total').innerText = store.formatRupiah(struk.biaya_total);
        document.getElementById('struk-bayar').innerText = store.formatRupiah(struk.jumlah_bayar);
        document.getElementById('struk-kembalian').innerText = store.formatRupiah(struk.kembalian);
        document.getElementById('struk-petugas').innerText = struk.petugas || 'Petugas Loket';

        // Tampilkan modal struk
        store.openModal('modal-struk-keluar');

        // Sembunyikan detail card dan reset form
        detailCard.style.display = 'none';
        searchInput.value = '';
        this.currentTrx = null;

      } catch (err) {
        store.showToast(err.message, 'error');
      } finally {
        btnProsesBayar.disabled = false;
        btnProsesBayar.innerHTML = '✅ Selesaikan Pembayaran & Cetak Struk Keluar';
      }
    });

    // Close Struk Modal
    document.getElementById('btn-close-struk-x')?.addEventListener('click', () => {
      store.closeModal('modal-struk-keluar');
      searchInput.focus();
    });
    document.getElementById('btn-close-struk')?.addEventListener('click', () => {
      store.closeModal('modal-struk-keluar');
      searchInput.focus();
    });

    // Print Struk
    document.getElementById('btn-print-struk')?.addEventListener('click', () => {
      store.printThermalReceipt();
    });
  },

  async doCekKeluar(searchQuery) {
    const btnCari = document.getElementById('btn-cari-keluar');
    const detailCard = document.getElementById('keluar-detail-card');
    const bayarInput = document.getElementById('keluar-bayar-input');

    btnCari.disabled = true;
    btnCari.innerText = 'Mencari... ⏳';

    try {
      const res = await api.cekParkirKeluar(searchQuery);
      const data = res.data;
      this.currentTrx = data;

      // Populate Detail View
      document.getElementById('res-plat').innerText = data.plat_nomor;
      document.getElementById('res-jenis').innerText = `Jenis: ${data.jenis_kendaraan} (${data.warna || '-'}, ${data.pemilik || 'Umum'})`;
      document.getElementById('res-kode').innerText = data.kode_karcis;
      document.getElementById('res-area').innerText = `Lokasi: ${data.nama_area}`;
      document.getElementById('res-waktu-masuk').innerText = store.formatDateTime(data.waktu_masuk);
      document.getElementById('res-waktu-keluar').innerText = store.formatDateTime(data.waktu_keluar_estimasi);
      document.getElementById('res-durasi-jam').innerText = `${data.durasi_jam} Jam`;
      document.getElementById('res-tarif-jam').innerText = `${store.formatRupiah(data.tarif_per_jam)} / Jam`;
      document.getElementById('res-total-biaya').innerText = store.formatRupiah(data.total_biaya);

      // Default bayar input kosong
      bayarInput.value = '';
      this.calculateChange();

      // Show detail card
      detailCard.style.display = 'block';
      detailCard.scrollIntoView({ behavior: 'smooth' });
      bayarInput.focus();

      store.showToast('Data kendaraan ditemukan!', 'success');
    } catch (err) {
      this.currentTrx = null;
      detailCard.style.display = 'none';
      store.showToast(err.message, 'error');
    } finally {
      btnCari.disabled = false;
      btnCari.innerText = 'Periksa Kendaraan 🔎';
    }
  },

  calculateChange() {
    const bayarInput = document.getElementById('keluar-bayar-input');
    const displayKembalian = document.getElementById('display-kembalian');
    const warningKurang = document.getElementById('warning-kurang');
    const btnProsesBayar = document.getElementById('btn-proses-bayar');

    if (!this.currentTrx) return;

    const total = parseFloat(this.currentTrx.total_biaya) || 0;
    const bayar = parseFloat(bayarInput.value) || 0;
    const diff = bayar - total;

    if (bayar <= 0) {
      displayKembalian.innerText = 'Rp 0';
      displayKembalian.style.color = '#10b981';
      warningKurang.style.display = 'none';
      btnProsesBayar.disabled = true;
      return;
    }

    if (diff < 0) {
      displayKembalian.innerText = `- ${store.formatRupiah(Math.abs(diff))}`;
      displayKembalian.style.color = '#ef4444';
      warningKurang.style.display = 'block';
      warningKurang.innerText = `⚠️ Uang kurang sebesar ${store.formatRupiah(Math.abs(diff))}!`;
      btnProsesBayar.disabled = true;
    } else {
      displayKembalian.innerText = store.formatRupiah(diff);
      displayKembalian.style.color = '#10b981';
      warningKurang.style.display = 'none';
      btnProsesBayar.disabled = false;
    }
  }
};

