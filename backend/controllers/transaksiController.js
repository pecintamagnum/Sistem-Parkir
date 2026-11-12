const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logAktivitas } = require('../utils/loggerHelper');

/**
 * Generate Kode Karcis Unik
 * Format: PKR-YYYYMMDD-XXXX (contoh: PKR-20261112-0042)
 */
function generateKodeKarcis() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PKR-${yyyy}${mm}${dd}-${randomNum}`;
}

/**
 * Hitung Durasi Parkir dalam Jam
 * Aturan: Pembulatan ke atas (CEIL). Minimal dihitung 1 jam.
 */
function hitungDurasiJam(waktuMasuk, waktuKeluar) {
  const masuk = new Date(waktuMasuk);
  const keluar = new Date(waktuKeluar);
  const diffMs = keluar - masuk;
  const diffMenit = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  const durasiJam = Math.ceil(diffMenit / 60);
  return durasiJam < 1 ? 1 : durasiJam;
}

/**
 * 1. PROSES PARKIR MASUK (Petugas Loket Masuk)
 * POST /api/transaksi/masuk
 * Body: { plat_nomor, jenis_kendaraan, warna, pemilik, id_area }
 */
const parkirMasuk = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { plat_nomor, jenis_kendaraan, warna = '-', pemilik = 'Umum', id_area } = req.body;

    if (!plat_nomor || !jenis_kendaraan || !id_area) {
      return sendError(res, 'Plat nomor, jenis kendaraan, dan area parkir wajib diisi.', null, 400);
    }

    const cleanPlat = plat_nomor.trim().toUpperCase();
    const cleanJenis = jenis_kendaraan.trim().toLowerCase();

    await conn.beginTransaction();

    // 1. Cek apakah kendaraan ini sudah berada di dalam area parkir (status 'masuk')
    const [activeCheck] = await conn.query(`
      SELECT t.id_parkir, t.kode_karcis, t.waktu_masuk, a.nama_area
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      JOIN tb_area_parkir a ON t.id_area = a.id_area
      WHERE k.plat_nomor = ? AND t.status = 'masuk'
    `, [cleanPlat]);

    if (activeCheck.length > 0) {
      await conn.rollback();
      return sendError(
        res,
        `Kendaraan dengan plat nomor '${cleanPlat}' saat ini sudah berada di dalam (${activeCheck[0].nama_area}, Karcis: ${activeCheck[0].kode_karcis}).`,
        null,
        400
      );
    }

    // 2. Cek kapasitas area parkir
    const [areaRows] = await conn.query(
      'SELECT id_area, nama_area, kapasitas, terisi FROM tb_area_parkir WHERE id_area = ? FOR UPDATE',
      [id_area]
    );

    if (areaRows.length === 0) {
      await conn.rollback();
      return sendError(res, 'Area parkir tidak ditemukan.', null, 404);
    }

    const area = areaRows[0];
    if (area.terisi >= area.kapasitas) {
      await conn.rollback();
      return sendError(res, `Area parkir '${area.nama_area}' sudah PENUH (${area.terisi}/${area.kapasitas}). Silakan pilih area lain.`, null, 400);
    }

    // 3. Ambil tarif berdasarkan jenis kendaraan
    const [tarifRows] = await conn.query(
      'SELECT id_tarif, tarif_per_jam FROM tb_tarif WHERE jenis_kendaraan = ?',
      [cleanJenis]
    );

    if (tarifRows.length === 0) {
      await conn.rollback();
      return sendError(res, `Tarif untuk jenis kendaraan '${cleanJenis}' belum disetting di sistem.`, null, 400);
    }

    const tarif = tarifRows[0];

    // 4. Cari atau buat kendaraan di tb_kendaraan
    let id_kendaraan;
    const [kendaraanRows] = await conn.query(
      'SELECT id_kendaraan FROM tb_kendaraan WHERE plat_nomor = ?',
      [cleanPlat]
    );

    if (kendaraanRows.length > 0) {
      id_kendaraan = kendaraanRows[0].id_kendaraan;
      // Perbarui jenis dan warna jika ada perubahan
      await conn.query(
        'UPDATE tb_kendaraan SET jenis_kendaraan = ?, warna = ?, pemilik = ? WHERE id_kendaraan = ?',
        [cleanJenis, warna.trim(), pemilik.trim(), id_kendaraan]
      );
    } else {
      const [insertKendaraan] = await conn.query(
        'INSERT INTO tb_kendaraan (plat_nomor, jenis_kendaraan, warna, pemilik, id_user) VALUES (?, ?, ?, ?, ?)',
        [cleanPlat, cleanJenis, warna.trim(), pemilik.trim(), req.user.id_user]
      );
      id_kendaraan = insertKendaraan.insertId;
    }

    // 5. Generate Kode Karcis unik
    let kodeKarcis = generateKodeKarcis();
    let isUnique = false;
    while (!isUnique) {
      const [checkKode] = await conn.query('SELECT id_parkir FROM tb_transaksi WHERE kode_karcis = ?', [kodeKarcis]);
      if (checkKode.length === 0) {
        isUnique = true;
      } else {
        kodeKarcis = generateKodeKarcis();
      }
    }

    // 6. Insert Transaksi Masuk
    const [insertTransaksi] = await conn.query(`
      INSERT INTO tb_transaksi 
      (kode_karcis, id_kendaraan, waktu_masuk, id_tarif, status, id_user, id_area) 
      VALUES (?, ?, NOW(), ?, 'masuk', ?, ?)
    `, [kodeKarcis, id_kendaraan, tarif.id_tarif, req.user.id_user, id_area]);

    // 7. Update Kapasitas Area Parkir (terisi + 1)
    await conn.query(
      'UPDATE tb_area_parkir SET terisi = terisi + 1 WHERE id_area = ?',
      [id_area]
    );

    await conn.commit();

    // 8. Catat log aktivitas
    await logAktivitas(
      req.user.id_user,
      `Petugas mencatat parkir masuk: ${cleanPlat} (${cleanJenis}) - Karcis: ${kodeKarcis}`
    );

    // 9. Ambil detail transaksi lengkap untuk cetak karcis masuk
    const [detailRows] = await db.query(`
      SELECT 
        t.id_parkir,
        t.kode_karcis,
        t.waktu_masuk,
        t.status,
        k.plat_nomor,
        k.jenis_kendaraan,
        k.warna,
        k.pemilik,
        a.nama_area,
        tf.tarif_per_jam,
        u.nama_lengkap AS nama_petugas
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      JOIN tb_area_parkir a ON t.id_area = a.id_area
      JOIN tb_tarif tf ON t.id_tarif = tf.id_tarif
      JOIN tb_user u ON t.id_user = u.id_user
      WHERE t.id_parkir = ?
    `, [insertTransaksi.insertId]);

    return sendSuccess(res, 'Parkir masuk berhasil dicatat. Silakan cetak karcis.', {
      transaksi: detailRows[0],
      karcis_masuk: {
        kode_karcis: detailRows[0].kode_karcis,
        plat_nomor: detailRows[0].plat_nomor,
        jenis_kendaraan: detailRows[0].jenis_kendaraan,
        waktu_masuk: detailRows[0].waktu_masuk,
        nama_area: detailRows[0].nama_area,
        tarif_per_jam: detailRows[0].tarif_per_jam,
        petugas: detailRows[0].nama_petugas
      }
    }, 201);
  } catch (err) {
    await conn.rollback();
    console.error('[PARKIR MASUK ERROR]', err);
    return sendError(res, 'Gagal mencatat transaksi parkir masuk.', err);
  } finally {
    conn.release();
  }
};

/**
 * 2. CEK / PREVIEW PARKIR KELUAR (Kalkulasi Otomatis Biaya)
 * GET /api/transaksi/cek-keluar?search=...
 * Parameter 'search' bisa berupa kode_karcis atau plat_nomor
 */
const cekParkirKeluar = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return sendError(res, 'Masukkan nomor plat atau kode karcis.', null, 400);
    }

    const cleanSearch = search.trim();

    const [rows] = await db.query(`
      SELECT 
        t.id_parkir,
        t.kode_karcis,
        t.waktu_masuk,
        t.status,
        k.id_kendaraan,
        k.plat_nomor,
        k.jenis_kendaraan,
        k.warna,
        k.pemilik,
        a.id_area,
        a.nama_area,
        tf.id_tarif,
        tf.tarif_per_jam
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      JOIN tb_area_parkir a ON t.id_area = a.id_area
      JOIN tb_tarif tf ON t.id_tarif = tf.id_tarif
      WHERE (t.kode_karcis = ? OR k.plat_nomor = ?) AND t.status = 'masuk'
      ORDER BY t.id_parkir DESC
      LIMIT 1
    `, [cleanSearch, cleanSearch.toUpperCase()]);

    if (rows.length === 0) {
      return sendError(res, `Tidak ditemukan transaksi aktif untuk '${cleanSearch}'. Pastikan kendaraan sudah tercatat masuk.`, null, 404);
    }

    const transaksi = rows[0];
    const waktuKeluarEstimasi = new Date();
    const durasiJam = hitungDurasiJam(transaksi.waktu_masuk, waktuKeluarEstimasi);
    const tarifPerJam = parseFloat(transaksi.tarif_per_jam);
    const totalBiaya = durasiJam * tarifPerJam;

    return sendSuccess(res, 'Kalkulasi parkir keluar berhasil.', {
      id_parkir: transaksi.id_parkir,
      kode_karcis: transaksi.kode_karcis,
      plat_nomor: transaksi.plat_nomor,
      jenis_kendaraan: transaksi.jenis_kendaraan,
      warna: transaksi.warna,
      pemilik: transaksi.pemilik,
      nama_area: transaksi.nama_area,
      waktu_masuk: transaksi.waktu_masuk,
      waktu_keluar_estimasi: waktuKeluarEstimasi,
      durasi_jam: durasiJam,
      tarif_per_jam: tarifPerJam,
      total_biaya: totalBiaya
    });
  } catch (err) {
    console.error('[CEK PARKIR KELUAR ERROR]', err);
    return sendError(res, 'Gagal menghitung biaya parkir keluar.', err);
  }
};

/**
 * 3. PROSES BAYAR & PARKIR KELUAR (Petugas Loket Keluar)
 * POST /api/transaksi/keluar
 * Body: { id_parkir, jumlah_bayar }
 */
const bayarParkirKeluar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id_parkir, jumlah_bayar } = req.body;

    if (!id_parkir || jumlah_bayar === undefined) {
      return sendError(res, 'Field id_parkir dan jumlah_bayar wajib diisi.', null, 400);
    }

    await conn.beginTransaction();

    // 1. Ambil data transaksi aktif
    const [rows] = await conn.query(`
      SELECT 
        t.id_parkir,
        t.kode_karcis,
        t.waktu_masuk,
        t.status,
        t.id_area,
        k.plat_nomor,
        k.jenis_kendaraan,
        a.nama_area,
        tf.tarif_per_jam
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      JOIN tb_area_parkir a ON t.id_area = a.id_area
      JOIN tb_tarif tf ON t.id_tarif = tf.id_tarif
      WHERE t.id_parkir = ? FOR UPDATE
    `, [id_parkir]);

    if (rows.length === 0) {
      await conn.rollback();
      return sendError(res, 'Transaksi tidak ditemukan.', null, 404);
    }

    const trx = rows[0];

    if (trx.status === 'keluar') {
      await conn.rollback();
      return sendError(res, 'Transaksi ini sudah selesai (kendaraan sudah keluar).', null, 400);
    }

    // 2. Hitung durasi jam dan total biaya final
    const waktuKeluar = new Date();
    const durasiJam = hitungDurasiJam(trx.waktu_masuk, waktuKeluar);
    const tarifPerJam = parseFloat(trx.tarif_per_jam);
    const totalBiaya = durasiJam * tarifPerJam;
    const nominalBayar = parseFloat(jumlah_bayar);

    if (nominalBayar < totalBiaya) {
      await conn.rollback();
      return sendError(
        res,
        `Uang pembayaran kurang! Total biaya: Rp ${totalBiaya.toLocaleString('id-ID')}, Dibayar: Rp ${nominalBayar.toLocaleString('id-ID')}`,
        null,
        400
      );
    }

    const uangKembalian = nominalBayar - totalBiaya;

    // 3. Update status transaksi menjadi keluar
    await conn.query(`
      UPDATE tb_transaksi 
      SET 
        waktu_keluar = NOW(),
        durasi_jam = ?,
        biaya_total = ?,
        status = 'keluar'
      WHERE id_parkir = ?
    `, [durasiJam, totalBiaya, id_parkir]);

    // 4. Update kapasitas area parkir (terisi - 1)
    await conn.query(`
      UPDATE tb_area_parkir 
      SET terisi = GREATEST(0, terisi - 1) 
      WHERE id_area = ?
    `, [trx.id_area]);

    await conn.commit();

    // 5. Catat log aktivitas
    await logAktivitas(
      req.user.id_user,
      `Petugas memproses keluar: ${trx.plat_nomor} (Karcis: ${trx.kode_karcis}) - Total: Rp ${totalBiaya}`
    );

    // 6. Ambil detail struk final
    const [finalTrx] = await db.query(`
      SELECT 
        t.id_parkir,
        t.kode_karcis,
        t.waktu_masuk,
        t.waktu_keluar,
        t.durasi_jam,
        t.biaya_total,
        t.status,
        k.plat_nomor,
        k.jenis_kendaraan,
        a.nama_area,
        tf.tarif_per_jam,
        u.nama_lengkap AS nama_petugas
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      JOIN tb_area_parkir a ON t.id_area = a.id_area
      JOIN tb_tarif tf ON t.id_tarif = tf.id_tarif
      JOIN tb_user u ON t.id_user = u.id_user
      WHERE t.id_parkir = ?
    `, [id_parkir]);

    return sendSuccess(res, 'Pembayaran berhasil. Kendaraan diizinkan keluar.', {
      transaksi: finalTrx[0],
      struk_keluar: {
        kode_karcis: finalTrx[0].kode_karcis,
        plat_nomor: finalTrx[0].plat_nomor,
        jenis_kendaraan: finalTrx[0].jenis_kendaraan,
        nama_area: finalTrx[0].nama_area,
        waktu_masuk: finalTrx[0].waktu_masuk,
        waktu_keluar: finalTrx[0].waktu_keluar,
        durasi_jam: finalTrx[0].durasi_jam,
        tarif_per_jam: finalTrx[0].tarif_per_jam,
        biaya_total: finalTrx[0].biaya_total,
        jumlah_bayar: nominalBayar,
        kembalian: uangKembalian,
        petugas: req.user.nama_lengkap
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('[BAYAR PARKIR KELUAR ERROR]', err);
    return sendError(res, 'Gagal memproses pembayaran keluar.', err);
  } finally {
    conn.release();
  }
};

/**
 * 4. GET KENDARAAN AKTIF (Sedang Parkir / Status 'masuk')
 * GET /api/transaksi/aktif?search=&id_area=&page=1&limit=10
 */
const getActiveParkir = async (req, res) => {
  try {
    const { search = '', id_area = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = `
      SELECT 
        t.id_parkir,
        t.kode_karcis,
        t.waktu_masuk,
        t.status,
        k.plat_nomor,
        k.jenis_kendaraan,
        k.warna,
        k.pemilik,
        a.nama_area,
        tf.tarif_per_jam,
        u.nama_lengkap AS nama_petugas,
        TIMESTAMPDIFF(MINUTE, t.waktu_masuk, NOW()) AS lama_menit_berjalan
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      JOIN tb_area_parkir a ON t.id_area = a.id_area
      JOIN tb_tarif tf ON t.id_tarif = tf.id_tarif
      JOIN tb_user u ON t.id_user = u.id_user
      WHERE t.status = 'masuk'
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      WHERE t.status = 'masuk'
    `;

    const params = [];
    const countParams = [];

    if (search) {
      const pattern = `%${search}%`;
      query += ' AND (k.plat_nomor LIKE ? OR t.kode_karcis LIKE ?)';
      countQuery += ' AND (k.plat_nomor LIKE ? OR t.kode_karcis LIKE ?)';
      params.push(pattern, pattern);
      countParams.push(pattern, pattern);
    }

    if (id_area) {
      query += ' AND t.id_area = ?';
      countQuery += ' AND t.id_area = ?';
      params.push(id_area);
      countParams.push(id_area);
    }

    query += ' ORDER BY t.waktu_masuk DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await db.query(query, params);
    const [totalRows] = await db.query(countQuery, countParams);
    const total = totalRows[0].total;

    return sendSuccess(res, 'Daftar kendaraan sedang parkir berhasil diambil.', {
      transaksi_aktif: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    return sendError(res, 'Gagal mengambil data kendaraan aktif.', err);
  }
};

/**
 * 5. GET DETAIL TRANSAKSI / CETAK STRUK ULANG
 * GET /api/transaksi/:id
 */
const getDetailTransaksi = async (req, res) => {
  try {
    const { id } = req.params;
    const isCode = id.startsWith('PKR-');

    const [rows] = await db.query(`
      SELECT 
        t.id_parkir,
        t.kode_karcis,
        t.waktu_masuk,
        t.waktu_keluar,
        t.durasi_jam,
        t.biaya_total,
        t.status,
        k.plat_nomor,
        k.jenis_kendaraan,
        k.warna,
        k.pemilik,
        a.nama_area,
        tf.tarif_per_jam,
        u.nama_lengkap AS nama_petugas
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      JOIN tb_area_parkir a ON t.id_area = a.id_area
      JOIN tb_tarif tf ON t.id_tarif = tf.id_tarif
      JOIN tb_user u ON t.id_user = u.id_user
      WHERE ${isCode ? 't.kode_karcis = ?' : 't.id_parkir = ?'}
    `, [id]);

    if (rows.length === 0) {
      return sendError(res, 'Data transaksi tidak ditemukan.', null, 404);
    }

    return sendSuccess(res, 'Detail transaksi berhasil diambil.', rows[0]);
  } catch (err) {
    return sendError(res, 'Gagal mengambil detail transaksi.', err);
  }
};

module.exports = {
  parkirMasuk,
  cekParkirKeluar,
  bayarParkirKeluar,
  getActiveParkir,
  getDetailTransaksi
};
