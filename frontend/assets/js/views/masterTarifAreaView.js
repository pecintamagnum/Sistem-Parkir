import { api } from '../api.js';
import { store } from '../store.js';

export const masterTarifAreaView = {
  editingTarifId: null,
  editingAreaId: null,

  render() {
    return `
      <div class="page-container">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: 800;">⚙️ Manajemen Tarif & Area Parkir (Admin)</h2>
          <p style="font-size: 13px; color: #64748b;">
            Atur skema biaya parkir per jam serta kapasitas daya tampung masing-masing zona parkir.
          </p>
        </div>

        <div class="grid grid-cols-2">
          
          <!-- SEKSI 1: MASTER TARIF PARKIR -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">💵 Skema Tarif Parkir (Per Jam)</div>
                <div class="card-desc">Biaya parkir kendaraan berdasarkan jenisnya</div>
              </div>
              <button type="button" id="btn-tambah-tarif" class="btn btn-sm btn-primary">
                ➕ Tambah Tarif
              </button>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Jenis Kendaraan</th>
                    <th>Tarif / Jam</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="tarif-tbody">
                  <tr>
                    <td colspan="3" style="text-align: center; color: #64748b; padding: 20px;">Memuat tarif...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SEKSI 2: MASTER AREA PARKIR -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">🅿️ Master Zona / Area Parkir</div>
                <div class="card-desc">Batas kapasitas maksimal & monitoring keterisian</div>
              </div>
              <button type="button" id="btn-tambah-area" class="btn btn-sm btn-primary">
                ➕ Tambah Area
              </button>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nama Area</th>
                    <th>Kapasitas</th>
                    <th>Terisi</th>
                    <th>Sisa</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="area-tbody">
                  <tr>
                    <td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Memuat area...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- MODAL FORM TARIF -->
        <div id="modal-tarif" class="modal-overlay">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title" id="modal-tarif-title">💵 Pengaturan Tarif</div>
              <button class="btn-close-modal" id="btn-close-tarif-x">&times;</button>
            </div>
            <form id="form-tarif">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" for="tarif-jenis">Jenis Kendaraan <span class="required">*</span></label>
                  <select id="tarif-jenis" class="form-control" required>
                    <option value="motor">Sepeda Motor</option>
                    <option value="mobil">Mobil Pribadi</option>
                    <option value="lainnya">Truk / Bus / Lainnya</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="tarif-nominal">Tarif Per Jam (Rp) <span class="required">*</span></label>
                  <input type="number" id="tarif-nominal" class="form-control" placeholder="Contoh: 3000" min="0" required>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-tarif">Batal</button>
                <button type="submit" id="btn-save-tarif" class="btn btn-primary">Simpan Tarif 💾</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL FORM AREA -->
        <div id="modal-area" class="modal-overlay">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title" id="modal-area-title">🅿️ Pengaturan Area Parkir</div>
              <button class="btn-close-modal" id="btn-close-area-x">&times;</button>
            </div>
            <form id="form-area">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" for="area-nama">Nama Area Parkir <span class="required">*</span></label>
                  <input type="text" id="area-nama" class="form-control" placeholder="Contoh: Area A (Motor Depan)" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="area-kapasitas">Kapasitas Maksimal (Slot Kendaraan) <span class="required">*</span></label>
                  <input type="number" id="area-kapasitas" class="form-control" placeholder="Contoh: 50" min="1" required>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-area">Batal</button>
                <button type="submit" id="btn-save-area" class="btn btn-primary">Simpan Area 💾</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  },

  async init() {
    await Promise.all([this.loadTarif(), this.loadArea()]);

    // Modal Tarif Handlers
    document.getElementById('btn-tambah-tarif')?.addEventListener('click', () => {
      this.editingTarifId = null;
      document.getElementById('modal-tarif-title').innerText = '➕ Tambah Tarif Parkir';
      document.getElementById('form-tarif').reset();
      document.getElementById('tarif-jenis').disabled = false;
      store.openModal('modal-tarif');
    });

    document.getElementById('btn-close-tarif-x')?.addEventListener('click', () => store.closeModal('modal-tarif'));
    document.getElementById('btn-cancel-tarif')?.addEventListener('click', () => store.closeModal('modal-tarif'));

    document.getElementById('form-tarif')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const jenis_kendaraan = document.getElementById('tarif-jenis').value;
      const tarif_per_jam = parseFloat(document.getElementById('tarif-nominal').value);

      try {
        if (this.editingTarifId) {
          await api.updateTarif(this.editingTarifId, { tarif_per_jam });
          store.showToast('Tarif berhasil diperbarui!', 'success');
        } else {
          await api.createTarif({ jenis_kendaraan, tarif_per_jam });
          store.showToast('Tarif baru berhasil ditambahkan!', 'success');
        }
        store.closeModal('modal-tarif');
        await this.loadTarif();
      } catch (err) {
        store.showToast(err.message, 'error');
      }
    });

    // Modal Area Handlers
    document.getElementById('btn-tambah-area')?.addEventListener('click', () => {
      this.editingAreaId = null;
      document.getElementById('modal-area-title').innerText = '➕ Tambah Area Parkir';
      document.getElementById('form-area').reset();
      store.openModal('modal-area');
    });

    document.getElementById('btn-close-area-x')?.addEventListener('click', () => store.closeModal('modal-area'));
    document.getElementById('btn-cancel-area')?.addEventListener('click', () => store.closeModal('modal-area'));

    document.getElementById('form-area')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama_area = document.getElementById('area-nama').value.trim();
      const kapasitas = parseInt(document.getElementById('area-kapasitas').value, 10);

      try {
        if (this.editingAreaId) {
          await api.updateArea(this.editingAreaId, { nama_area, kapasitas });
          store.showToast('Area parkir berhasil diperbarui!', 'success');
        } else {
          await api.createArea({ nama_area, kapasitas });
          store.showToast('Area parkir baru berhasil dibuat!', 'success');
        }
        store.closeModal('modal-area');
        await this.loadArea();
      } catch (err) {
        store.showToast(err.message, 'error');
      }
    });
  },

  async loadTarif() {
    const tbody = document.getElementById('tarif-tbody');
    try {
      const res = await api.getTarif();
      const list = res.data || [];
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #64748b;">Belum ada tarif disetting.</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(t => `
        <tr>
          <td style="font-weight: 600; text-transform: capitalize;">
            ${t.jenis_kendaraan === 'motor' ? '🏍️ Motor' : t.jenis_kendaraan === 'mobil' ? '🚗 Mobil' : '🚚 ' + t.jenis_kendaraan}
          </td>
          <td style="font-weight: 700; color: #2563eb;">${store.formatRupiah(t.tarif_per_jam)} / jam</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-sm btn-outline btn-edit-tarif" data-id="${t.id_tarif}" data-jenis="${t.jenis_kendaraan}" data-rate="${t.tarif_per_jam}">
                ✏️ Edit
              </button>
              <button type="button" class="btn btn-sm btn-danger btn-del-tarif" data-id="${t.id_tarif}">
                🗑️ Hapus
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-edit-tarif').forEach(btn => {
        btn.addEventListener('click', () => {
          this.editingTarifId = parseInt(btn.getAttribute('data-id'), 10);
          document.getElementById('modal-tarif-title').innerText = '✏️ Edit Tarif Parkir';
          document.getElementById('tarif-jenis').value = btn.getAttribute('data-jenis');
          document.getElementById('tarif-jenis').disabled = true;
          document.getElementById('tarif-nominal').value = btn.getAttribute('data-rate');
          store.openModal('modal-tarif');
        });
      });

      document.querySelectorAll('.btn-del-tarif').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Yakin ingin menghapus tarif ini?')) {
            try {
              await api.deleteTarif(btn.getAttribute('data-id'));
              store.showToast('Tarif berhasil dihapus.', 'success');
              await this.loadTarif();
            } catch (e) {
              store.showToast(e.message, 'error');
            }
          }
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Gagal: ${err.message}</td></tr>`;
    }
  },

  async loadArea() {
    const tbody = document.getElementById('area-tbody');
    try {
      const res = await api.getArea();
      const list = res.data || [];
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">Belum ada area parkir.</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(a => {
        const sisa = a.sisa_slot !== undefined ? a.sisa_slot : (a.kapasitas - a.terisi);
        return `
          <tr>
            <td style="font-weight: 600;">${a.nama_area}</td>
            <td><b>${a.kapasitas}</b> Slot</td>
            <td>${a.terisi}</td>
            <td>
              <span class="badge ${sisa <= 0 ? 'badge-danger' : 'badge-success'}">
                ${sisa <= 0 ? 'PENUH' : sisa + ' Slot'}
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-sm btn-outline btn-edit-area" data-id="${a.id_area}" data-nama="${a.nama_area}" data-kapasitas="${a.kapasitas}">
                  ✏️ Edit
                </button>
                <button type="button" class="btn btn-sm btn-danger btn-del-area" data-id="${a.id_area}">
                  🗑️ Hapus
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      document.querySelectorAll('.btn-edit-area').forEach(btn => {
        btn.addEventListener('click', () => {
          this.editingAreaId = parseInt(btn.getAttribute('data-id'), 10);
          document.getElementById('modal-area-title').innerText = '✏️ Edit Area Parkir';
          document.getElementById('area-nama').value = btn.getAttribute('data-nama');
          document.getElementById('area-kapasitas').value = btn.getAttribute('data-kapasitas');
          store.openModal('modal-area');
        });
      });

      document.querySelectorAll('.btn-del-area').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Yakin ingin menghapus area parkir ini?')) {
            try {
              await api.deleteArea(btn.getAttribute('data-id'));
              store.showToast('Area parkir berhasil dihapus.', 'success');
              await this.loadArea();
            } catch (e) {
              store.showToast(e.message, 'error');
            }
          }
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">Gagal: ${err.message}</td></tr>`;
    }
  }
};

