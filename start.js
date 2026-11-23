/**
 * Runner Fullstack Sistem Parkir (UKK RPL Paket 2)
 * Menjalankan Backend (Port 5000) dan Frontend (Port 3000) sekaligus
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('===========================================================');
console.log('🚗 MENJALANKAN SISTEM INFORMASI PARKIR (FULLSTACK)');
console.log('===========================================================');

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

// 1. Jalankan Backend (Port 5000)
const backend = spawn('node', ['server.js'], {
  cwd: backendDir,
  env: { ...process.env },
  shell: true
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`[BACKEND] ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`[BACKEND ERROR] ${data}`);
});

// 2. Jalankan Frontend (Port 3000)
const frontend = spawn('node', ['serve.js'], {
  cwd: frontendDir,
  env: { ...process.env, PORT: '3000' },
  shell: true
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`[FRONTEND] ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[FRONTEND ERROR] ${data}`);
});

// Clean Exit
function cleanup() {
  console.log('\n[INFO] Menghentikan semua server...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
