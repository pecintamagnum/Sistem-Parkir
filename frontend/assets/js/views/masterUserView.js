import { api } from '../api.js';
import { store } from '../store.js';

export const masterUserView = {
  editingUserId: null,

  render() {
    return `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">👥 Manajemen Pengguna & Petugas (Admin)</h2>
            <p style="font-size: 13px; color: #64748b;">
              Kelola akun hak akses sistem untuk Petugas Loket, Administrator, dan Owner (Pimpinan).
            </p>
          </div>
          <button type="button" id="btn-tambah-user" class="btn btn-primary">
            ➕ Tambah Pengguna Baru
          </button>
        </div>

        <div class="card">
          <!-- Filter & Search Bar -->
          <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
              <input type="text" id="user-search" class="form-control" placeholder="Cari nama lengkap atau username...">
            </div>
            <div style="width: 180px;">
              <select id="user-role-filter" class="form-control">
                <option value="">Semua Role</option>
                <option value="admin">Administrator</option>
                <option value="petugas">Petugas Loket</option>
                <option value="owner">Owner / Pimpinan</option>
              </select>
            </div>
            <button type="button" id="btn-refresh-user" class="btn btn-outline">
              🔄 Refresh
            </button>
          </div>

          <!-- Tabel Users -->
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Lengkap</th>
                  <th>Username</th>
                  <th>Role Akses</th>
                  <th>Status Akun</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody id="user-tbody">
                <tr>
                  <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">Memuat data pengguna...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- MODAL FORM TAMBAH / EDIT USER -->
        <div id="modal-user" class="modal-overlay">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title" id="modal-user-title">➕ Tambah Pengguna Baru</div>
              <button class="btn-close-modal" id="btn-close-user-x">&times;</button>
            </div>
            <form id="form-user">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" for="user-nama">Nama Lengkap <span class="required">*</span></label>
                  <input type="text" id="user-nama" class="form-control" placeholder="Contoh: Ahmad Fauzi" required>
                </div>

                <div class="form-group">
                  <label class="form-label" for="user-uname">Username <span class="required">*</span></label>
                  <input type="text" id="user-uname" class="form-control" placeholder="Contoh: ahmad_petugas" required>
                </div>

                <div class="form-group">
                  <label class="form-label" for="user-pass">
                    Password <span class="required" id="pass-required-mark">*</span>
                  </label>
                  <input type="password" id="user-pass" class="form-control" placeholder="Masukkan password (min. 6 karakter)">
                  <div id="user-pass-help" style="font-size: 11px; color: #64748b; margin-top: 4px; display: none;">
                    💡 Kosongkan jika tidak ingin mengubah password saat edit.
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="user-role">Role Pengguna <span class="required">*</span></label>
                  <select id="user-role" class="form-control" required>
                    <option value="petugas">Petugas Loket (Pelayanan Gerbang)</option>
                    <option value="admin">Administrator (Master Data & Log)</option>
                    <option value="owner">Owner (Dashboard & Laporan)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="user-status">Status Akun</label>
                  <select id="user-status" class="form-control">
                    <option value="1">Aktif (Bisa Login)</option>
                    <option value="0">Nonaktif (Diblokir)</option>
                  </select>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-user">Batal</button>
                <button type="submit" id="btn-save-user" class="btn btn-primary">Simpan Data 💾</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  },

  async init() {
    const tbody = document.getElementById('user-tbody');
    const searchInput = document.getElementById('user-search');
    const roleFilter = document.getElementById('user-role-filter');
    const btnTambah = document.getElementById('btn-tambah-user');
    const form = document.getElementById('form-user');

    const loadUsers = async () => {
      const search = searchInput?.value.trim() || '';
      const role = roleFilter?.value || '';

      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Memuat data...</td></tr>';

      try {
        const res = await api.getUsers({ search, role, limit: 50 });
        const users = (res.data && res.data.users) ? res.data.users : [];

        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Tidak ada user ditemukan.</td></tr>';
          return;
        }

        tbody.innerHTML = users.map((u, idx) => {
          let roleBadge = '<span class="badge badge-info">Petugas Loket</span>';
          if (u.role === 'admin') roleBadge = '<span class="badge badge-warning">Administrator</span>';
          if (u.role === 'owner') roleBadge = '<span class="badge badge-neutral">Owner / Pimpinan</span>';

          const statusBadge = u.status_aktif == 1 
            ? '<span class="badge badge-success">Aktif</span>' 
            : '<span class="badge badge-danger">Nonaktif</span>';

          return `
            <tr>
              <td>${idx + 1}</td>
              <td style="font-weight: 600;">${u.nama_lengkap}</td>
              <td style="font-family: monospace;">${u.username}</td>
              <td>${roleBadge}</td>
              <td>${statusBadge}</td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn btn-sm btn-outline btn-edit-user" data-id="${u.id_user}" data-nama="${u.nama_lengkap}" data-uname="${u.username}" data-role="${u.role}" data-status="${u.status_aktif}">
                    ✏️ Edit
                  </button>
                  <button type="button" class="btn btn-sm btn-danger btn-delete-user" data-id="${u.id_user}" data-uname="${u.username}">
                    🗑️ Hapus
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

        // Attach edit listener
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
          btn.addEventListener('click', () => {
            this.editingUserId = parseInt(btn.getAttribute('data-id'), 10);
            document.getElementById('modal-user-title').innerText = '✏️ Edit Pengguna';
            document.getElementById('user-nama').value = btn.getAttribute('data-nama');
            document.getElementById('user-uname').value = btn.getAttribute('data-uname');
            document.getElementById('user-role').value = btn.getAttribute('data-role');
            document.getElementById('user-status').value = btn.getAttribute('data-status');
            document.getElementById('user-pass').value = '';
            document.getElementById('user-pass').required = false;
            document.getElementById('pass-required-mark').style.display = 'none';
            document.getElementById('user-pass-help').style.display = 'block';

            store.openModal('modal-user');
          });
        });

        // Attach delete listener
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const uname = btn.getAttribute('data-uname');
            if (confirm(`Apakah Anda yakin ingin menghapus user '${uname}'?`)) {
              try {
                await api.deleteUser(id);
                store.showToast(`User '${uname}' berhasil dihapus.`, 'success');
                await loadUsers();
              } catch (err) {
                store.showToast(err.message, 'error');
              }
            }
          });
        });

      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">Gagal: ${err.message}</td></tr>`;
      }
    };

    // Open Add Modal
    btnTambah?.addEventListener('click', () => {
      this.editingUserId = null;
      document.getElementById('modal-user-title').innerText = '➕ Tambah Pengguna Baru';
      form.reset();
      document.getElementById('user-pass').required = true;
      document.getElementById('pass-required-mark').style.display = 'inline';
      document.getElementById('user-pass-help').style.display = 'none';
      store.openModal('modal-user');
    });

    // Close Modal Listeners
    document.getElementById('btn-close-user-x')?.addEventListener('click', () => store.closeModal('modal-user'));
    document.getElementById('btn-cancel-user')?.addEventListener('click', () => store.closeModal('modal-user'));

    // Handle Form Submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama_lengkap = document.getElementById('user-nama').value.trim();
      const username = document.getElementById('user-uname').value.trim();
      const password = document.getElementById('user-pass').value;
      const role = document.getElementById('user-role').value;
      const status_aktif = parseInt(document.getElementById('user-status').value, 10);

      const saveBtn = document.getElementById('btn-save-user');
      saveBtn.disabled = true;

      try {
        if (this.editingUserId) {
          const payload = { nama_lengkap, username, role, status_aktif };
          if (password) payload.password = password;
          await api.updateUser(this.editingUserId, payload);
          store.showToast('Data user berhasil diperbarui!', 'success');
        } else {
          if (!password) {
            store.showToast('Password wajib diisi untuk pengguna baru!', 'warning');
            saveBtn.disabled = false;
            return;
          }
          await api.createUser({ nama_lengkap, username, password, role, status_aktif });
          store.showToast('User baru berhasil ditambahkan!', 'success');
        }

        store.closeModal('modal-user');
        await loadUsers();
      } catch (err) {
        store.showToast(err.message, 'error');
      } finally {
        saveBtn.disabled = false;
      }
    });

    searchInput?.addEventListener('input', () => loadUsers());
    roleFilter?.addEventListener('change', () => loadUsers());
    document.getElementById('btn-refresh-user')?.addEventListener('click', () => loadUsers());

    await loadUsers();
  }
};

