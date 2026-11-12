-- ========================================================
-- DATABASE SISTEM PARKIR (UKK RPL 2025/2026 - PAKET 2)
-- Sesuai Alur Manual Operator (Petugas Loket Masuk & Keluar)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `db_parkir` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_parkir`;

-- 1. Tabel Master User
CREATE TABLE IF NOT EXISTS `tb_user` (
  `id_user` INT(11) NOT NULL AUTO_INCREMENT,
  `nama_lengkap` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'petugas', 'owner') NOT NULL,
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Master Tarif Parkir
CREATE TABLE IF NOT EXISTS `tb_tarif` (
  `id_tarif` INT(11) NOT NULL AUTO_INCREMENT,
  `jenis_kendaraan` ENUM('motor', 'mobil', 'lainnya') NOT NULL,
  `tarif_per_jam` DECIMAL(10, 0) NOT NULL,
  PRIMARY KEY (`id_tarif`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Master Area Parkir
CREATE TABLE IF NOT EXISTS `tb_area_parkir` (
  `id_area` INT(11) NOT NULL AUTO_INCREMENT,
  `nama_area` VARCHAR(50) NOT NULL,
  `kapasitas` INT(5) NOT NULL,
  `terisi` INT(5) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_area`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Master Kendaraan
CREATE TABLE IF NOT EXISTS `tb_kendaraan` (
  `id_kendaraan` INT(11) NOT NULL AUTO_INCREMENT,
  `plat_nomor` VARCHAR(15) NOT NULL UNIQUE,
  `jenis_kendaraan` VARCHAR(20) NOT NULL,
  `warna` VARCHAR(20) NOT NULL,
  `pemilik` VARCHAR(100) NOT NULL,
  `id_user` INT(11) NULL,
  PRIMARY KEY (`id_kendaraan`),
  KEY `fk_kendaraan_user` (`id_user`),
  CONSTRAINT `fk_kendaraan_user` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Transaksi Parkir
CREATE TABLE IF NOT EXISTS `tb_transaksi` (
  `id_parkir` INT(11) NOT NULL AUTO_INCREMENT,
  `kode_karcis` VARCHAR(30) NOT NULL UNIQUE,
  `id_kendaraan` INT(11) NOT NULL,
  `waktu_masuk` DATETIME NOT NULL,
  `waktu_keluar` DATETIME NULL DEFAULT NULL,
  `id_tarif` INT(11) NOT NULL,
  `durasi_jam` INT(5) NULL DEFAULT NULL,
  `biaya_total` DECIMAL(10, 0) NULL DEFAULT NULL,
  `status` ENUM('masuk', 'keluar') NOT NULL DEFAULT 'masuk',
  `id_user` INT(11) NOT NULL,
  `id_area` INT(11) NOT NULL,
  PRIMARY KEY (`id_parkir`),
  KEY `fk_transaksi_kendaraan` (`id_kendaraan`),
  KEY `fk_transaksi_tarif` (`id_tarif`),
  KEY `fk_transaksi_user` (`id_user`),
  KEY `fk_transaksi_area` (`id_area`),
  CONSTRAINT `fk_transaksi_kendaraan` FOREIGN KEY (`id_kendaraan`) REFERENCES `tb_kendaraan` (`id_kendaraan`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaksi_tarif` FOREIGN KEY (`id_tarif`) REFERENCES `tb_tarif` (`id_tarif`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaksi_user` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaksi_area` FOREIGN KEY (`id_area`) REFERENCES `tb_area_parkir` (`id_area`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Log Aktivitas
CREATE TABLE IF NOT EXISTS `tb_log_aktivitas` (
  `id_log` INT(11) NOT NULL AUTO_INCREMENT,
  `id_user` INT(11) NOT NULL,
  `aktivitas` VARCHAR(100) NOT NULL,
  `waktu_aktivitas` DATETIME NOT NULL,
  PRIMARY KEY (`id_log`),
  KEY `fk_log_user` (`id_user`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`id_user`) REFERENCES `tb_user` (`id_user`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- SEED DATA (DATA AWAL)
-- ========================================================

-- Insert Default Users:
-- admin: admin123
-- petugas: petugas123
-- owner: owner123
INSERT INTO `tb_user` (`id_user`, `nama_lengkap`, `username`, `password`, `role`, `status_aktif`) VALUES
(1, 'Administrator Utama', 'admin', '$2b$10$J44A1XCN3ONI6GBiY8ncyesluMqHT0.QuFO3DjPcf.6QbexKEbrSy', 'admin', 1),
(2, 'Petugas Loket Gerbang', 'petugas', '$2b$10$dWDyyPhV8MGgAM/wgF/u4ucpdB.ZuwWkQ5spMbjq8jlAVEJrbxhdi', 'petugas', 1),
(3, 'Owner / Pimpinan', 'owner', '$2b$10$LqrPJBSHMurbwPoAlvSk1.MOXnb/FfWlQOXdyKNtv1pAQ/cfRtTQ2', 'owner', 1)
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Insert Master Tarif
INSERT INTO `tb_tarif` (`id_tarif`, `jenis_kendaraan`, `tarif_per_jam`) VALUES
(1, 'motor', 2000),
(2, 'mobil', 5000),
(3, 'lainnya', 8000)
ON DUPLICATE KEY UPDATE `jenis_kendaraan`=`jenis_kendaraan`;

-- Insert Master Area Parkir
INSERT INTO `tb_area_parkir` (`id_area`, `nama_area`, `kapasitas`, `terisi`) VALUES
(1, 'Area A (Motor)', 50, 0),
(2, 'Area B (Mobil Depan)', 30, 0),
(3, 'Area C (Mobil Belakang / Truk)', 15, 0)
ON DUPLICATE KEY UPDATE `nama_area`=`nama_area`;

-- Insert Sample Kendaraan
INSERT INTO `tb_kendaraan` (`id_kendaraan`, `plat_nomor`, `jenis_kendaraan`, `warna`, `pemilik`, `id_user`) VALUES
(1, 'B 1234 ABC', 'motor', 'Hitam', 'Budi Santoso', 2),
(2, 'B 5678 XYZ', 'mobil', 'Putih', 'Siti Rahma', 2)
ON DUPLICATE KEY UPDATE `plat_nomor`=`plat_nomor`;

-- Insert Sample Log
INSERT INTO `tb_log_aktivitas` (`id_log`, `id_user`, `aktivitas`, `waktu_aktivitas`) VALUES
(1, 1, 'Inisialisasi sistem database parkir', NOW())
ON DUPLICATE KEY UPDATE `id_log`=`id_log`;
