const db = require('../config/database');

/**
 * Mencatat aktivitas ke tb_log_aktivitas
 * @param {number} id_user - ID user yang melakukan aksi
 * @param {string} aktivitas - Deskripsi aktivitas (maks 100 karakter)
 */
async function logAktivitas(id_user, aktivitas) {
  try {
    if (!id_user || !aktivitas) return;
    const ringkasan = aktivitas.substring(0, 100);
    await db.query(
      'INSERT INTO tb_log_aktivitas (id_user, aktivitas, waktu_aktivitas) VALUES (?, ?, NOW())',
      [id_user, ringkasan]
    );
  } catch (err) {
    console.error('[LOGGER ERROR] Gagal mencatat log aktivitas:', err.message);
  }
}

module.exports = {
  logAktivitas
};
