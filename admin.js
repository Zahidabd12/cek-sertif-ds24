document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const adminLoginPage = document.getElementById("admin-login-page");
    const adminDashboard = document.getElementById("admin-dashboard");
    const approvedDashboard = document.getElementById("approved-dashboard");
    const adminLoginForm = document.getElementById("admin-login-form");
    const adminErrorMessage = document.getElementById("admin-error-message");
    const submissionsList = document.getElementById("submissions-list");
    const totalSubmissions = document.getElementById("total-submissions");
    const pendingSubmissions = document.getElementById("pending-submissions");
    const refreshBtn = document.getElementById("refresh-btn");
    const viewApprovedBtn = document.getElementById("view-approved-btn");
    const viewPendingBtn = document.getElementById("view-pending-btn");
    const refreshApprovedBtn = document.getElementById("refresh-approved-btn");
    const rankingsBody = document.getElementById("rankings-body");
    const approvedList = document.getElementById("approved-list");
    const totalApproved = document.getElementById("total-approved");
    const activeStudents = document.getElementById("active-students");
    const loadingOverlay = document.getElementById("loading-overlay");
    const notification = document.getElementById("notification");
    const notificationMessage = notification.querySelector(".notification-message");
    const notificationClose = notification.querySelector(".notification-close");

    // Show notification function
    function showNotification(message, type = 'success') {
        notificationMessage.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Hide notification on close button click
    notificationClose.addEventListener('click', () => {
        notification.classList.remove('show');
    });

    // Format date function
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Load Submissions
    async function loadSubmissions() {
        const submissionsUrl = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?sheet=Sheet2&tqx=out:json';
        
        try {
            loadingOverlay.classList.add("show");
            const response = await fetch(submissionsUrl);
            const text = await response.text();
            const jsonStart = text.indexOf('({') + 1;
            const jsonEnd = text.lastIndexOf('})') + 1;
            const data = JSON.parse(text.substring(jsonStart, jsonEnd));
            
            submissionsList.innerHTML = '';
            let pendingCount = 0;
            
            // Skip header row
            const rows = data.table.rows;
            if (rows.length <= 1) {
                submissionsList.innerHTML = '<p class="no-data">Belum ada pengajuan sertifikat</p>';
                totalSubmissions.textContent = "0";
                pendingSubmissions.textContent = "0";
                return;
            }

            // Process each submission
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
                        <a href="${submission.link}" target="_blank" class="btn-view">
                            Lihat Sertifikat
                        </a>
                    </div>
                `;
                
                submissionsList.appendChild(card);
            }
            
            totalSubmissions.textContent = pendingCount;
            pendingSubmissions.textContent = pendingCount;
            
        } catch (error) {
            console.error("Error loading submissions:", error);
            showNotification("Gagal memuat data pengajuan.", "error");
            submissionsList.innerHTML = '<p class="error-message">Terjadi kesalahan saat memuat data</p>';
        } finally {
            loadingOverlay.classList.remove("show");
        }
    }

    // Load Approved Data
    async function loadApprovedData() {
        try {
            loadingOverlay.classList.add("show");
            
            const sheet1Url = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?sheet=Sheet1&tqx=out:json';
            const sheet2Url = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?sheet=Sheet2&tqx=out:json';
            
            const [sheet1Response, sheet2Response] = await Promise.all([
                fetch(sheet1Url),
                fetch(sheet2Url)
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
            rankingsBody.innerHTML = '';
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
                
                rankingsBody.appendChild(row);
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
            approvedList.innerHTML = '';
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
                
                approvedList.appendChild(card);
            });

            // Update statistics
            const totalCerts = rankings.reduce((sum, student) => sum + student.certCount, 0);
            totalApproved.textContent = totalCerts;
            activeStudents.textContent = rankings.length;

        } catch (error) {
            console.error("Error loading approved data:", error);
            showNotification("Gagal memuat data.", "error");
        } finally {
            loadingOverlay.classList.remove("show");
        }
    }

    // Approve Submission
    window.approveSubmission = async function(nim) {
        try {
            loadingOverlay.classList.add("show");
            
            const url = "https://script.google.com/macros/s/AKfycbwoW_g_U4dwuLjXOYyWaXmVtOhf3oy0sCU0owHQwQ9QtDW6G8uCSF2LeQVWxpSTfpPuLA/exec";
            const data = {
                action: 'approve',
                nim: nim
            };
            
            const queryString = new URLSearchParams(data).toString();
            
            await fetch(`${url}?${queryString}`, {
                method: 'POST',
                mode: 'no-cors'
            });
            
            showNotification("Sertifikat berhasil disetujui!", "success");
            
            // Switch to approved dashboard and refresh data
            adminDashboard.classList.add("hidden");
            approvedDashboard.classList.remove("hidden");
            await loadApprovedData();
            
        } catch (error) {
            console.error("Error approving submission:", error);
            showNotification("Gagal menyetujui sertifikat.", "error");
        } finally {
            loadingOverlay.classList.remove("show");
        }
    };

    // Event Listeners
    adminLoginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("admin-password").value;

        if (username === "panitia" && password === "panitia") {
            adminLoginPage.classList.add("hidden");
            adminDashboard.classList.remove("hidden");
            loadSubmissions();
            showNotification("Login berhasil! 👋", "success");
        } else {
            adminErrorMessage.textContent = "Username atau Password salah!";
            showNotification("Login gagal!", "error");
        }
    });

    viewApprovedBtn.addEventListener("click", () => {
        adminDashboard.classList.add("hidden");
        approvedDashboard.classList.remove("hidden");
        loadApprovedData();
    });

    viewPendingBtn.addEventListener("click", () => {
        approvedDashboard.classList.add("hidden");
        adminDashboard.classList.remove("hidden");
        loadSubmissions();
    });

    refreshBtn.addEventListener("click", () => {
        loadSubmissions();
        showNotification("Data berhasil diperbarui!", "success");
    });

    refreshApprovedBtn.addEventListener("click", () => {
        loadApprovedData();
        showNotification("Data berhasil diperbarui!", "success");
    });

    // Logout Buttons
    document.getElementById("admin-logout-btn").addEventListener("click", () => {
        adminDashboard.classList.add("hidden");
        approvedDashboard.classList.add("hidden");
        adminLoginPage.classList.remove("hidden");
        adminLoginForm.reset();
        showNotification("Logout berhasil!", "success");
    });

    document.getElementById("admin-approved-logout-btn").addEventListener("click", () => {
        adminDashboard.classList.add("hidden");
        approvedDashboard.classList.add("hidden");
        adminLoginPage.classList.remove("hidden");
        adminLoginForm.reset();
        showNotification("Logout berhasil!", "success");
    });
});
