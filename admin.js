document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const adminLoginPage = document.getElementById("admin-login-page");
    const adminDashboard = document.getElementById("admin-dashboard");
    const adminLoginForm = document.getElementById("admin-login-form");
    const adminErrorMessage = document.getElementById("admin-error-message");
    const submissionsList = document.getElementById("submissions-list");
    const totalSubmissions = document.getElementById("total-submissions");
    const pendingSubmissions = document.getElementById("pending-submissions");
    const refreshBtn = document.getElementById("refresh-btn");
    const adminLogoutBtn = document.getElementById("admin-logout-btn");
    const loadingOverlay = document.getElementById("loading-overlay");

    // Load Submissions
    async function loadSubmissions() {
        const submissionsUrl = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?sheet=Sheet2&tqx=out:json&tq=SELECT *';
        
        try {
            loadingOverlay.classList.add("show");
            const response = await fetch(submissionsUrl);
            const text = await response.text();
            
            // Extract the JSON data
            const jsonStart = text.indexOf('({') + 1;
            const jsonEnd = text.lastIndexOf('})') + 1;
            const data = JSON.parse(text.substring(jsonStart, jsonEnd));
            
            if (!data.table || !data.table.rows) {
                throw new Error("Invalid data format");
            }

            submissionsList.innerHTML = '';
            let pendingCount = 0;

            // Skip header row and process data
            for (let i = 1; i < data.table.rows.length; i++) {
                const row = data.table.rows[i];
                
                // Skip if row is empty
                if (!row.c || !row.c[0] || !row.c[0].v) continue;

                pendingCount++;
                
                // Create submission card
                const card = document.createElement('div');
                card.className = 'submission-card';
                card.innerHTML = `
                    <div class="submission-header">
                        <h3>${row.c[1]?.v || 'Unnamed'} (${row.c[2]?.v || 'No NIM'})</h3>
                        <span>Kelas ${row.c[0]?.v || 'N/A'}</span>
                    </div>
                    <div class="submission-info">
                        <p><strong>Kategori:</strong> ${row.c[3]?.v || 'N/A'}</p>
                        <p><strong>Deskripsi:</strong> ${row.c[4]?.v || 'N/A'}</p>
                        <p><strong>Tanggal Submit:</strong> ${row.c[6]?.v ? new Date(row.c[6]?.v).toLocaleDateString('id-ID') : 'N/A'}</p>
                    </div>
                    <div class="submission-actions">
                        <button class="btn-approve" onclick="approveSubmission('${row.c[2]?.v || ''}')">
                            Setujui
                        </button>
                        <a href="${row.c[5]?.v || '#'}" 
                           target="_blank" 
                           class="btn-view"
                           ${!row.c[5]?.v ? 'disabled' : ''}>
                            Lihat Sertifikat
                        </a>
                    </div>
                `;
                
                submissionsList.appendChild(card);
            }
            
            // Update counters
            totalSubmissions.textContent = pendingCount;
            pendingSubmissions.textContent = pendingCount;

            // Show no data message if needed
            if (pendingCount === 0) {
                submissionsList.innerHTML = '<p class="no-data">Belum ada pengajuan sertifikat</p>';
            }
            
        } catch (error) {
            console.error("Error loading submissions:", error);
            submissionsList.innerHTML = '<p class="error">Gagal memuat data. Silakan coba lagi.</p>';
        } finally {
            loadingOverlay.classList.remove("show");
        }
    }

    // Admin Login
    adminLoginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("admin-password").value;

        if (username === "panitia" && password === "panitia") {
            adminLoginPage.classList.add("hidden");
            adminDashboard.classList.remove("hidden");
            loadSubmissions();
        } else {
            adminErrorMessage.textContent = "Username atau Password salah!";
        }
    });

    // Refresh Button
    refreshBtn.addEventListener("click", loadSubmissions);

    // Logout Button
    adminLogoutBtn.addEventListener("click", () => {
        adminDashboard.classList.add("hidden");
        adminLoginPage.classList.remove("hidden");
        adminLoginForm.reset();
        submissionsList.innerHTML = '';
    });

    // Approve Submission
    window.approveSubmission = async function(nim) {
        if (!nim) {
            alert('NIM tidak valid');
            return;
        }

        try {
            loadingOverlay.classList.add("show");
            
            const url = "https://script.google.com/macros/s/AKfycbwniJv72T5P9jH8swvSlzvmbGaSiGa3pMDbLB2YFUvaNwSg5hG0B9J6WHAdp1Rbn7EJ5A/exec";
            const data = {
                action: 'approve',
                nim: nim
            };
            
            const queryString = new URLSearchParams(data).toString();
            await fetch(`${url}?${queryString}`, {
                method: 'POST',
                mode: 'no-cors'
            });
            
            await loadSubmissions(); // Reload the list
            alert('Sertifikat berhasil disetujui!');
            
        } catch (error) {
            console.error("Error approving submission:", error);
            alert('Gagal menyetujui sertifikat. Silakan coba lagi.');
        } finally {
            loadingOverlay.classList.remove("show");
        }
    };
});
