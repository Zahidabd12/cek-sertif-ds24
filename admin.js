document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const elements = {
        loginPage: document.getElementById("admin-login-page"),
        dashboard: document.getElementById("admin-dashboard"),
        approvedDashboard: document.getElementById("approved-dashboard"),
        loginForm: document.getElementById("admin-login-form"),
        errorMessage: document.getElementById("admin-error-message"),
        submissionsList: document.getElementById("submissions-list"),
        totalSubmissions: document.getElementById("total-submissions"),
        pendingSubmissions: document.getElementById("pending-submissions"),
        refreshBtn: document.getElementById("refresh-btn"),
        viewApprovedBtn: document.getElementById("view-approved-btn"),
        viewPendingBtn: document.getElementById("view-pending-btn"),
        refreshApprovedBtn: document.getElementById("refresh-approved-btn"),
        rankingsBody: document.getElementById("rankings-body"),
        approvedList: document.getElementById("approved-list"),
        totalApproved: document.getElementById("total-approved"),
        activeStudents: document.getElementById("active-students"),
        loadingOverlay: document.getElementById("loading-overlay"),
        notification: document.getElementById("notification"),
        logoutBtns: {
            adminDashboard: document.getElementById("admin-logout-btn"),
            approvedDashboard: document.getElementById("admin-approved-logout-btn")
        }
    };

    // Notification Elements
    const notificationMessage = elements.notification.querySelector(".notification-message");
    const notificationClose = elements.notification.querySelector(".notification-close");

    // Utility Functions
    function showNotification(message, type = 'success') {
        notificationMessage.textContent = message;
        elements.notification.className = `notification ${type}`;
        elements.notification.classList.add('show');
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, 3000);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // API Endpoints
    const API_URL = "https://script.google.com/macros/s/AKfycbzxy5d1xc_aJQALgNrI4YkNOOvdPxv1wjuPIkzMBmfry0_ZPs9YlkmDraZyfOKekrTECQ/exec";
    const SHEETS = {
        SUBMISSIONS: 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?sheet=Sheet2&tqx=out:json',
        STUDENT_DATA: 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?sheet=Sheet1&tqx=out:json'
    };

    // Submission Handling
    async function loadSubmissions() {
        try {
            elements.loadingOverlay.classList.add("show");
            const response = await fetch(SHEETS.SUBMISSIONS);
            const text = await response.text();
            const jsonStart = text.indexOf('({') + 1;
            const jsonEnd = text.lastIndexOf('})') + 1;
            const data = JSON.parse(text.substring(jsonStart, jsonEnd));
            
            elements.submissionsList.innerHTML = '';
            let pendingCount = 0;
            
            const rows = data.table.rows;
            if (rows.length <= 1) {
                elements.submissionsList.innerHTML = '<p class="no-data">Belum ada pengajuan sertifikat</p>';
                elements.totalSubmissions.textContent = "0";
                elements.pendingSubmissions.textContent = "0";
                return;
            }

            // Process submissions
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row.c[0] || !row.c[1] || !row.c[2]) continue;

                pendingCount++;
                
                const submission = {
                    kelas: row.c[0]?.v || '',
                    nama: row.c[1]?.v || '',
                    nim: row.c[2]?.v || '',
                    kategori: row.c[3]?.v || '',
                    deskripsi: row.c[4]?.v || '',
                    link: row.c[5]?.v || '',
                    timestamp: row.c[6]?.v || ''
                };

                const card = document.createElement('div');
                card.className = 'submission-card';
                card.innerHTML = `
                    <div class="submission-header">
                        <h3>${submission.nama}</h3>
                        <span>NIM: ${submission.nim} | Kelas ${submission.kelas}</span>
                    </div>
                    <div class="submission-info">
                        <p><strong>Kategori:</strong> ${submission.kategori}</p>
                        <p><strong>Deskripsi:</strong> ${submission.deskripsi}</p>
                        <p><strong>Tanggal Submit:</strong> ${formatDate(submission.timestamp)}</p>
                    </div>
                    <div class="submission-actions">
                        <button class="btn-approve" onclick="approveSubmission('${submission.nim}')">
                            Setujui
                        </button>
                        <button class="btn-reject" onclick="rejectSubmission('${submission.nim}')">
                            Tolak
                        </button>
                        <a href="${submission.link}" target="_blank" class="btn-view">
                            Lihat Sertifikat
                        </a>
                    </div>
                `;
                
                elements.submissionsList.appendChild(card);
            }
            
            elements.totalSubmissions.textContent = pendingCount;
            elements.pendingSubmissions.textContent = pendingCount;
            
        } catch (error) {
            console.error("Error loading submissions:", error);
            showNotification("Gagal memuat data pengajuan.", "error");
            elements.submissionsList.innerHTML = '<p class="error-message">Terjadi kesalahan saat memuat data</p>';
        } finally {
            elements.loadingOverlay.classList.remove("show");
        }
    }

    // Approved Data Handling
    async function loadApprovedData() {
        try {
            elements.loadingOverlay.classList.add("show");
            
            const [sheet1Response, sheet2Response] = await Promise.all([
                fetch(SHEETS.STUDENT_DATA),
                fetch(SHEETS.SUBMISSIONS)
            ]);

            const sheet1Text = await sheet1Response.text();
            const sheet2Text = await sheet2Response.text();

            const sheet1Data = JSON.parse(sheet1Text.substring(
                sheet1Text.indexOf('({') + 1,
                sheet1Text.lastIndexOf('})') + 1
            ));

            const sheet2Data = JSON.parse(sheet2Text.substring(
                sheet2Text.indexOf('({') + 1,
                sheet2Text.lastIndexOf('})') + 1
            ));

            // Process rankings
            const rankings = sheet1Data.table.rows.slice(1)
                .map(row => ({
                    nim: row.c[0]?.v || '',
                    nama: row.c[1]?.v || '',
                    kelas: row.c[2]?.v || '',
                    certCount: row.c[3]?.v || 0
                }))
                .filter(student => student.nim)
                .sort((a, b) => b.certCount - a.certCount);

            // Update rankings display
            elements.rankingsBody.innerHTML = '';
            rankings.forEach((student, index) => {
                const progress = (student.certCount / 10) * 100;
                const row = document.createElement('tr');
                row.className = index < 3 ? `top-3 rank-${index + 1}` : '';
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.nim}</td>
                    <td>${student.nama}</td>
                    <td>${student.kelas}</td>
                    <td>${student.certCount}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </td>
                `;
                
                elements.rankingsBody.appendChild(row);
            });

            // Process approved certificates
            const approvedCerts = sheet2Data.table.rows.slice(1)
                .map(row => ({
                    kelas: row.c[0]?.v || '',
                    nama: row.c[1]?.v || '',
                    nim: row.c[2]?.v || '',
                    kategori: row.c[3]?.v || '',
                    deskripsi: row.c[4]?.v || '',
                    link: row.c[5]?.v || '',
                    timestamp: row.c[6]?.v || ''
                }))
                .filter(cert => {
                    const student = rankings.find(s => s.nim === cert.nim);
                    return student && student.certCount > 0;
                });

            // Update approved certificates display
            elements.approvedList.innerHTML = '';
            approvedCerts.forEach(cert => {
                const card = document.createElement('div');
                card.className = 'certificate-card';
                card.innerHTML = `
                    <div class="certificate-header">
                        <h3>${cert.nama}</h3>
                        <span>NIM: ${cert.nim} | Kelas ${cert.kelas}</span>
                    </div>
                    <div class="certificate-info">
                        <p><strong>Kategori:</strong> ${cert.kategori}</p>
                        <p><strong>Deskripsi:</strong> ${cert.deskripsi}</p>
                        <p><strong>Tanggal Submit:</strong> ${formatDate(cert.timestamp)}</p>
                    </div>
                    <a href="${cert.link}" target="_blank" class="btn-view">
                        Lihat Sertifikat
                    </a>
                `;
                
                elements.approvedList.appendChild(card);
            });

            // Update statistics
            const totalCerts = rankings.reduce((sum, student) => sum + student.certCount, 0);
            elements.totalApproved.textContent = totalCerts;
            elements.activeStudents.textContent = rankings.length;

        } catch (error) {
            console.error("Error loading approved data:", error);
            showNotification("Gagal memuat data.", "error");
        } finally {
            elements.loadingOverlay.classList.remove("show");
        }
    }

    // Submission Actions
    window.approveSubmission = async function(nim) {
        try {
            elements.loadingOverlay.classList.add("show");
            
            const queryString = new URLSearchParams({
                action: 'approve',
                nim: nim
            }).toString();
            
            await fetch(`${API_URL}?${queryString}`, {
                method: 'POST',
                mode: 'no-cors'
            });
            
            showNotification("Sertifikat berhasil disetujui!", "success");
            
            // Refresh submissions
            await loadSubmissions();
            
        } catch (error) {
            console.error("Error approving submission:", error);
            showNotification("Gagal menyetujui sertifikat.", "error");
        } finally {
            elements.loadingOverlay.classList.remove("show");
        }
    };

    window.rejectSubmission = async function(nim) {
        const feedback = prompt("Berikan alasan penolakan sertifikat:");
        if (feedback === null) return; // User cancelled

        try {
            elements.loadingOverlay.classList.add("show");
            
            const queryString = new URLSearchParams({
                action: 'reject',
                nim: nim,
                feedback: feedback
            }).toString();
            
            await fetch(`${API_URL}?${queryString}`, {
                method: 'POST',
                mode: 'no-cors'
            });
            
            showNotification("Sertifikat ditolak!", "error");
            
            // Refresh submissions
            await loadSubmissions();
            
        } catch (error) {
            console.error("Error rejecting submission:", error);
            showNotification("Gagal menolak sertifikat.", "error");
        } finally {
            elements.loadingOverlay.classList.remove("show");
        }
    };

    // Event Listeners
    function setupEventListeners() {
        // Login
        elements.loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("admin-password").value;

            if (username === "panitia" && password === "panitia") {
                elements.loginPage.classList.add("hidden");
                elements.dashboard.classList.remove("hidden");
                loadSubmissions();
                showNotification("Login berhasil! 👋", "success");
            } else {
                elements.errorMessage.textContent = "Username atau Password salah!";
                showNotification("Login gagal!", "error");
            }
        });

        // Navigation
        elements.viewApprovedBtn.addEventListener("click", () => {
            elements.dashboard.classList.add("hidden");
            elements.approvedDashboard.classList.remove("hidden");
            loadApprovedData();
        });

        elements.viewPendingBtn.addEventListener("click", () => {
            elements.approvedDashboard.classList.add("hidden");
            elements.dashboard.classList.remove("hidden");
            loadSubmissions();
        });

        // Refresh
        elements.refreshBtn.addEventListener("click", () => {
            loadSubmissions();
            showNotification("Data berhasil diperbarui!", "success");
        });

        elements.refreshApprovedBtn.addEventListener("click", () => {
            loadApprovedData();
            showNotification("Data berhasil diperbarui!", "success");
        });

        // Logout
        Object.values(elements.logoutBtns).forEach(btn => {
            btn.addEventListener("click", () => {
                elements.dashboard.classList.add("hidden");
                elements.approvedDashboard.classList.add("hidden");
                elements.loginPage.classList.remove("hidden");
                elements.loginForm.reset();
                showNotification("Logout berhasil!", "success");
            });
        });

        // Notification Close
        notificationClose.addEventListener('click', () => {
            elements.notification.classList.remove('show');
        });
    }

    // Initialize
    setupEventListeners();
});
