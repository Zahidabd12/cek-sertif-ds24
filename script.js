document.addEventListener("DOMContentLoaded", () => {
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
  const classSelect = document.getElementById("class-select");
  const nameSelect = document.getElementById("name-select");
  const nimInput = document.getElementById("nim-input");
  const submissionError = document.getElementById("submission-error");
  const backBtn = document.getElementById("back-btn");

  const loginForm = document.getElementById("login-form");

  // Load data from Google Sheets
  let userData = [];
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?tqx=out:json';

  fetch(sheetUrl)
    .then((response) => response.text())
    .then((data) => {
      try {
        const jsonStart = data.indexOf('({') + 1;
        const jsonEnd = data.lastIndexOf('})') + 1;
        const jsonData = JSON.parse(data.substring(jsonStart, jsonEnd));
        const rows = jsonData.table.rows;

        userData = rows.map(row => {
          const nim = row.c[0] ? parseFloat(row.c[0].v) : null;
          const nama = row.c[1] ? row.c[1].v : null;
          const kelas = row.c[2] ? row.c[2].v : null;
          const sertif_disetujui = row.c[3] ? parseInt(row.c[3].v) : 0;
          const deadlineStr = row.c[4] ? row.c[4].v.replace('Date(', '').replace(')', '') : null;

          let deadline = null;
          if (deadlineStr) {
            const [year, month, day] = deadlineStr.split(',').map(Number);
            deadline = new Date(year, month, day);
          }

          return { nim, nama, kelas, sertif_disetujui, deadline };
        });
      } catch (error) {
        console.error("Error parsing data:", error);
      }
    })
    .catch((error) => {
      console.error("Error loading data:", error);
    });

  // Handle login
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nim = document.getElementById("nim").value;
    const password = document.getElementById("password").value;

    const user = userData.find((u) => u.nim === parseFloat(nim));

    if (user && password === `${nim}${user.kelas}`) {
      // Show dashboard
      loginPage.classList.add("hidden");
      dashboard.classList.remove("hidden");
      whatsappIcon.classList.remove("hidden"); // Show WhatsApp icon

      // Populate dashboard
      userNim.textContent = user.nim;
      userKelas.textContent = user.kelas;
      sertifDisetujui.textContent = user.sertif_disetujui;
      const remaining = 10 - user.sertif_disetujui;
      sisaSertif.textContent = remaining;

      // Welcome message with full name
      welcomeMessage.textContent = `Selamat datang, ${user.nama}!`;

      // Calculate remaining days until deadline
      const deadlineDate = user.deadline;
      const today = new Date();
      const timeDifference = deadlineDate - today;
      const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        deadlineElement.textContent = `Tersisa ${daysRemaining} hari lagi untuk pengumpulan!`;
      } else if (daysRemaining === 0) {
        deadlineElement.textContent = "Hari ini adalah deadline pengumpulan!";
      } else {
        deadlineElement.textContent = "Deadline telah terlewati!";
      }

      // Status based on remaining certificates
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
    } else {
      errorMessage.textContent = "NIM atau Password salah!";
    }
  });

  // Handle collect certificate button click
  collectCertBtn.addEventListener("click", () => {
    certSubmissionForm.classList.remove("hidden");
    dashboard.classList.add("hidden");
  });

  // Handle class select change
  classSelect.addEventListener("change", () => {
    const selectedClass = classSelect.value;
    nameSelect.innerHTML = '<option value="">Pilih Nama</option>';
    userData.filter(user => user.kelas === selectedClass).forEach(user => {
      const option = document.createElement("option");
      option.value = user.nim;
      option.textContent = user.nama;
      nameSelect.appendChild(option);
    });
  });

  // Handle name select change
  nameSelect.addEventListener("change", () => {
    const selectedNim = nameSelect.value;
    const user = userData.find(user => user.nim === parseFloat(selectedNim));
    if (user) {
      nimInput.value = user.nim;
    } else {
      nimInput.value = "";
    }
  });

  // Handle back button click
  backBtn.addEventListener("click", () => {
    certSubmissionForm.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });

 // Handle certificate form submit
const certForm = document.getElementById("cert-form");
certForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submissionError.textContent = "";

  const selectedNim = nimInput.value;
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;
  const certificateLink = document.getElementById("certificate-link").value;

  if (!selectedNim || !category || !description || !certificateLink) {
    submissionError.textContent = "Mohon isi semua field dengan benar!";
    return;
  }

  // Send data to Google Sheets using Google Apps Script
  const url = "https://script.google.com/macros/s/AKfycbwi8VuzdQFnVZZaNn40EYmdnLM2M2P5UIgHINczP50l/dev"; // Replace with your Google Apps Script URL
  const data = {
    kelas: "02", // You can dynamically get this value based on user selection
    nama: "", // This should be populated based on the user's NIM
    nim: selectedNim,
    kategori_lomba: category,
    deskripsi_lomba: description,
    link_sertifikat: certificateLink
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert("Sertifikat berhasil disubmit!");
      certForm.reset();
    } else {
      submissionError.textContent = "Gagal mengirim data. Silakan coba lagi.";
    }
  } catch (error) {
    console.error("Error submitting data:", error);
    submissionError.textContent = "Terjadi kesalahan. Silakan coba lagi.";
  }
});
});
