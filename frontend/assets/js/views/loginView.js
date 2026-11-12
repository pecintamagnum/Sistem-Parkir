import { auth } from '../auth.js';
import { store } from '../store.js';

export const loginView = {
  render() {
    return `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px;">
        <div style="width: 100%; max-width: 440px; background: #ffffff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); overflow: hidden;">
          
          <!-- Header Card -->
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; backdrop-filter: blur(5px);">
              🚗
            </div>
            <h1 style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">SISTEM PARKIR</h1>
            <p style="font-size: 13px; opacity: 0.9; margin-top: 4px;">Gerbang Masuk & Keluar Operator Manual (UKK RPL Paket 2)</p>
          </div>

          <!-- Form Body -->
          <div style="padding: 28px 24px;">
            <form id="form-login">
              <div class="form-group">
                <label class="form-label" for="login-username">Username <span class="required">*</span></label>
                <input type="text" id="login-username" class="form-control" placeholder="Masukkan username" required autofocus autocomplete="username">
              </div>

              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" for="login-password">Password <span class="required">*</span></label>
                <input type="password" id="login-password" class="form-control" placeholder="Masukkan password" required autocomplete="current-password">
              </div>

              <button type="submit" id="btn-login-submit" class="btn btn-primary btn-block btn-lg">
                Masuk ke Sistem ➡️
              </button>
            </form>

            <!-- Quick Testing Role Switcher for UKK Examiner -->
            <div class="quick-role-bar">
              <button type="button" class="btn-role-quick" id="quick-petugas">
                👤 Petugas<br><span style="font-weight: normal; font-size: 10px;">(petugas)</span>
              </button>
              <button type="button" class="btn-role-quick" id="quick-admin">
                🛡️ Admin<br><span style="font-weight: normal; font-size: 10px;">(admin)</span>
              </button>
              <button type="button" class="btn-role-quick" id="quick-owner">
                👑 Owner<br><span style="font-weight: normal; font-size: 10px;">(owner)</span>
              </button>
            </div>
            <p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 12px;">
              💡 Klik salah satu tombol role di atas untuk otomatis mengisi akun default.
            </p>
          </div>

        </div>
      </div>
    `;
  },

  init() {
    const form = document.getElementById('form-login');
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-login-submit');

    // Quick fill buttons
    document.getElementById('quick-petugas')?.addEventListener('click', () => {
      userInput.value = 'petugas';
      passInput.value = 'petugas123';
      store.showToast('Akun Petugas terisi. Silakan klik Masuk.', 'info');
    });

    document.getElementById('quick-admin')?.addEventListener('click', () => {
      userInput.value = 'admin';
      passInput.value = 'admin123';
      store.showToast('Akun Admin terisi. Silakan klik Masuk.', 'info');
    });

    document.getElementById('quick-owner')?.addEventListener('click', () => {
      userInput.value = 'owner';
      passInput.value = 'owner123';
      store.showToast('Akun Owner terisi. Silakan klik Masuk.', 'info');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = userInput.value.trim();
      const password = passInput.value;

      if (!username || !password) {
        store.showToast('Username dan password wajib diisi!', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Memproses... ⏳';

      try {
        await auth.login(username, password);
        // Redirect ke dashboard
        window.location.hash = '#/dashboard';
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Masuk ke Sistem ➡️';
      }
    });
  }
};

