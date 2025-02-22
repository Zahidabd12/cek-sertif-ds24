document.addEventListener("DOMContentLoaded", () => {
    // Debug function
    function debugLog(message, ...args) {
        console.log(`[Certificate System] ${message}`, ...args);
    }
  
    // DOM Elements - Robust Selection
    const elements = {
        // Existing elements
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
        notification: document.getElementById('notification'),

        // New elements for feedback and approved certificates
        feedbackSection: document.getElementById("feedback-section"),
        feedbackList: document.getElementById("feedback-list"),
        noFeedbackMessage: document.getElementById("no-feedback-message"),
        viewFeedbackBtn: document.getElementById("view-feedback-btn"),
        backToFeedbackDashboard: document.getElementById("back-to-dashboard-feedback"),

        approvedCertificatesSection: document.getElementById("approved-certificates-section"),
        approvedCertificatesList: document.getElementById("approved-certificates-list"),
        noApprovedCertificatesMessage: document.getElementById("no-approved-certificates-message"),
        viewApprovedCertificatesBtn: document.getElementById("view-approved-certificates-btn"),
        backToApprovedDashboard: document.getElementById("back-to-dashboard-approved")
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
        const deadline = new Date(2025, 6, 14); // June 14, 2025
        
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
    // Update Dashboard
function updateDashboard(user) {
    if (!user) return;

    // Update user name (full name in uppercase)
    const userNameElement = document.getElementById('user-full-name');
    userNameElement.textContent = user.nama.toUpperCase();

    // Update other user info
    document.getElementById('user-nim').textContent = user.nim;
    document.getElementById('user-kelas').textContent = user.kelas;
    document.getElementById('sertif-disetujui').textContent = user.sertif_disetujui;
    
    const remaining = 2 - user.sertif_disetujui;
    document.getElementById('sisa-sertif').textContent = remaining;

    const statusElement = document.getElementById('status');
    const deadlineElement = document.getElementById('deadline');

    // Calculate deadline days
    const daysRemaining = calculateDeadlineDays();

    // Update deadline text
    if (daysRemaining > 0) {
        deadlineElement.textContent = `Tersisa ${daysRemaining} hari lagi untuk pengumpulan!`;
    } else if (daysRemaining === 0) {
        deadlineElement.textContent = "Hari ini adalah deadline pengumpulan!";
    } else {
        deadlineElement.textContent = "Deadline telah terlewati!";
    }

    // Update status based on remaining certificates
    if (remaining === 0) {
        statusElement.textContent = "Semua Sertifikat Terkumpul";
        statusElement.classList.remove('status-badge');
        statusElement.classList.add('status-success');
    } else if (remaining <= 5) {
        statusElement.textContent = "Hampir Selesai";
        statusElement.classList.add('status-badge');
    } else {
        statusElement.textContent = "Masih Banyak Sertifikat";
        statusElement.classList.add('status-badge');
    }

    // Setup button handlers
    const collectCertBtn = document.getElementById('collect-cert-btn');
    const viewFeedbackBtn = document.getElementById('view-feedback-btn');
    const viewApprovedCertsBtn = document.getElementById('view-approved-certificates-btn');

    collectCertBtn.addEventListener('click', () => {
        // Populate form with user data
        const formElements = {
            nim: document.getElementById("form-nim"),
            nama: document.getElementById("form-nama"),
            kelas: document.getElementById("form-kelas"),
            nimDisplay: document.getElementById("form-nim-display"),
            namaDisplay: document.getElementById("form-nama-display"),
            kelasDisplay: document.getElementById("form-kelas-display")
        };

        // Populate form
        formElements.nim.value = user.nim;
        formElements.nama.value = user.nama;
        formElements.kelas.value = user.kelas;
        
        formElements.nimDisplay.textContent = user.nim;
        formElements.namaDisplay.textContent = user.nama;
        formElements.kelasDisplay.textContent = user.kelas;

        // Toggle visibility
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('cert-submission-form').classList.remove('hidden');
    });

    viewFeedbackBtn.addEventListener('click', () => {
        // Fetch and display feedback
        fetchAndDisplayFeedback(user.nim);
        
        // Toggle visibility
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('feedback-section').classList.remove('hidden');
    });

    viewApprovedCertsBtn.addEventListener('click', () => {
        // Fetch and display approved certificates
        fetchAndDisplayApprovedCertificates(user.nim);
        
        // Toggle visibility
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('approved-certificates-section').classList.remove('hidden');
    });
}

// Deadline Calculation Function
function calculateDeadlineDays() {
    const today = new Date();
    const deadline = new Date(2025, 6, 14); // June 14, 2025
    
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const timeDifference = deadline.getTime() - today.getTime();
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
}

// Add CSS for status classes (can be added to an external stylesheet)
const styleElement = document.createElement('style');
styleElement.textContent = `
    .status-badge {
        background-color: rgba(220, 53, 69, 0.1);
        color: #dc3545;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.9em;
        text-transform: uppercase;
    }
    .status-success {
        background-color: rgba(40, 167, 69, 0.1);
        color: #28a745;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.9em;
        text-transform: uppercase;
    }
`;
document.head.appendChild(styleElement);
  
    // Feedback and Approved Certificates URLs
    // Updated URLs for Feedback and Approved Certificates
const feedbackSheetUrl = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?tqx=out:json&sheet=Feedback';
const approvedCertificatesSheetUrl = 'https://docs.google.com/spreadsheets/d/1tLDIMHIlhXMvcVrdlI9HYKBtOrT9mLfo9lL10J9jNTk/gviz/tq?tqx=out:json&sheet=Sheet3';

// Improved JSON Parsing Function
function parseGoogleSheetsJSON(text) {
    // Remove the JavaScript wrapper
    const jsonText = text.replace(/^\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\(/,'').replace(/\);$/,'');
    
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('JSON Parsing Error:', error);
        console.log('Raw response:', text);
        throw error;
    }
}

// Fetch and Display Feedback Function
// Fetch and Display Feedback Function
// Update the fetchAndDisplayFeedback function to include all feedback data
async function fetchAndDisplayFeedback(nim) {
    try {
        const response = await fetch(feedbackSheetUrl);
        const text = await response.text();
        
        const jsonData = parseGoogleSheetsJSON(text);
        
        // Filter feedback for current user
        const userFeedback = jsonData.table.rows
            .filter(row => row.c[0] && row.c[0].v.toString() === nim.toString())
            .map(row => ({
                nim: row.c[0] ? row.c[0].v : null,
                feedback: row.c[1] ? row.c[1].v : 'Tidak ada feedback',
                timestamp: row.c[2] ? new Date(row.c[2].v).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia',
                status: row.c[3] ? row.c[3].v : 'Tidak diketahui',
                kelas: row.c[4] ? row.c[4].v : 'Tidak tersedia',
                nama: row.c[5] ? row.c[5].v : 'Tidak tersedia',
                kategori_lomba: row.c[6] ? row.c[6].v : 'Tidak tersedia',
                deskripsi_lomba: row.c[7] ? row.c[7].v : 'Tidak tersedia',
                link_sertifikat: row.c[8] ? row.c[8].v : '#',
                tanggal_submit: row.c[9] ? new Date(row.c[9].v).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia'
            }));
        
        // Clear previous feedback
        elements.feedbackList.innerHTML = '';
        
        if (userFeedback.length === 0) {
            elements.noFeedbackMessage.style.display = 'block';
            return;
        }
        
        elements.noFeedbackMessage.style.display = 'none';
        
        // Create feedback items with expanded information
        userFeedback.forEach(feedback => {
            const feedbackItem = document.createElement('div');
            feedbackItem.classList.add('feedback-item');
            
            // Determine status color
            let statusColor = 'red';
            if (feedback.status.toLowerCase() === 'approved') {
                statusColor = 'green';
            }
            
            feedbackItem.innerHTML = `
                <div class="feedback-header">
                    <div class="feedback-title">
                        <h3>${feedback.deskripsi_lomba}</h3>
                        <span class="feedback-category">${feedback.kategori_lomba}</span>
                    </div>
                    <span class="feedback-date">
                        <strong>Tanggal Feedback:</strong> ${feedback.timestamp}
                    </span>
                </div>
                <div class="feedback-body">
                    <div class="feedback-status">
                        <strong>Status:</strong> 
                        <span style="color: ${statusColor};">${feedback.status}</span>
                    </div>
                    <div class="feedback-description">
                        <strong>Keterangan Feedback:</strong> 
                        <p>${feedback.feedback}</p>
                    </div>
                    <div class="feedback-details">
                        <div class="feedback-detail-row">
                            <strong>NIM:</strong> ${feedback.nim}
                        </div>
                        <div class="feedback-detail-row">
                            <strong>Kelas:</strong> ${feedback.kelas}
                        </div>
                        <div class="feedback-detail-row">
                            <strong>Tanggal Submit:</strong> ${feedback.tanggal_submit}
                        </div>
                    </div>
                </div>
                <div class="feedback-footer">
                    <a href="${feedback.link_sertifikat}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="btn-secondary btn-sm">
                        Lihat Sertifikat
                    </a>
                </div>
            `;
            elements.feedbackList.appendChild(feedbackItem);
        });

        // Add CSS for feedback items if not already added
        if (!document.getElementById('feedback-styles')) {
            const feedbackStyles = document.createElement('style');
            feedbackStyles.id = 'feedback-styles';
            feedbackStyles.textContent = `
                .feedback-item {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .feedback-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }

                .feedback-title {
                    flex: 1;
                    min-width: 200px;
                }

                .feedback-title h3 {
                    margin: 0 0 5px 0;
                    font-size: 1.2rem;
                    color: #333;
                }

                .feedback-category {
                    display: inline-block;
                    background-color: #e0e0e0;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    color: #555;
                }

                .feedback-date {
                    font-size: 0.85rem;
                    color: #666;
                    margin-left: 10px;
                }

                .feedback-body {
                    margin-bottom: 15px;
                }

                .feedback-status {
                    margin-bottom: 10px;
                }

                .feedback-description {
                    margin-bottom: 15px;
                }

                .feedback-description p {
                    margin: 5px 0;
                    white-space: pre-line;
                }

                .feedback-details {
                    background-color: #f0f0f0;
                    padding: 10px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }

                .feedback-detail-row {
                    margin-bottom: 5px;
                }

                .feedback-footer {
                    display: flex;
                    justify-content: flex-end;
                }

                .btn-sm {
                    padding: 5px 10px;
                    font-size: 0.85rem;
                }
            `;
            document.head.appendChild(feedbackStyles);
        }
    } catch (error) {
        console.error("Error fetching feedback:", error);
        elements.noFeedbackMessage.textContent = 'Gagal memuat feedback';
        elements.noFeedbackMessage.style.display = 'block';
        showNotification("Gagal memuat feedback. Periksa koneksi atau URL sheet.", "error");
    }
}

// Fetch and Display Approved Certificates Function
async function fetchAndDisplayApprovedCertificates(nim) {
    try {
        const response = await fetch(approvedCertificatesSheetUrl);
        const text = await response.text();
        
        const jsonData = parseGoogleSheetsJSON(text);
        
        console.log('Raw Approved Certificates Data:', jsonData); // Debug log

        // Pastikan nim dikonversi ke string untuk pencocokan yang akurat
        const nimString = nim.toString();
        
        // Filter approved certificates untuk pengguna saat ini
        const userApprovedCertificates = jsonData.table.rows
            .filter(row => {
                // Debug: Log setiap baris untuk pemeriksaan
                console.log('Checking row:', row);
                
                // Pastikan kolom nim ada dan cocokkan
                return row.c[2] && row.c[2].v.toString() === nimString;
            })
            .map(row => ({
                kelas: row.c[0] ? row.c[0].v : 'Tidak diketahui',
                nama: row.c[1] ? row.c[1].v : 'Tidak diketahui',
                nim: row.c[2] ? row.c[2].v : null,
                kategoriLomba: row.c[3] ? row.c[3].v : 'Tidak ada kategori',
                deskripsiLomba: row.c[4] ? row.c[4].v : 'Tidak ada deskripsi',
                linkSertifikat: row.c[5] ? row.c[5].v : '#',
                tanggal: row.c[6] ? new Date(row.c[6].v).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia'
            }));

        console.log('Filtered Approved Certificates:', userApprovedCertificates); // Debug log
        
        // Kosongkan daftar sertifikat sebelumnya
        elements.approvedCertificatesList.innerHTML = '';
        
        if (userApprovedCertificates.length === 0) {
            elements.noApprovedCertificatesMessage.style.display = 'block';
            console.log('Tidak ada sertifikat disetujui untuk NIM:', nim);
            return;
        }
        
        elements.noApprovedCertificatesMessage.style.display = 'none';
        
        // Buat item sertifikat yang disetujui
        userApprovedCertificates.forEach(cert => {
            const certItem = document.createElement('div');
            certItem.classList.add('approved-certificate-item');
            certItem.innerHTML = `
                <div class="certificate-header">
                    <div>
                        <strong>Sertifikat:</strong> ${cert.deskripsiLomba}
                        <br>
                        <small>${cert.kategoriLomba}</small>
                    </div>
                    <span class="approval-date">${cert.tanggal}</span>
                </div>
                <div class="certificate-body">
                    <a href="${cert.linkSertifikat}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="btn-secondary">
                        Lihat Sertifikat
                    </a>
                </div>
            `;
            elements.approvedCertificatesList.appendChild(certItem);
        });
    } catch (error) {
        console.error("Error fetching approved certificates:", error);
        elements.noApprovedCertificatesMessage.textContent = 'Gagal memuat sertifikat disetujui';
        elements.noApprovedCertificatesMessage.style.display = 'block';
        showNotification("Gagal memuat sertifikat disetujui. Periksa koneksi atau URL sheet.", "error");
    }
}

    // View Feedback Button Handler
    elements.viewFeedbackBtn?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification('Silakan login terlebih dahulu', 'error');
            return;
        }

        // Hide dashboard, show feedback section
        elements.dashboard.classList.add('hidden');
        elements.feedbackSection.classList.remove('hidden');
        
        // Fetch and display feedback for current user
        fetchAndDisplayFeedback(currentUser.nim);
    });

    // Back to Dashboard from Feedback
    elements.backToFeedbackDashboard?.addEventListener('click', () => {
        elements.feedbackSection.classList.add('hidden');
        elements.dashboard.classList.remove('hidden');
    });

    // View Approved Certificates Button Handler
    elements.viewApprovedCertificatesBtn?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification('Silakan login terlebih dahulu', 'error');
            return;
        }

        // Hide dashboard, show approved certificates section
        elements.dashboard.classList.add('hidden');
        elements.approvedCertificatesSection.classList.remove('hidden');
        
        // Fetch and display approved certificates for current user
        fetchAndDisplayApprovedCertificates(currentUser.nim);
    });

    // Back to Dashboard from Approved Certificates
    elements.backToApprovedDashboard?.addEventListener('click', () => {
        elements.approvedCertificatesSection.classList.add('hidden');
        elements.dashboard.classList.remove('hidden');
    });

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
            
            // Show the deadline and PIN Baraya reminder popup
            showDeadlineAndPinReminder(calculateDeadlineDays());
        } else {
            showNotification("NIM atau password salah", "error");
        }
    });
  
    // Back Button Handler
    elements.backBtn?.addEventListener("click", () => {
        elements.certSubmissionForm.classList.add("hidden");
        elements.dashboard.classList.remove("hidden");
        document.getElementById("cert-form").reset();
    });
  
    // Certificate Submission Handler
    // Certificate Submission Handler with Enhanced Protection
