document.addEventListener("DOMContentLoaded", () => {
  // Debug function
  function debugLog(message, ...args) {
    console.log(`[Certificate System] ${message}`, ...args);
  }

  // DOM Elements - Robust Selection
  const elements = {
    loginPage: document.getElementById("login-page"),
    dashboard: document.getElementById("dashboard"),
    errorMessage: document.getElementById("error-message"),
    userNim: document.getElementById("user-nim"),
    userKelas: document.getElementById("user-kelas"),
    sertifDisetujui: document.getElementById("sertif-disetujui"),
    sisaSertif: document.getElementById("sisa-sertif"),
    status: document.getElementById("status"),
    deadlineElement: document.getElementById("deadline"),
    welcomeMessage: document.getElementById("welcome-message"),
    whatsappIcon: document.getElementById("whatsapp-icon"),
    collectCertBtn: document.getElementById("collect-cert-btn"),
    certSubmissionForm: document.getElementById("cert-submission-form"),
    submissionError: document.getElementById("submission-error"),
    backBtn: document.getElementById("back-btn"),
    loginForm: document.getElementById("login-form"),
    loadingOverlay: document.getElementById("loading-overlay"),
    notification: document.getElementById('notification')
  };

  // Validate DOM elements
  Object.entries(elements).forEach(([key, value]) => {
    if (!value) {
      console.warn(`Element not found: ${key}`);
    }
  });

  // Additional notification elements
  const notificationMessage = elements.notification?.querySelector('.notification-message');
  const notificationClose = elements.notification?.querySelector('.notification-close');

  // State
  let currentUser = null;
  let userData = [];

  // Notification Functions
  function showNotification(message, type = 'success') {
    if (!notificationMessage || !elements.notification) return;

    notificationMessage.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.add('show');
    
    setTimeout(hideNotification, 5000);
  }

  function hideNotification() {
    elements.notification?.classList.remove('show');
  }

  notificationClose?.addEventListener('click', hideNotification);

  // Deadline Calculation
  function calculateDeadlineDays() {
    const today = new Date();
    const deadline = new Date(2025, 5, 14); // June 14, 2025
    
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const timeDifference = deadline.getTime() - today.getTime();
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  }

  // Setup Collect Certificate Button
  function setupCollectCertButton() {
    debugLog('Setting up Collect Certificate Button');

    if (!elements.collectCertBtn) {
      console.error('Collect Certificate Button not found!');
      return;
    }

    elements.collectCertBtn.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent any default button behavior
      
      debugLog('Collect Certificate Button Clicked');

      // Ensure a user is logged in
      if (!currentUser) {
        showNotification('Silakan login terlebih dahulu', 'error');
        return;
      }

      // Populate form with user data
      const formElements = {
        nim: document.getElementById("form-nim"),
        nama: document.getElementById("form-nama"),
        kelas: document.getElementById("form-kelas"),
        nimDisplay: document.getElementById("form-nim-display"),
        namaDisplay: document.getElementById("form-nama-display"),
        kelasDisplay: document.getElementById("form-kelas-display")
      };

      // Validate form elements
      const missingElements = Object.entries(formElements)
        .filter(([, element]) => !element)
        .map(([key]) => key);

      if (missingElements.length > 0) {
        console.error(`Missing form elements: ${missingElements.join(', ')}`);
        showNotification('Terjadi kesalahan dalam form', 'error');
        return;
      }

      // Populate form
      formElements.nim.value = currentUser.nim;
      formElements.nama.value = currentUser.nama;
      formElements.kelas.value = currentUser.kelas;
      
      formElements.nimDisplay.textContent = currentUser.nim;
      formElements.namaDisplay.textContent = currentUser.nama;
      formElements.kelasDisplay.textContent = currentUser.kelas;

      // Toggle visibility
      if (elements.dashboard && elements.certSubmissionForm) {
        elements.dashboard.classList.add("hidden");
        elements.certSubmissionForm.classList.remove("hidden");
        debugLog('Switched to Certificate Submission Form');
      } else {
        console.error('Dashboard or Submission Form elements missing');
      }
    });

    debugLog('Collect Certificate Button Setup Complete');
  }

  // Load User Data
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?tqx=out:json';

  fetch(sheetUrl)
    .then((response) => response.text())
    .then((data) => {
      try {
        const jsonStart = data.indexOf('({') + 1;
        const jsonEnd = data.lastIndexOf('})') + 1;
        const jsonData = JSON.parse(data.substring(jsonStart, jsonEnd));
        
        userData = jsonData.table.rows.map(row => ({
          nim: row.c[0] ? parseFloat(row.c[0].v) : null,
          nama: row.c[1] ? row.c[1].v : null,
          kelas: row.c[2] ? row.c[2].v : null,
          sertif_disetujui: row.c[3] ? parseInt(row.c[3].v) : 0,
          deadline: new Date(2025, 5, 14)
        }));

        // Setup button after data is loaded
        setupCollectCertButton();
      } catch (error) {
        console.error("Error parsing data:", error);
        showNotification("Gagal memuat data. Refresh halaman.", "error");
      }
    })
    .catch((error) => {
      console.error("Error loading data:", error);
      showNotification("Gagal terhubung ke server.", "error");
    });

  // Update Dashboard
  function updateDashboard(user) {
    if (!user) return;

    elements.userNim.textContent = user.nim;
    elements.userKelas.textContent = user.kelas;
    elements.sertifDisetujui.textContent = user.sertif_disetujui;
    
    const remaining = 10 - user.sertif_disetujui;
    elements.sisaSertif.textContent = remaining;
    elements.welcomeMessage.textContent = `Selamat datang, ${user.nama}!`;

    const daysRemaining = calculateDeadlineDays();
    if (daysRemaining > 0) {
      elements.deadlineElement.textContent = `Tersisa ${daysRemaining} hari lagi untuk pengumpulan!`;
    } else if (daysRemaining === 0) {
      elements.deadlineElement.textContent = "Hari ini adalah deadline pengumpulan!";
    } else {
      elements.deadlineElement.textContent = "Deadline telah terlewati!";
    }

    if (remaining === 0) {
      elements.status.textContent = "Semua sertifikat telah dikumpulkan!";
      elements.status.className = "status-green";
    } else if (remaining <= 5) {
      elements.status.textContent = "Hampir selesai! Tetap semangat!";
      elements.status.className = "status-orange";
    } else {
      elements.status.textContent = "Masih banyak sertifikat yang harus dikumpulkan!";
      elements.status.className = "status-red";
    }
  }

  // Login Handler
  elements.loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const nimInput = document.getElementById("nim");
    const passwordInput = document.getElementById("password");

    if (!nimInput || !passwordInput) {
      showNotification("Terjadi kesalahan pada form login", "error");
      return;
    }

    const nim = nimInput.value;
    const password = passwordInput.value;

    const user = userData.find((u) => u.nim === parseFloat(nim));

    if (user && password === `${nim}${user.kelas}`) {
      currentUser = user;
      elements.loginPage.classList.add("hidden");
      elements.dashboard.classList.remove("hidden");
      elements.whatsappIcon.classList.remove("hidden");
      updateDashboard(user);
      showNotification("Login berhasil! 👋", "success");
      
      // Add this line to show maintenance overlay
      maintenanceOverlay.classList.remove("hidden");
  }
  });

  // Back Button Handler
  elements.backBtn?.addEventListener("click", () => {
    elements.certSubmissionForm.classList.add("hidden");
    elements.dashboard.classList.remove("hidden");
    document.getElementById("cert-form").reset();
  });

  // Certificate Submission Handler
  const certForm = document.getElementById("cert-form");
  certForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.submissionError.textContent = "";

    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const certificateLink = document.getElementById("certificate-link").value;

    if (!category || !description || !certificateLink) {
      elements.submissionError.textContent = "Mohon isi semua field dengan benar!";
      showNotification("Mohon lengkapi semua field!", "error");
      return;
    }

    const data = {
      kelas: currentUser.kelas,
      nama: currentUser.nama,
      nim: currentUser.nim,
      kategori_lomba: category,
      deskripsi_lomba: description,
      link_sertifikat: certificateLink
    };

    const url = "https://script.google.com/macros/s/AKfycbwoW_g_U4dwuLjXOYyWaXmVtOhf3oy0sCU0owHQwQ9QtDW6G8uCSF2LeQVWxpSTfpPuLA/exec";

    try {
      elements.loadingOverlay.classList.add("show");
      certForm.classList.add("submitting");

      const queryString = new URLSearchParams(data).toString();
      const submissionUrl = `${url}?${queryString}`;
      
      await fetch(submissionUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      showNotification("Sertifikat berhasil disubmit! ✨", "success");
      certForm.reset();
      
      // Update form with user data after reset
      document.getElementById("form-nim").value = currentUser.nim;
      document.getElementById("form-nama").value = currentUser.nama;
      document.getElementById("form-kelas").value = currentUser.kelas;
      
      elements.certSubmissionForm.classList.add("hidden");
      elements.dashboard.classList.remove("hidden");
      
    } catch (error) {
      console.error("Error submitting data:", error);
      showNotification("Gagal mengirim sertifikat. Coba lagi.", "error");
      elements.submissionError.textContent = "Terjadi kesalahan. Silakan coba lagi.";
    } finally {
      elements.loadingOverlay.classList.remove("show");
      certForm.classList.remove("submitting");
    }
  });

  // Initial setup
  debugLog('Script initialization complete');
  // At the top of your DOMContentLoaded event listener
const maintenanceOverlay = document.getElementById('maintenance-overlay');

// Add this function
function handleMaintenanceLogout() {
    // Reset all states
    elements.loginPage.classList.remove("hidden");
    elements.dashboard.classList.add("hidden");
    elements.certSubmissionForm.classList.add("hidden");
    elements.whatsappIcon.classList.add("hidden");
    maintenanceOverlay.classList.add("hidden");
    
    // Reset forms
    elements.loginForm.reset();
    if (document.getElementById("cert-form")) {
        document.getElementById("cert-form").reset();
    }
    
    // Clear error messages
    elements.errorMessage.textContent = "";
    showNotification("Anda telah keluar dari sistem", "success");
    
    // Reset current user
    currentUser = null;
}

// Modify the login handler in your script.js
// Find this part in your login form event listener:

});
