import { mockData } from './mockData.js';

export const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.isBackendOnline = false;
    this.forceMockMode = false;
  }

  // Cek apakah server backend aktif
  async checkBackendHealth() {
    if (this.forceMockMode) {
      this.isBackendOnline = false;
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/reports/dashboard`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      // Status 200 atau 401 (butuh token) berarti server aktif!
      this.isBackendOnline = (res.status === 200 || res.status === 401);
      return this.isBackendOnline;
    } catch (e) {
      this.isBackendOnline = false;
      return false;
    }
  }

  getHeaders() {
    const token = localStorage.getItem('parkir_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    // Jika backend offline atau force mock mode, gunakan simulasi mock
    if (!this.isBackendOnline || this.forceMockMode) {
      return this.handleMockRequest(endpoint, options);
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {})
        }
      };

      const res = await fetch(url, config);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      // Jika request gagal karena koneksi putus, fallback ke mock jika memungkinkan
      console.warn(`[API REQUEST ERROR pada ${endpoint}]:`, err.message);
      if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
        this.isBackendOnline = false;
        return this.handleMockRequest(endpoint, options);
      }
      throw err;
    }
  }

  // Handler Simulasi Mock untuk Pengujian Mandiri
  handleMockRequest(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};

    // 1. Auth Login
    if (endpoint === '/auth/login' && method === 'POST') {
      const user = mockData.users.find(u => u.username === body.username);
      if (user && body.password.includes('123')) {
        return Promise.resolve({
          success: true,
          message: 'Login berhasil (Mode Simulasi).',
          data: {
            token: 'mock-jwt-token-ukk-2026',
            user: { ...user }
          }
        });
      }
      return Promise.reject(new Error('Username atau password salah (admin123 / petugas123 / owner123).'));
    }

    // 2. Auth Me
    if (endpoint === '/auth/me') {
      const currentUser = JSON.parse(localStorage.getItem('parkir_user') || '{}');
      return Promise.resolve({
        success: true,
        message: 'Data user berhasil diambil.',
        data: { user: currentUser }
      });
    }

    // 3. Transaksi Parkir Masuk
    if (endpoint === '/transaksi/masuk' && method === 'POST') {
      const area = mockData.area.find(a => a.id_area === parseInt(body.id_area, 10)) || mockData.area[0];
      if (area.terisi >= area.kapasitas) {
        return Promise.reject(new Error(`Area ${area.nama_area} sudah PENUH!`));
      }
      area.terisi += 1;
      area.sisa_slot = area.kapasitas - area.terisi;
      area.persentase_terisi = Math.round((area.terisi / area.kapasitas) * 100);

      const tarifObj = mockData.tarif.find(t => t.jenis_kendaraan === body.jenis_kendaraan) || mockData.tarif[0];
      const kodeKarcis = `PKR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTrx = {
        id_parkir: mockData.transaksi.length + 1,
        kode_karcis: kodeKarcis,
        id_kendaraan: mockData.kendaraan.length + 1,
        plat_nomor: body.plat_nomor.toUpperCase(),
        jenis_kendaraan: body.jenis_kendaraan,
        warna: body.warna || '-',
        pemilik: body.pemilik || 'Umum',
        id_area: area.id_area,
        nama_area: area.nama_area,
        waktu_masuk: new Date().toISOString(),
        waktu_keluar: null,
        id_tarif: tarifObj.id_tarif,
        tarif_per_jam: tarifObj.tarif_per_jam,
        durasi_jam: null,
        biaya_total: null,
        status: 'masuk',
        nama_petugas: 'Petugas Loket'
      };

      mockData.transaksi.unshift(newTrx);
      return Promise.resolve({
        success: true,
        message: 'Parkir masuk berhasil dicatat. Silakan cetak karcis.',
        data: {
          transaksi: newTrx,
          karcis_masuk: {
            kode_karcis: newTrx.kode_karcis,
            plat_nomor: newTrx.plat_nomor,
            jenis_kendaraan: newTrx.jenis_kendaraan,
            waktu_masuk: newTrx.waktu_masuk,
            nama_area: newTrx.nama_area,
            tarif_per_jam: newTrx.tarif_per_jam,
            petugas: newTrx.nama_petugas
          }
        }
      });
    }

    // 4. Cek Parkir Keluar
    if (endpoint.startsWith('/transaksi/cek-keluar')) {
      const url = new URL(`http://localhost${endpoint}`);
      const search = (url.searchParams.get('search') || '').trim().toUpperCase();
      const trx = mockData.transaksi.find(t => (t.kode_karcis === search || t.plat_nomor === search) && t.status === 'masuk');
      if (!trx) {
        return Promise.reject(new Error(`Kendaraan '${search}' tidak ditemukan atau sudah keluar.`));
      }

      const durasiJam = Math.max(1, Math.ceil((Date.now() - new Date(trx.waktu_masuk).getTime()) / (3600 * 1000)));
      const tarifPerJam = parseFloat(trx.tarif_per_jam);
      const totalBiaya = durasiJam * tarifPerJam;

      return Promise.resolve({
        success: true,
        message: 'Kalkulasi parkir keluar berhasil.',
        data: {
          id_parkir: trx.id_parkir,
          kode_karcis: trx.kode_karcis,
          plat_nomor: trx.plat_nomor,
          jenis_kendaraan: trx.jenis_kendaraan,
          warna: trx.warna,
          pemilik: trx.pemilik,
          nama_area: trx.nama_area,
          waktu_masuk: trx.waktu_masuk,
          waktu_keluar_estimasi: new Date().toISOString(),
          durasi_jam: durasiJam,
          tarif_per_jam: tarifPerJam,
          total_biaya: totalBiaya
        }
      });
    }

    // 5. Bayar Parkir Keluar
    if (endpoint === '/transaksi/keluar' && method === 'POST') {
      const trx = mockData.transaksi.find(t => t.id_parkir === body.id_parkir);
      if (!trx) return Promise.reject(new Error('Transaksi tidak ditemukan.'));

      const durasiJam = Math.max(1, Math.ceil((Date.now() - new Date(trx.waktu_masuk).getTime()) / (3600 * 1000)));
      const tarifPerJam = parseFloat(trx.tarif_per_jam);
      const totalBiaya = durasiJam * tarifPerJam;

      if (body.jumlah_bayar < totalBiaya) {
        return Promise.reject(new Error(`Uang pembayaran kurang! Total biaya: Rp ${totalBiaya}, Dibayar: Rp ${body.jumlah_bayar}`));
      }

      trx.status = 'keluar';
      trx.waktu_keluar = new Date().toISOString();
      trx.durasi_jam = durasiJam;
      trx.biaya_total = totalBiaya;

      // Update area
      const area = mockData.area.find(a => a.id_area === trx.id_area);
      if (area) {
        area.terisi = Math.max(0, area.terisi - 1);
        area.sisa_slot = area.kapasitas - area.terisi;
        area.persentase_terisi = Math.round((area.terisi / area.kapasitas) * 100);
      }

      return Promise.resolve({
        success: true,
        message: 'Pembayaran berhasil. Kendaraan diizinkan keluar.',
        data: {
          struk_keluar: {
            kode_karcis: trx.kode_karcis,
            plat_nomor: trx.plat_nomor,
            jenis_kendaraan: trx.jenis_kendaraan,
            nama_area: trx.nama_area,
            waktu_masuk: trx.waktu_masuk,
            waktu_keluar: trx.waktu_keluar,
            durasi_jam: durasiJam,
            tarif_per_jam: tarifPerJam,
            biaya_total: totalBiaya,
            jumlah_bayar: body.jumlah_bayar,
            kembalian: body.jumlah_bayar - totalBiaya,
            petugas: trx.nama_petugas
          }
        }
      });
    }

    // 6. Transaksi Aktif
    if (endpoint.startsWith('/transaksi/aktif')) {
      const aktif = mockData.transaksi.filter(t => t.status === 'masuk');
      return Promise.resolve({
        success: true,
        message: 'Daftar transaksi aktif.',
        data: {
          transaksi: aktif,
          pagination: { page: 1, limit: 10, total: aktif.length, totalPages: 1 }
        }
      });
    }

    // 7. Dashboard Overview
    if (endpoint.startsWith('/reports/dashboard')) {
      const totalPendapatan = mockData.transaksi
        .filter(t => t.status === 'keluar')
        .reduce((sum, t) => sum + (parseFloat(t.biaya_total) || 0), 0);

      const aktifMasuk = mockData.transaksi.filter(t => t.status === 'masuk').length;
      const sudahKeluar = mockData.transaksi.filter(t => t.status === 'keluar').length;

      return Promise.resolve({
        success: true,
        message: 'Dashboard data.',
        data: {
          today: {
            total_transaksi_hari_ini: mockData.transaksi.length,
            kendaraan_masuk_hari_ini: aktifMasuk,
            kendaraan_keluar_hari_ini: sudahKeluar,
            pendapatan_hari_ini: totalPendapatan
          },
          all_time: {
            total_transaksi_semua: mockData.transaksi.length + 42,
            total_pendapatan_semua: totalPendapatan + 350000
          },
          area_kapasitas: mockData.area,
          transaksi_terbaru: mockData.transaksi.slice(0, 5)
        }
      });
    }

    // 8. Rekap Laporan Transaksi Owner
    if (endpoint.startsWith('/reports/transaksi')) {
      const totalPendapatan = mockData.transaksi
        .filter(t => t.status === 'keluar')
        .reduce((sum, t) => sum + (parseFloat(t.biaya_total) || 0), 0);

      return Promise.resolve({
        success: true,
        message: 'Rekap laporan transaksi.',
        data: {
          summary: {
            total_transaksi: mockData.transaksi.length,
            total_aktif_masuk: mockData.transaksi.filter(t => t.status === 'masuk').length,
            total_sudah_keluar: mockData.transaksi.filter(t => t.status === 'keluar').length,
            total_pendapatan: totalPendapatan,
            total_durasi_jam: 12,
            rata_rata_durasi_jam: 3.0
          },
          transaksi: mockData.transaksi,
          pagination: { page: 1, limit: 20, total: mockData.transaksi.length, totalPages: 1 }
        }
      });
    }

    // 9. Master Users
    if (endpoint.startsWith('/users')) {
      if (method === 'GET') {
        return Promise.resolve({
          success: true,
          message: 'Daftar user.',
          data: {
            users: mockData.users,
            pagination: { page: 1, limit: 10, total: mockData.users.length, totalPages: 1 }
          }
        });
      }
      if (method === 'POST') {
        const newUser = {
          id_user: mockData.users.length + 1,
          nama_lengkap: body.nama_lengkap,
          username: body.username,
          role: body.role,
          status_aktif: 1
        };
        mockData.users.push(newUser);
        return Promise.resolve({ success: true, message: 'User berhasil ditambahkan.', data: newUser });
      }
      if (method === 'PUT') {
        const id = parseInt(endpoint.split('/')[2], 10);
        const idx = mockData.users.findIndex(u => u.id_user === id);
        if (idx !== -1) {
          mockData.users[idx] = { ...mockData.users[idx], ...body };
          return Promise.resolve({ success: true, message: 'User berhasil diupdate.', data: mockData.users[idx] });
        }
      }
      if (method === 'DELETE') {
        const id = parseInt(endpoint.split('/')[2], 10);
        mockData.users = mockData.users.filter(u => u.id_user !== id);
        return Promise.resolve({ success: true, message: 'User berhasil dihapus.' });
      }
    }

    // 10. Master Tarif
    if (endpoint.startsWith('/tarif')) {
      if (method === 'GET') {
        return Promise.resolve({ success: true, message: 'Daftar tarif.', data: mockData.tarif });
      }
      if (method === 'POST') {
        const newTarif = { id_tarif: mockData.tarif.length + 1, ...body };
        mockData.tarif.push(newTarif);
        return Promise.resolve({ success: true, message: 'Tarif berhasil ditambahkan.', data: newTarif });
      }
      if (method === 'PUT') {
        const id = parseInt(endpoint.split('/')[2], 10);
        const item = mockData.tarif.find(t => t.id_tarif === id);
        if (item) item.tarif_per_jam = body.tarif_per_jam;
        return Promise.resolve({ success: true, message: 'Tarif berhasil diperbarui.', data: item });
      }
    }

    // 11. Master Area
    if (endpoint.startsWith('/area')) {
      if (method === 'GET') {
        return Promise.resolve({ success: true, message: 'Daftar area.', data: mockData.area });
      }
      if (method === 'POST') {
        const newArea = {
          id_area: mockData.area.length + 1,
          nama_area: body.nama_area,
          kapasitas: parseInt(body.kapasitas, 10),
          terisi: 0,
          sisa_slot: parseInt(body.kapasitas, 10),
          persentase_terisi: 0
        };
        mockData.area.push(newArea);
        return Promise.resolve({ success: true, message: 'Area berhasil dibuat.', data: newArea });
      }
      if (method === 'PUT') {
        const id = parseInt(endpoint.split('/')[2], 10);
        const area = mockData.area.find(a => a.id_area === id);
        if (area) {
          area.nama_area = body.nama_area;
          area.kapasitas = parseInt(body.kapasitas, 10);
          area.sisa_slot = area.kapasitas - area.terisi;
          area.persentase_terisi = Math.round((area.terisi / area.kapasitas) * 100);
        }
        return Promise.resolve({ success: true, message: 'Area berhasil diperbarui.', data: area });
      }
    }

    // 12. Master Kendaraan
    if (endpoint.startsWith('/kendaraan')) {
      return Promise.resolve({
        success: true,
        message: 'Daftar kendaraan.',
        data: {
          kendaraan: mockData.kendaraan,
          pagination: { page: 1, limit: 10, total: mockData.kendaraan.length, totalPages: 1 }
        }
      });
    }

    // 13. Logs
    if (endpoint.startsWith('/logs')) {
      return Promise.resolve({
        success: true,
        message: 'Log aktivitas.',
        data: {
          logs: mockData.logs,
          pagination: { page: 1, limit: 15, total: mockData.logs.length, totalPages: 1 }
        }
      });
    }

    return Promise.resolve({ success: true, message: 'OK' });
  }

  // --- SHORTCUT API CALLS ---
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  getProfile() {
    return this.request('/auth/me');
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  parkirMasuk(data) {
    return this.request('/transaksi/masuk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  cekParkirKeluar(search) {
    return this.request(`/transaksi/cek-keluar?search=${encodeURIComponent(search)}`);
  }

  bayarParkirKeluar(id_parkir, jumlah_bayar) {
    return this.request('/transaksi/keluar', {
      method: 'POST',
      body: JSON.stringify({ id_parkir, jumlah_bayar })
    });
  }

  getTransaksiAktif(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transaksi/aktif?${query}`);
  }

  getDetailTransaksi(id) {
    return this.request(`/transaksi/${id}`);
  }

  getDashboardOverview() {
    return this.request('/reports/dashboard');
  }

  getRekapTransaksi(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/transaksi?${query}`);
  }

  getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users?${query}`);
  }

  createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  getTarif() {
    return this.request('/tarif');
  }

  createTarif(data) {
    return this.request('/tarif', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTarif(id, data) {
    return this.request(`/tarif/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteTarif(id) {
    return this.request(`/tarif/${id}`, { method: 'DELETE' });
  }

  getArea() {
    return this.request('/area');
  }

  createArea(data) {
    return this.request('/area', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateArea(id, data) {
    return this.request(`/area/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteArea(id) {
    return this.request(`/area/${id}`, { method: 'DELETE' });
  }

  getKendaraan(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/kendaraan?${query}`);
  }

  getLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/logs?${query}`);
  }
}

export const api = new ApiService();

