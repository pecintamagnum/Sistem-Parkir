import { api } from '../api.js';
import { store } from '../store.js';

export const parkirMasukView = {
  areas: [],
  tarifs: [],

  render() {
    return `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">🚪 Loket Gerbang Parkir Masuk (Petugas)</h2>
            <p style="font-size: 13px; color: #64748b;">
              Input plat nomor & data kendaraan masuk, periksa kapasitas area, lalu terbitkan karcis parkir.
            </p>
          </div>
          <a href="#/monitoring" class="btn btn-outline">
            📋 Lihat Kendaraan di Dalam
          </a>
        </div>

        <div class="grid grid-cols-3">
          
          <!-- Kolom Kiri: Form Input Transaksi Masuk -->
          <div style="grid-column: span 2;">
            <div class="card">
              <div class="card-header">
                <div class="card-title">📝 Formulir Pencatatan Kendaraan Masuk</div>
                <div class="card-desc">Semua data akan disimpan langsung ke sistem database</div>
              </div>

              <form id="form-parkir-masuk">
                
                <!-- Input Plat Nomor Besar -->
                <div class="form-group">
                  <label class="form-label" for="masuk-plat">
                    Nomor Polisi / Plat Kendaraan <span class="required">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="masuk-plat" 
                    class="form-control input-plate" 
                    placeholder="Contoh: B 1234 ABC" 
                    required 
                    autocomplete="off"
                    maxlength="15"
                  >
                  <div style="font-size: 11px; color: #64748b; margin-top: 4px; text-align: center;">
                    💡 Otomatis huruf kapital. Pastikan plat nomor sesuai dengan fisik kendaraan.
                  </div>
                </div>

                <!-- Pemilihan Jenis Kendaraan -->
                <div class="form-group">
                  <label class="form-label">
                    Pilih Jenis Kendaraan <span class="required">*</span>
                  </label>
                  <div class="vehicle-type-grid" id="masuk-jenis-grid">
                    <div class="vehicle-type-option selected" data-jenis="motor">
                      <div class="vehicle-type-icon">🏍️</div>
                      <div class="vehicle-type-title">Sepeda Motor</div>
                      <div class="vehicle-type-rate" id="rate-motor">Rp 2.000 / jam</div>
                    </div>
                    <div class="vehicle-type-option" data-jenis="mobil">
                      <div class="vehicle-type-icon">🚗</div>
                      <div class="vehicle-type-title">Mobil Pribadi</div>
                      <div class="vehicle-type-rate" id="rate-mobil">Rp 5.000 / jam</div>
                    </div>
                    <div class="vehicle-type-option" data-jenis="lainnya">
                      <div class="vehicle-type-icon">🚚</div>
                      <div class="vehicle-type-title">Truk / Lainnya</div>
                      <div class="vehicle-type-rate" id="rate-lainnya">Rp 10.000 / jam</div>
                    </div>
                  </div>
                  <input type="hidden" id="masuk-jenis" value="motor">
                </div>

                <!-- Pilihan Area Parkir -->
                <div class="form-group">
                  <label class="form-label" for="masuk-area">
                    Pilih Area Lokasi Parkir <span class="required">*</span>
                  </label>
                  <select id="masuk-area" class="form-control" required>
                    <option value="">-- Memuat daftar area parkir... --</option>
                  </select>
                </div>

                <!-- Warna & Pemilik (2 Kolom) -->
                <div class="grid grid-cols-2">
                  <div class="form-group">
                    <label class="form-label" for="masuk-warna">Warna Kendaraan</label>
                    <input type="text" id="masuk-warna" class="form-control" placeholder="Hitam, Putih, Merah, dll.">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="masuk-pemilik">Nama Pemilik / Pengendara</label>
                    <input type="text" id="masuk-pemilik" class="form-control" placeholder="Nama pengendara (opsional / Umum)">
                  </div>
                </div>

                <div style="margin-top: 24px; display: flex; gap: 12px;">
                  <button type="submit" id="btn-submit-masuk" class="btn btn-primary btn-lg" style="flex: 1;">
                    🎟️ Simpan & Cetak Karcis Masuk
                  </button>
                  <button type="reset" class="btn btn-outline" id="btn-reset-masuk">
                    🔄 Reset
                  </button>
                </div>

              </form>
            </div>
          </div>

          <!-- Kolom Kanan: Monitoring Ketersediaan Area Saat Ini -->
          <div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">🅿️ Status Slot Area</div>
                <div class="card-desc">Kapasitas live</div>
              </div>
              <div id="masuk-area-monitor" style="display: flex; flex-direction: column; gap: 12px;">
                <p style="color: #64748b; font-size: 13px;">Memuat status area...</p>
              </div>
            </div>

            <!-- Petunjuk Petugas -->
            <div class="card" style="background-color: #f8fafc;">
              <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">📌 Standar Operasional Petugas:</h4>
              <ul style="font-size: 12px; color: #475569; padding-left: 18px; line-height: 1.6;">
                <li>Sapa pengendara dengan ramah dan sopan.</li>
                <li>Periksa kesesuaian plat fisik dengan nomor yang diinput.</li>
                <li>Pastikan area parkir yang dipilih masih memiliki slot kosong.</li>
                <li>Cetak dan serahkan karcis parkir kepada pengendara.</li>
                <li>Ingatkan pengendara untuk menjaga keamanan karcis & helm.</li>
              </ul>
            </div>
          </div>

        </div>

        <!-- MODAL POPUP CETAK KARCIS MASUK -->
        <div id="modal-karcis-masuk" class="modal-overlay">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title">🎟️ Karcis Parkir Berhasil Diterbitkan</div>
              <button class="btn-close-modal" id="btn-close-karcis-x">&times;</button>
            </div>
            
            <div class="modal-body">
              <!-- Thermal Ticket Format -->
              <div class="thermal-receipt" id="thermal-karcis-ticket">
                <div class="receipt-header">
                  <div class="receipt-title">🅿️ KARCIS PARKIR MASUK</div>
                  <div class="receipt-subtitle">Sistem Informasi Parkir UKK RPL Paket 2</div>
                  <div class="receipt-subtitle" style="margin-top: 2px;">Jl. Pendidikan No. 1 - Kota Pelajar</div>
                </div>

                <div class="receipt-barcode" id="karcis-barcode-area">
                  <!-- Barcode SVG Rendered Here -->
                </div>

                <div class="receipt-body">
                  <div class="receipt-row">
                    <span>No. Karcis</span>
                    <b id="karcis-kode">-</b>
                  </div>
                  <div class="receipt-row">
                    <span>No. Plat Polisi</span>
                    <b id="karcis-plat" style="font-size: 15px;">-</b>
                  </div>
                  <div class="receipt-row">
                    <span>Jenis Kendaraan</span>
                    <span id="karcis-jenis" style="text-transform: capitalize;">-</span>
                  </div>
                  <div class="receipt-row">
                    <span>Area Parkir</span>
                    <span id="karcis-area">-</span>
                  </div>
                  <div class="receipt-row">
                    <span>Waktu Masuk</span>
                    <span id="karcis-waktu">-</span>
                  </div>
                  <div class="receipt-divider"></div>
                  <div class="receipt-row">
                    <span>Tarif Parkir</span>
                    <b id="karcis-tarif">- / Jam</b>
                  </div>
                  <div class="receipt-row">
                    <span>Petugas Loket</span>
                    <span id="karcis-petugas">-</span>
                  </div>
                </div>

                <div class="receipt-footer">
                  <div>*** HARAP DISIMPAN BAIK-BAIK ***</div>
                  <div style="font-size: 10px; margin-top: 4px;">Karcis hilang wajib menunjukkan STNK & dikenakan denda sesuai regulasi.</div>
                  <div style="font-size: 10px; margin-top: 4px;">Terima Kasih Atas Kunjungan Anda</div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="btn-close-karcis">
                Tutup
              </button>
              <button type="button" class="btn btn-primary" id="btn-print-karcis">
                🖨️ Cetak Karcis (Print)
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  async init() {
    const platInput = document.getElementById('masuk-plat');
    const jenisInput = document.getElementById('masuk-jenis');
    const jenisOptions = document.querySelectorAll('.vehicle-type-option');
    const areaSelect = document.getElementById('masuk-area');
    const form = document.getElementById('form-parkir-masuk');
    const submitBtn = document.getElementById('btn-submit-masuk');

    // Auto uppercase plat nomor & hilangkan karakter aneh
    platInput?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    // Pilihan Jenis Kendaraan Card Selector
    jenisOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        jenisOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const selectedJenis = opt.getAttribute('data-jenis');
        jenisInput.value = selectedJenis;
      });
    });

    // Load Area & Tarif Data
    await this.loadAreasAndRates();

    // Modal close listeners
    document.getElementById('btn-close-karcis-x')?.addEventListener('click', () => {
      store.closeModal('modal-karcis-masuk');
      platInput.focus();
    });
    document.getElementById('btn-close-karcis')?.addEventListener('click', () => {
      store.closeModal('modal-karcis-masuk');
      platInput.focus();
    });

    // Print Karcis Button
    document.getElementById('btn-print-karcis')?.addEventListener('click', () => {
      store.printThermalReceipt();
    });

    // Handle Submit Form Parkir Masuk
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const plat_nomor = platInput.value.trim().toUpperCase();
      const jenis_kendaraan = jenisInput.value;
      const id_area = areaSelect.value;
      const warna = document.getElementById('masuk-warna').value.trim() || '-';
      const pemilik = document.getElementById('masuk-pemilik').value.trim() || 'Umum';

      if (!plat_nomor || !id_area) {
        store.showToast('Plat nomor dan area parkir wajib diisi!', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Memproses Karcis... ⏳';

      try {
        const payload = {
          plat_nomor,
          jenis_kendaraan,
          warna,
          pemilik,
          id_area: parseInt(id_area, 10)
        };

        const res = await api.parkirMasuk(payload);
        const data = res.data;
        const karcis = data.karcis_masuk || data.transaksi;

        store.showToast('✅ Kendaraan berhasil dicatat masuk!', 'success');

        // Isi data modal karcis
        document.getElementById('karcis-kode').innerText = karcis.kode_karcis;
        document.getElementById('karcis-plat').innerText = karcis.plat_nomor;
        document.getElementById('karcis-jenis').innerText = karcis.jenis_kendaraan;
        document.getElementById('karcis-area').innerText = karcis.nama_area;
        document.getElementById('karcis-waktu').innerText = store.formatDateTime(karcis.waktu_masuk);
        document.getElementById('karcis-tarif').innerText = store.formatRupiah(karcis.tarif_per_jam) + ' / Jam';
        document.getElementById('karcis-petugas').innerText = karcis.petugas || 'Petugas Loket';

        // Render Barcode
        document.getElementById('karcis-barcode-area').innerHTML = store.generateBarcodeSvg(karcis.kode_karcis);

        // Buka Modal Cetak Karcis
        store.openModal('modal-karcis-masuk');

        // Reset form untuk input selanjutnya
        form.reset();
        jenisInput.value = 'motor';
        jenisOptions.forEach(o => o.classList.remove('selected'));
        document.querySelector('.vehicle-type-option[data-jenis="motor"]')?.classList.add('selected');

        // Refresh live area capacity
        await this.loadAreasAndRates();

      } catch (err) {
        store.showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🎟️ Simpan & Cetak Karcis Masuk';
      }
    });
  },

  async loadAreasAndRates() {
    try {
      const [resArea, resTarif] = await Promise.all([
        api.getArea(),
        api.getTarif()
      ]);

      this.areas = resArea.data || [];
      this.tarifs = resTarif.data || [];

      // Update Tarif Label
      this.tarifs.forEach(t => {
        const rateEl = document.getElementById(`rate-${t.jenis_kendaraan}`);
        if (rateEl) {
          rateEl.innerText = `${store.formatRupiah(t.tarif_per_jam)} / jam`;
        }
      });

      // Update Area Select
      const areaSelect = document.getElementById('masuk-area');
      if (areaSelect) {
        if (this.areas.length === 0) {
          areaSelect.innerHTML = '<option value="">-- Tidak ada area parkir tersedia --</option>';
        } else {
          areaSelect.innerHTML = '<option value="">-- Pilih Area Parkir --</option>' + 
            this.areas.map(a => {
              const sisa = a.sisa_slot !== undefined ? a.sisa_slot : (a.kapasitas - a.terisi);
              const isFull = sisa <= 0;
              return `<option value="${a.id_area}" ${isFull ? 'disabled' : ''}>
                ${a.nama_area} - Sisa: ${sisa} / ${a.kapasitas} slot ${isFull ? '(PENUH)' : ''}
              </option>`;
            }).join('');
        }
      }

      // Update Area Monitor Widget
      const monitorEl = document.getElementById('masuk-area-monitor');
      if (monitorEl) {
        monitorEl.innerHTML = this.areas.map(a => {
          const persen = parseFloat(a.persentase_terisi) || Math.round((a.terisi / a.kapasitas) * 100);
          const sisa = a.sisa_slot !== undefined ? a.sisa_slot : (a.kapasitas - a.terisi);
          let colorClass = 'progress-green';
          if (persen >= 100) colorClass = 'progress-red';
          else if (persen >= 75) colorClass = 'progress-amber';

          return `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600;">
                <span>${a.nama_area}</span>
                <span style="color: ${sisa <= 0 ? '#ef4444' : '#10b981'}; font-weight: 700;">
                  ${sisa <= 0 ? 'PENUH' : sisa + ' Slot'}
                </span>
              </div>
              <div class="capacity-progress" style="margin: 6px 0 2px;">
                <div class="capacity-progress-bar ${colorClass}" style="width: ${Math.min(100, persen)}%;"></div>
              </div>
              <div style="font-size: 11px; color: #64748b; text-align: right;">${a.terisi} dari ${a.kapasitas} terisi</div>
            </div>
          `;
        }).join('');
      }

    } catch (err) {
      console.warn('[LOAD AREAS & RATES ERROR]', err);
    }
  }
};

