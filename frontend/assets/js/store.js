// Store & Helper Utilities
export const store = {
  // Format mata uang Rupiah
  formatRupiah(val) {
    const num = Number(val) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  },

  // Format tanggal & waktu lokal Indonesia
  formatDateTime(isoDate) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Format tanggal saja (YYYY-MM-DD)
  formatDate(isoDate) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  },

  // Format jam saja (HH:MM)
  formatTime(isoDate) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Toast Notification System
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Modal Control
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  // Generate SVG Barcode Mockup
  generateBarcodeSvg(code = 'PKR-20261112-0001') {
    // Generate pseudo-random barcode bars based on char codes
    let barsHtml = '';
    let x = 10;
    const barHeight = 45;

    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const width = (charCode % 3) + 1.5;
      barsHtml += `<rect x="${x}" y="5" width="${width}" height="${barHeight}" fill="#000" />`;
      x += width + ((charCode % 2) + 1.2);
    }

    return `
      <svg class="barcode-svg" viewBox="0 0 ${x + 10} 60" xmlns="http://www.w3.org/2000/svg">
        ${barsHtml}
        <text x="${(x + 10) / 2}" y="58" font-family="monospace" font-size="10" text-anchor="middle" fill="#000">${code}</text>
      </svg>
    `;
  },

  // Trigger Print Karcis / Struk
  printThermalReceipt() {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 500);
  },

  // Trigger Print Laporan Resmi Owner
  printOfficialReport() {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 500);
  }
};

