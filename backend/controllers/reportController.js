const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * 1. REKAP TRANSAKSI SESUAI WAKTU YANG DIMINTA (Owner)
 * GET /api/reports/transaksi?startDate=&endDate=&jenis=&id_area=&status=&page=1&limit=20
 */
const getRekapTransaksi = async (req, res) => {
  try {
    const { 
      startDate = '', 
      endDate = '', 
      jenis = '', 
      id_area = '', 
      status = '',
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = ' WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND DATE(t.waktu_masuk) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(t.waktu_masuk) <= ?';
      params.push(endDate);
    }

    if (jenis) {
      whereClause += ' AND k.jenis_kendaraan = ?';
      params.push(jenis);
    }

    if (id_area) {
      whereClause += ' AND t.id_area = ?';
      params.push(id_area);
    }

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    // 1. Ambil Summary Statistik
    const summaryQuery = `
      SELECT 
        COUNT(t.id_parkir) AS total_transaksi,
        SUM(CASE WHEN t.status = 'masuk' THEN 1 ELSE 0 END) AS total_aktif_masuk,
        SUM(CASE WHEN t.status = 'keluar' THEN 1 ELSE 0 END) AS total_sudah_keluar,
        COALESCE(SUM(t.biaya_total), 0) AS total_pendapatan,
        COALESCE(SUM(t.durasi_jam), 0) AS total_durasi_jam,
        COALESCE(AVG(CASE WHEN t.status = 'keluar' THEN t.durasi_jam END), 0) AS rata_rata_durasi_jam
      FROM tb_transaksi t
      JOIN tb_kendaraan k ON t.id_kendaraan = k.id_kendaraan
      ${whereClause}
    `;
    const [summaryRows] = await db.query(summaryQuery, params);
    const summary = summaryRows[0];

    // 2. Ambil List Data Transaksi
    const listQuery = `
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
      ${whereClause}
      ORDER BY t.id_parkir DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(listQuery, listParams);

    return sendSuccess(res, 'Rekap laporan transaksi berhasil diambil.', {
      filter: {
        startDate: startDate || 'Semua',
        endDate: endDate || 'Semua',
        jenis: jenis || 'Semua',
        id_area: id_area || 'Semua',
        status: status || 'Semua'
      },
      summary: {
        total_transaksi: parseInt(summary.total_transaksi, 10),
        total_aktif_masuk: parseInt(summary.total_aktif_masuk, 10),
        total_sudah_keluar: parseInt(summary.total_sudah_keluar, 10),
        total_pendapatan: parseFloat(summary.total_pendapatan),
        total_durasi_jam: parseInt(summary.total_durasi_jam, 10),
        rata_rata_durasi_jam: parseFloat(Number(summary.rata_rata_durasi_jam).toFixed(1))
      },
      transaksi: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: parseInt(summary.total_transaksi, 10),
        totalPages: Math.ceil(parseInt(summary.total_transaksi, 10) / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('[REKAP TRANSAKSI ERROR]', err);
    return sendError(res, 'Gagal mengambil rekap transaksi.', err);
  }
};

/**
 * 2. DASHBOARD OVERVIEW (Admin & Owner)
 * GET /api/reports/dashboard
 */
const getDashboardOverview = async (req, res) => {
  try {
    // 1. Statistik Hari Ini
    const [todayRows] = await db.query(`
      SELECT 
        COUNT(id_parkir) AS total_transaksi_hari_ini,
        SUM(CASE WHEN status = 'masuk' THEN 1 ELSE 0 END) AS kendaraan_masuk_hari_ini,
        SUM(CASE WHEN status = 'keluar' THEN 1 ELSE 0 END) AS kendaraan_keluar_hari_ini,
        COALESCE(SUM(biaya_total), 0) AS pendapatan_hari_ini
      FROM tb_transaksi
      WHERE DATE(waktu_masuk) = CURDATE()
    `);

    // 2. Total Keseluruhan
    const [allTimeRows] = await db.query(`
      SELECT 
        COUNT(id_parkir) AS total_transaksi_semua,
        COALESCE(SUM(biaya_total), 0) AS total_pendapatan_semua
      FROM tb_transaksi
    `);

    // 3. Status Kapasitas Area Parkir Saat Ini
    const [areaRows] = await db.query(`
      SELECT 
        id_area,
        nama_area,
        kapasitas,
        terisi,
        (kapasitas - terisi) AS sisa_slot,
        ROUND((terisi / kapasitas) * 100, 1) AS persentase_terisi
      FROM tb_area_parkir
      ORDER BY id_area ASC
    `);

    // 4. Total User dan Kendaraan Terdaftar
    const [userCount] = await db.query('SELECT COUNT(*) AS total_user FROM tb_user');
    const [kendaraanCount] = await db.query('SELECT COUNT(*) AS total_kendaraan FROM tb_kendaraan');

    return sendSuccess(res, 'Data dashboard berhasil diambil.', {
      hari_ini: {
        total_transaksi: parseInt(todayRows[0].total_transaksi_hari_ini, 10),
        kendaraan_masuk: parseInt(todayRows[0].kendaraan_masuk_hari_ini, 10),
        kendaraan_keluar: parseInt(todayRows[0].kendaraan_keluar_hari_ini, 10),
        pendapatan: parseFloat(todayRows[0].pendapatan_hari_ini)
      },
      keseluruhan: {
        total_transaksi: parseInt(allTimeRows[0].total_transaksi_semua, 10),
        total_pendapatan: parseFloat(allTimeRows[0].total_pendapatan_semua),
        total_user: parseInt(userCount[0].total_user, 10),
        total_kendaraan: parseInt(kendaraanCount[0].total_kendaraan, 10)
      },
      status_area: areaRows
    });
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    return sendError(res, 'Gagal mengambil data dashboard.', err);
  }
};

module.exports = {
  getRekapTransaksi,
  getDashboardOverview
};
