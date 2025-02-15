document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginPage = document.getElementById("login-page");
  const dashboard = document.getElementById("dashboard");
  const errorMessage = document.getElementById("error-message");
  const userNim = document.getElementById("user-nim");
  const userKelas = document.getElementById("user-kelas");
  const sertifDisetujui = document.getElementById("sertif-disetujui");
  const sisaSertif = document.getElementById("sisa-sertif");
  const status = document.getElementById("status");
  const deadlineElement = document.getElementById("deadline");
  const welcomeMessage = document.getElementById("welcome-message");
  const whatsappIcon = document.getElementById("whatsapp-icon");
  const collectCertBtn = document.getElementById("collect-cert-btn");
  const certSubmissionForm = document.getElementById("cert-submission-form");
  const submissionError = document.getElementById("submission-error");
  const backBtn = document.getElementById("back-btn");
  const loginForm = document.getElementById("login-form");
  const loadingOverlay = document.getElementById("loading-overlay");
  const notification = document.getElementById('notification');
  const notificationMessage = notification.querySelector('.notification-message');
  const notificationClose = notification.querySelector('.notification-close');

  // State
  let currentUser = null;
  let userData = [];

  // Notification Functions
  function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
      hideNotification();
    }, 5000);
  }

  function hideNotification() {
    notification.classList.remove('show');
  }

  notificationClose.addEventListener('click', hideNotification);

  // Deadline Calculation
  function calculateDeadlineDays() {
    const today = new Date();
    const deadline = new Date(2025, 5, 14); // June 14, 2025
    
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const timeDifference = deadline.getTime() - today.getTime();
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
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
          deadline: new Date(2025, 5, 14) // Fixed deadline for all users
        }));
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
    userNim.textContent = user.nim;
    userKelas.textContent = user.kelas;
    sertifDisetujui.textContent = user.sertif_disetujui;
    
    const remaining = 10 - user.sertif_disetujui;
    sisaSertif.textContent = remaining;
    welcomeMessage.textContent = `Selamat datang, ${user.nama}!`;

    const daysRemaining = calculateDeadlineDays();
    if (daysRemaining > 0) {
      deadlineElement.textContent = `Tersisa ${daysRemaining} hari lagi untuk pengumpulan!`;
    } else if (daysRemaining === 0) {
      deadlineElement.textContent = "Hari ini adalah deadline pengumpulan!";
    } else {
      deadlineElement.textContent = "Deadline telah terlewati!";
    }

    if (remaining === 0) {
      status.textContent = "Semua sertifikat telah dikumpulkan!";
      status.className = "status-green";
    } else if (remaining <= 5) {
      status.textContent = "Hampir selesai! Tetap semangat!";
      status.className = "status-orange";
    } else {
      status.textContent = "Masih banyak sertifikat yang harus dikumpulkan!";
      status.className = "status-red";
    }
  }

  // Event Handlers
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nim = document.getElementById("nim").value;
    const password = document.getElementById("password").value;

    const user = userData.find((u) => u.nim === parseFloat(nim));

    if (user && password === `${nim}${user.kelas}`) {
      currentUser = user;
      loginPage.classList.add("hidden");
      dashboard.classList.remove("hidden");
      whatsappIcon.classList.remove("hidden");
      updateDashboard(user);
      showNotification("Login berhasil! 👋", "success");
    } else {
      errorMessage.textContent = "NIM atau Password salah!";
      showNotification("Login gagal! Periksa NIM dan Password.", "error");
    }
  });

  collectCertBtn.addEventListener("click", () => {
    document.getElementById("form-nim").value = currentUser.nim;
    document.getElementById("form-nama").value = currentUser.nama;
    document.getElementById("form-kelas").value = currentUser.kelas;
    
    document.getElementById("form-nim-display").textContent = currentUser.nim;
    document.getElementById("form-nama-display").textContent = currentUser.nama;
    document.getElementById("form-kelas-display").textContent = currentUser.kelas;

    certSubmissionForm.classList.remove("hidden");
    dashboard.classList.add("hidden");
  });

  backBtn.addEventListener("click", () => {
    certSubmissionForm.classList.add("hidden");
    dashboard.classList.remove("hidden");
    document.getElementById("cert-form").reset();
  });

  const certForm = document.getElementById("cert-form");
  certForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    submissionError.textContent = "";

    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const certificateLink = document.getElementById("certificate-link").value;

    if (!category || !description || !certificateLink) {
      submissionError.textContent = "Mohon isi semua field dengan benar!";
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

    const url = "https://script.google.com/macros/s/AKfycbwniJv72T5P9jH8swvSlzvmbGaSiGa3pMDbLB2YFUvaNwSg5hG0B9J6WHAdp1Rbn7EJ5A/exec";

    try {
      loadingOverlay.classList.add("show");
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
      
      certSubmissionForm.classList.add("hidden");
      dashboard.classList.remove("hidden");
      
    } catch (error) {
      console.error("Error submitting data:", error);
      showNotification("Gagal mengirim sertifikat. Coba lagi.", "error");
      submissionError.textContent = "Terjadi kesalahan. Silakan coba lagi.";
    } finally {
      loadingOverlay.classList.remove("show");
      certForm.classList.remove("submitting");
    }
  });
});