const certForm = document.getElementById("cert-form");
certForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.submissionError.textContent = "";

    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const certificateLink = document.getElementById("certificate-link").value;

    // Check if all fields are filled
    if (!category || !description || !certificateLink) {
        elements.submissionError.textContent = "Mohon isi semua field dengan benar!";
        showNotification("Mohon lengkapi semua field!", "error");
        return;
    }

    // Check if link is from Google Drive
    const googleDriveRegex = /https:\/\/(drive\.google\.com|docs\.google\.com)/i;
    if (!googleDriveRegex.test(certificateLink)) {
        elements.submissionError.textContent = "Link sertifikat harus dari Google Drive!";
        showNotification("Gunakan link Google Drive untuk sertifikat", "error");
        return;
    }

    // Check if certificate already exists in approved or feedback
    try {
        // Check in approved certificates
        const approvedResponse = await fetch(approvedCertificatesSheetUrl);
        const approvedText = await approvedResponse.text();
        const approvedData = parseGoogleSheetsJSON(approvedText);
        
        // Check in feedback (for rejected certificates)
        const feedbackResponse = await fetch(feedbackSheetUrl);
        const feedbackText = await feedbackResponse.text();
        const feedbackData = parseGoogleSheetsJSON(feedbackText);
        
        // Check for duplicate link in approved certificates
        const isDuplicateInApproved = approvedData.table.rows.some(row => 
            row.c[5] && // Link column
            row.c[5].v === certificateLink && 
            row.c[2] && // NIM column
            row.c[2].v.toString() === currentUser.nim.toString()
        );
        
        // Check for duplicate link in feedback
        const isDuplicateInFeedback = feedbackData.table.rows.some(row => 
            row.c[8] && // Link column
            row.c[8].v === certificateLink && 
            row.c[0] && // NIM column
            row.c[0].v.toString() === currentUser.nim.toString()
        );
        
        if (isDuplicateInApproved) {
            elements.submissionError.textContent = "Sertifikat ini sudah pernah disetujui!";
            showNotification("Sertifikat sudah disetujui sebelumnya", "error");
            return;
        }
        
        if (isDuplicateInFeedback) {
            elements.submissionError.textContent = "Sertifikat ini sudah pernah diberikan feedback!";
            showNotification("Sertifikat sudah pernah diajukan", "error");
            return;
        }
        
    } catch (error) {
        console.error("Error checking for duplicate certificates:", error);
        // Continue with submission if check fails - fail open is better than blocking valid submissions
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
  
    // Maintenance Overlay Handling
    const maintenanceOverlay = document.getElementById('maintenance-overlay');
  
    function handleMaintenanceLogout() {
        // Reset all states
        elements.loginPage.classList.remove("hidden");
        elements.dashboard.classList.add("hidden");
        elements.certSubmissionForm.classList.add("hidden");
        elements.feedbackSection.classList.add("hidden");
        elements.approvedCertificatesSection.classList.add("hidden");
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
    function showDeadlineAndPinReminder(daysRemaining) {
        // Create popup container if it doesn't exist
        let reminderPopup = document.getElementById('reminder-popup');
        
        if (!reminderPopup) {
            reminderPopup = document.createElement('div');
            reminderPopup.id = 'reminder-popup';
            reminderPopup.className = 'reminder-popup';
            document.body.appendChild(reminderPopup);
            
            // Create the popup content
            const popupHTML = `
                <div class="reminder-content">
                    <div class="reminder-header">
                        <h3>Pengumuman Penting</h3>
                        <button type="button" class="reminder-close" aria-label="Tutup pengumuman">&times;</button>
                    </div>
                    <div class="reminder-body">
                        <div class="reminder-item deadline-reminder">
                            <div class="reminder-icon">⏱️</div>
                            <div class="reminder-text">
                                <strong id="deadline-text">Deadline pengumpulan sertifikat: ${daysRemaining} hari lagi</strong>
                                <p>Pastikan Anda mengumpulkan semua sertifikat sebelum batas waktu</p>
                            </div>
                        </div>
                        <div class="reminder-item pin-reminder">
                            <div class="reminder-icon">🔐</div>
                            <div class="reminder-text">
                                <strong>Gunakan PIN Baraya</strong>
                                <p>Selalu gunakan PIN Baraya saat ada kegiatan di kampus</p>
                            </div>
                        </div>
                    </div>
                    <div class="reminder-footer">
                        <button type="button" class="btn-secondary reminder-dismiss">Saya Mengerti</button>
                    </div>
                </div>
            `;
            
            reminderPopup.innerHTML = popupHTML;
            
            // Add event listeners for close buttons
            const closeBtn = reminderPopup.querySelector('.reminder-close');
            const dismissBtn = reminderPopup.querySelector('.reminder-dismiss');
            
            closeBtn.addEventListener('click', () => {
                reminderPopup.classList.remove('show');
            });
            
            dismissBtn.addEventListener('click', () => {
                reminderPopup.classList.remove('show');
            });
            
            // Add style for the popup if not already in CSS
            if (!document.getElementById('reminder-popup-styles')) {
                const popupStyles = document.createElement('style');
                popupStyles.id = 'reminder-popup-styles';
                popupStyles.textContent = `
                    .reminder-popup {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.3s, visibility 0.3s;
                    }
                    
                    .reminder-popup.show {
                        opacity: 1;
                        visibility: visible;
                    }
                    
                    .reminder-content {
                        background-color: white;
                        border-radius: 8px;
                        max-width: 500px;
                        width: 90%;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        overflow: hidden;
                    }
                    
                    .reminder-header {
                        background-color: #f8f9fa;
                        padding: 15px 20px;
                        border-bottom: 1px solid #e9ecef;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .reminder-header h3 {
                        margin: 0;
                        font-size: 1.25rem;
                        color: #212529;
                    }
                    
                    .reminder-close {
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #6c757d;
                    }
                    
                    .reminder-body {
                        padding: 20px;
                    }
                    
                    .reminder-item {
                        display: flex;
                        margin-bottom: 15px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid #e9ecef;
                    }
                    
                    .reminder-item:last-child {
                        margin-bottom: 0;
                        padding-bottom: 0;
                        border-bottom: none;
                    }
                    
                    .reminder-icon {
                        font-size: 2rem;
                        margin-right: 15px;
                        display: flex;
                        align-items: center;
                    }
                    
                    .reminder-text {
                        flex: 1;
                    }
                    
                    .reminder-text strong {
                        display: block;
                        margin-bottom: 5px;
                        font-size: 1.1rem;
                    }
                    
                    .reminder-text p {
                        margin: 0;
                        color: #6c757d;
                    }
                    
                    .deadline-reminder .reminder-icon {
                        color: #dc3545;
                    }
                    
                    .pin-reminder .reminder-icon {
                        color: #198754;
                    }
                    
                    .reminder-footer {
                        padding: 15px 20px;
                        background-color: #f8f9fa;
                        text-align: right;
                        border-top: 1px solid #e9ecef;
                    }
                    
                    .reminder-dismiss {
                        cursor: pointer;
                    }
                    
                    @media (max-width: 576px) {
                        .reminder-content {
                            width: 95%;
                        }
                        
                        .reminder-text strong {
                            font-size: 1rem;
                        }
                        
                        .reminder-text p {
                            font-size: 0.9rem;
                        }
                    }
                `;
                document.head.appendChild(popupStyles);
            }
        } else {
            // Update deadline text if popup already exists
            const deadlineText = reminderPopup.querySelector('#deadline-text');
            if (deadlineText) {
                if (daysRemaining > 0) {
                    deadlineText.textContent = `Deadline pengumpulan sertifikat: ${daysRemaining} hari lagi`;
                } else if (daysRemaining === 0) {
                    deadlineText.textContent = `Deadline pengumpulan sertifikat: HARI INI!`;
                } else {
                    deadlineText.textContent = `Deadline pengumpulan sertifikat telah terlewati!`;
                }
            }
        }
        
        // Only show if not already shown in this session
            setTimeout(() => {
                reminderPopup.classList.add('show');
            }, 500);
        }
  
    // Initial setup
    debugLog('Script initialization complete');
});
