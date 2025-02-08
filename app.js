// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDw9HQswypCzRANvVUtv0sI_Q1lCyAVqTg",
    authDomain: "test-7b81d.firebaseapp.com",
    databaseURL: "https://test-7b81d-default-rtdb.firebaseio.com",
    projectId: "test-7b81d",
    storageBucket: "test-7b81d.firebasestorage.app",
    messagingSenderId: "82945864994",
    appId: "1:82945864994:web:cf682a9bf70ca981a7e17b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const authForm = document.getElementById('auth-form');
const authContainer = document.getElementById('auth-container');
const otpContainer = document.getElementById('otp-container');
const welcomeContainer = document.getElementById('welcome-container');
const scannerContainer = document.getElementById('scanner-container');
const otpInputs = document.querySelectorAll('.otp-input');
const verifyOtpBtn = document.getElementById('verify-otp');
const letsStartBtn = document.getElementById('lets-start');

// Update auth state handling
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        document.body.classList.remove('auth-active');
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('welcome-container').classList.add('hidden');
        document.getElementById('scanner-container').classList.remove('hidden');
        
        // Initialize the app
        initNavigation();
        initTabs();
        initMenu();
        populateHistory();
    } else {
        // No user is signed in
        document.body.classList.add('auth-active');
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('welcome-container').classList.add('hidden');
        document.getElementById('scanner-container').classList.add('hidden');
    }
});

// Update showWelcomeScreen function
function showWelcomeScreen() {
    document.body.classList.remove('auth-active');
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('otpContainer').classList.add('hidden');
    document.getElementById('welcome-container').classList.remove('hidden');
}

// Update initAuthTabs function
function initAuthTabs() {
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForm = document.getElementById('auth-form');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update form based on selected tab
            const isLogin = tab.dataset.tab === 'login';
            authForm.querySelector('button').textContent = isLogin ? 'Login' : 'Register';
            
            // Update form action
            authForm.dataset.action = tab.dataset.tab;
            
            // Ensure auth-active class is applied
            document.body.classList.add('auth-active');
        });
    });
}

// Update auth form submit handler with messages
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const action = authForm.dataset.action || 'login';
    
    try {
        if (action === 'register') {
            // Register new user
            await auth.createUserWithEmailAndPassword(email, password);
            // Save user data
            const user = auth.currentUser;
            await database.ref('users/' + user.uid).set({
                email: email,
                createdAt: Date.now()
            });
            // Show success message
            showToast('Registration successful! Welcome aboard! 🎉', 'success');
            // Show scanner container directly
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('scanner-container').classList.remove('hidden');
        } else {
            // Login existing user
            await auth.signInWithEmailAndPassword(email, password);
            // Show success message
            showToast('Welcome back! 👋', 'success');
            // Show scanner container directly
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('scanner-container').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Auth error:', error);
        // Show error message
        showToast(getErrorMessage(error.code), 'error');
    }
});

// Add toast message function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

// Add function to get user-friendly error messages
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        default:
            return 'An error occurred. Please try again.';
    }
}

// OTP input handling
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });
    
    // Allow backspace to go to previous input
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

verifyOtpBtn.addEventListener('click', async () => {
    const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');
    
    if (enteredOTP === window.mockOTP) {
        try {
            const email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                throw new Error('Email not found in storage');
            }
            
            // Sign in the user
            await auth.signInWithEmailAndPassword(email, 'tempPassword');
            
            // Save user data to database
            const user = auth.currentUser;
            await database.ref('users/' + user.uid).set({
                email: email,
                lastLogin: Date.now()
            });
            
            showWelcomeScreen();
            
        } catch (error) {
            console.error(error);
            alert('Error during login: ' + error.message);
        }
    } else {
        alert('Invalid OTP');
    }
});

letsStartBtn.addEventListener('click', () => {
    welcomeContainer.classList.add('hidden');
    scannerContainer.classList.remove('hidden');
    initScanner();
});

// Add this variable to track the current scanner instance
let currentScanner = null;

// Add camera control functionality
function initCameraControls() {
    const galleryBtn = document.querySelector('.control-btn:nth-child(1)');
    const flashBtn = document.querySelector('.control-btn:nth-child(2)');
    const switchCameraBtn = document.querySelector('.control-btn:nth-child(3)');
    const galleryInput = document.getElementById('gallery-input');

    // Gallery button
    galleryBtn.addEventListener('click', () => {
        galleryInput.click();
    });

    // Flash button
    let isFlashOn = false;
    flashBtn.addEventListener('click', async () => {
        try {
            const track = currentScanner?.stream?.getVideoTracks()[0];
            if (track?.getCapabilities()?.torch) {
                isFlashOn = !isFlashOn;
                await track.applyConstraints({
                    advanced: [{ torch: isFlashOn }]
                });
                flashBtn.innerHTML = isFlashOn ? 
                    '<i class="fas fa-bolt" style="color: var(--primary-color);"></i>' : 
                    '<i class="fas fa-bolt"></i>';
            }
        } catch (err) {
            console.error('Flash not available:', err);
        }
    });

    // Switch camera button
    let currentCameraIndex = 0;
    switchCameraBtn.addEventListener('click', async () => {
        try {
            const cameras = await Instascan.Camera.getCameras();
            if (cameras.length > 1) {
                currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
                if (currentScanner) {
                    await currentScanner.stop();
                    await currentScanner.start(cameras[currentCameraIndex]);
                }
            }
        } catch (err) {
            console.error('Error switching camera:', err);
        }
    });

    // Gallery input change handler
    galleryInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleGalleryImage(file);
        }
        // Reset input
        e.target.value = '';
    });
}

// Update initScanner function
function initScanner() {
    const scannerView = document.getElementById('scanner-view');
    
    // Add navigation bar if it doesn't exist
    if (!scannerView.querySelector('.top-nav')) {
        const nav = document.createElement('div');
        nav.className = 'top-nav';
        nav.innerHTML = `
            <div class="nav-left">
                <button class="back-btn" onclick="closeScanner()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h1>Scan QR</h1>
            </div>
        `;
        scannerView.insertBefore(nav, scannerView.firstChild);
    }

    // Initialize camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false 
        })
        .then(function(stream) {
            const preview = document.getElementById('preview');
            preview.srcObject = stream;
            preview.play();

            currentScanner = new Instascan.Scanner({
                video: preview,
                mirror: false,
                continuous: true,
                captureImage: true,
                scanPeriod: 5
            });

            currentScanner.addListener('scan', handleScanResult);
            currentScanner.start();

            // Initialize camera controls after scanner is ready
            initCameraControls();
        })
        .catch(function(error) {
            console.error('Camera access error:', error);
            alert('Error accessing camera. Please make sure camera permissions are granted.');
            closeScanner();
        });
    }
}

// Add handleGalleryImage function
function handleGalleryImage(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            
            try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    handleScanResult(code.data);
                } else {
                    alert('No QR code found in the image');
                }
            } catch (error) {
                console.error('Error scanning QR code:', error);
                alert('Error scanning QR code from image');
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Function to read QR code from image
async function readQRFromImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const context = canvas.getContext('2d', {
                        willReadFrequently: true
                    });
                    context.drawImage(img, 0, 0, img.width, img.height);
                    
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        resolve(code.data);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Update handleScanResult function
function handleScanResult(content) {
    const user = auth.currentUser;
    if (user) {
        database.ref('scans/' + user.uid).push({
            content: content,
            timestamp: Date.now()
        }).then((ref) => {
            database.ref(`scans/${user.uid}/${ref.key}`).once('value')
                .then((snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        showScanDetails(data);
                    }
                });
        });
    }
}

// Update showScanDetails function
function showScanDetails(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Scan Result</h3>
            <div class="scan-result-container">
                <div class="scan-info">
                    <p class="scan-content">${data.content}</p>
                    <p class="scan-date">
                        <i class="fas fa-clock"></i>
                        ${new Date(data.timestamp).toLocaleString()}
                    </p>
                </div>
                ${data.content.startsWith('http') ? `
                    <div class="scan-url">
                        <i class="fas fa-link"></i>
                        <a href="${data.content}" target="_blank">${data.content}</a>
                    </div>
                ` : ''}
            </div>
            <div class="modal-buttons">
                ${data.content.startsWith('http') ? 
                    `<button class="primary-btn" onclick="window.open('${data.content}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Open Link
                    </button>` : 
                    data.content.startsWith('AST/') ?
                    `<button class="primary-btn" onclick="showAssetDetails('${data.content}'); this.closest('.modal').remove();">
                        <i class="fas fa-info-circle"></i> View Asset
                    </button>` :
                    `<button class="primary-btn" onclick="copyToClipboard('${data.content}')">
                        <i class="fas fa-copy"></i> Copy Text
                    </button>`
                }
                <button class="secondary-btn" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Update history after showing scan details
    populateHistory();
}

// Update showAssetDetails function
function showAssetDetails(assetCode) {
    const assetPage = document.createElement('div');
    assetPage.className = 'container asset-page';
    
    // Get verification history for this asset
    const user = auth.currentUser;
    database.ref(`verifications/${user.uid}`)
        .orderByChild('assetCode')
        .equalTo(assetCode)
        .once('value')
        .then((snapshot) => {
            const verifications = [];
            snapshot.forEach(child => {
                verifications.push({
                    ...child.val(),
                    id: child.key
                });
            });

            assetPage.innerHTML = `
                <div class="top-nav">
                    <div class="nav-left">
                        <button class="back-btn">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h1>Asset Details</h1>
                    </div>
                </div>

                <div class="asset-content">
                    <div class="section">
                        <h3 class="section-title">Asset Information</h3>
                        <div class="detail-items">
                            <div class="detail-item">
                                <span class="label">Asset Code</span>
                                <span class="value">${assetCode}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Status</span>
                                <span class="value">Active</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Location</span>
                                <span class="value">Main Warehouse</span>
                            </div>
                        </div>
                    </div>

                    ${verifications.length > 0 ? `
                        <div class="section">
                            <h3 class="section-title">Verification History</h3>
                            <div class="verification-history">
                                ${verifications.map(v => `
                                    <div class="verification-item">
                                        <div class="verification-header">
                                            <i class="fas fa-check-circle"></i>
                                            <span class="verification-date">
                                                ${new Date(v.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div class="verification-details">
                                            <div class="verification-comment">
                                                ${v.comments || 'No comments'}
                                            </div>
                                            <div class="verification-location">
                                                <i class="fas fa-map-marker-alt"></i>
                                                ${v.location || 'Location not available'}
                                            </div>
                                            <div class="verification-user">
                                                <i class="fas fa-user"></i>
                                                ${v.userEmail}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="section verification-section">
                        <h3 class="section-title">Verify Asset</h3>
                        <div class="verification-form">
                            <div class="input-group">
                                <label class="input-label">Comments</label>
                                <textarea id="verification-comments" placeholder="Enter your comments about this asset..."></textarea>
                            </div>
                            <button id="verify-btn" class="primary-btn">
                                <i class="fas fa-check-circle"></i> Verify Asset
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add back button functionality
            assetPage.querySelector('.back-btn').addEventListener('click', () => {
                assetPage.remove();
                document.getElementById('scanner-container').classList.remove('hidden');
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.view === 'history') {
                        btn.classList.add('active');
                    }
                });
            });

            // Add verify button functionality
            assetPage.querySelector('#verify-btn').addEventListener('click', () => {
                showVerificationConfirm(assetCode);
            });

            // Hide other views and show asset page
            document.getElementById('scanner-view').classList.add('hidden');
            document.getElementById('scanner-container').classList.add('hidden');
            document.getElementById('generate-view').classList.add('hidden');
            document.body.appendChild(assetPage);
        });
}

// Update showVerificationConfirm function
function showVerificationConfirm(assetCode) {
    const comments = document.getElementById('verification-comments').value;
    const user = auth.currentUser;
    
    // Add verification to database
    database.ref(`verifications/${user.uid}`).push({
        assetCode: assetCode,
        comments: comments,
        timestamp: Date.now(),
        userEmail: user.email,
        verified: true // Add verified status
    }).then(() => {
        // Update scans to mark as verified
        database.ref(`scans/${user.uid}`)
            .orderByChild('content')
            .equalTo(assetCode)
            .once('value')
            .then((snapshot) => {
                snapshot.forEach((child) => {
                    child.ref.update({ verified: true });
                });
                
                // Close asset details page and refresh history
                document.querySelector('.asset-page').remove();
                document.getElementById('scanner-container').classList.remove('hidden');
                populateHistory();
            });
    }).catch(error => {
        console.error('Error saving verification:', error);
    });
}

// Add success message function
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

// Function to show full asset details
function showFullAssetDetails(assetData) {
    const data = JSON.parse(assetData);
    const detailsModal = document.createElement('div');
    detailsModal.className = 'modal asset-modal';
    
    detailsModal.innerHTML = `
        <div class="modal-content asset-modal-content">
            <h3>Asset Details</h3>
            <div class="asset-full-details">
                <div class="asset-info">
                    <h4>Basic Information</h4>
                    <p><strong>Name:</strong> ${data.assetDetails.name || 'Na'}</p>
                    <p><strong>Code:</strong> ${data.assetDetails.code || 'Na'}</p>
                    <p><strong>MFG Date:</strong> ${data.assetDetails.mfgDate || 'Na'}</p>
                    <p><strong>Purchase Date:</strong> ${data.assetDetails.purchaseDate || 'Na'}</p>
                </div>
                
                ${data.assetImages ? `
                    <div class="asset-images-section">
                        <h4>Asset Images</h4>
                        <div class="asset-images-grid">
                            ${data.assetImages.map(img => `
                                <div class="asset-image">
                                    <img src="${img}" alt="Asset Image">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${data.assetDocuments ? `
                    <div class="asset-documents-section">
                        <h4>Documents</h4>
                        <div class="documents-list">
                            ${data.assetDocuments.map((doc, index) => `
                                <div class="document-item">
                                    <i class="fas fa-file-pdf"></i>
                                    <span>Document ${index + 1}</span>
                                    <a href="${doc}" download class="download-btn">
                                        <i class="fas fa-download"></i>
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            <button class="modal-close" onclick="this.closest('.asset-modal').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(detailsModal);
}

// Update Open Link button functionality
document.getElementById('open-btn').addEventListener('click', () => {
    const btn = document.getElementById('open-btn');
    const type = btn.dataset.type;
    const content = btn.dataset.content || btn.dataset.url;

    switch(type) {
        case 'url':
            window.open(content, '_blank');
            break;
        case 'asset':
            showAssetDetails(content);
            document.getElementById('result-modal').classList.add('hidden');
            break;
        case 'text':
            // Copy text to clipboard
            navigator.clipboard.writeText(content)
                .then(() => {
                    showSuccessMessage('Text copied to clipboard');
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    alert('Failed to copy text');
                });
            break;
    }
});

// Update showGenerateView function
function showGenerateView() {
    // Stop camera if running
    cleanupScanner();
    
    // Hide other views
    document.getElementById('scanner-view').classList.add('hidden');
    document.getElementById('scanner-container').classList.add('hidden');
    document.getElementById('generate-view').classList.remove('hidden');
}

// Update showHistoryView function
function showHistoryView() {
    // Stop camera if running
    cleanupScanner();
    
    // Hide other views
    document.getElementById('scanner-view').classList.add('hidden');
    document.getElementById('generate-view').classList.add('hidden');
    document.getElementById('scanner-container').classList.remove('hidden');
    
    // Update history list
    populateHistory();
}

// Update initNavigation function
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const centerBtn = document.querySelector('.center-btn');
    
    // Handle regular nav buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            if (view === 'generate') {
                document.getElementById('scanner-container').classList.add('hidden');
                document.getElementById('scanner-view').classList.add('hidden');
                document.getElementById('generate-view').classList.remove('hidden');
                cleanupScanner();
            } else if (view === 'history') {
                document.getElementById('scanner-container').classList.remove('hidden');
                document.getElementById('scanner-view').classList.add('hidden');
                document.getElementById('generate-view').classList.add('hidden');
                cleanupScanner();
                populateHistory();
            }
        });
    });

    // Handle center scan button
    if (centerBtn) {
        centerBtn.addEventListener('click', () => {
            // Remove active state from nav buttons
            navBtns.forEach(btn => btn.classList.remove('active'));
            
            // Hide other views
            document.getElementById('scanner-container').classList.add('hidden');
            document.getElementById('generate-view').classList.add('hidden');
            
            // Show and initialize scanner
            document.getElementById('scanner-view').classList.remove('hidden');
            initScanner();
        });
    }
}

// Update tab functionality
function initTabs() {
    const tabContainer = document.querySelector('.tab-container');
    const tabs = tabContainer.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Update history based on selected tab
            if (tab.textContent.trim() === 'Scan') {
                showScannedHistory();
            } else if (tab.textContent.trim() === 'Create') {
                showGeneratedHistory();
            }
        });
    });
}

// Add function to show only scanned history
function showScannedHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';

    database.ref(`scans/${user.uid}`).once('value')
        .then((snapshot) => {
            const historyItems = [];
            snapshot.forEach(child => {
                historyItems.push({
                    id: child.key,
                    type: 'scan',
                    ...child.val()
                });
            });

            // Sort by timestamp
            historyItems.sort((a, b) => b.timestamp - a.timestamp);

            // Render items
            historyList.innerHTML = historyItems.map(item => createHistoryItem(item)).join('');
        });
}

// Add function to show only generated QR history
function showGeneratedHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';

    database.ref(`generated_qr/${user.uid}`).once('value')
        .then((snapshot) => {
            const historyItems = [];
            snapshot.forEach(child => {
                historyItems.push({
                    id: child.key,
                    type: 'generated',
                    ...child.val()
                });
            });

            // Sort by timestamp
            historyItems.sort((a, b) => b.timestamp - a.timestamp);

            // Render items
            historyList.innerHTML = historyItems.map(item => createHistoryItem(item)).join('');
        });
}

// Update populateHistory to show scanned history by default
function populateHistory() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        if (activeTab.textContent.trim() === 'Create') {
            showGeneratedHistory();
        } else {
            showScannedHistory();
        }
    } else {
        showScannedHistory(); // Default to scanned history
    }
}

// Make sure to initialize both navigation systems
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTabs();
    initAuthTabs();
    initMenu();
    populateHistory();
});

// Update cleanupScanner function
function cleanupScanner() {
    if (currentScanner) {
        try {
            currentScanner.stop();
            const video = document.getElementById('preview');
            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => {
                    track.stop();
                });
                video.srcObject = null;
            }
        } catch (error) {
            console.error('Error cleaning up scanner:', error);
        }
        currentScanner = null;
    }
}

// Add event listener for page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentScanner) {
        currentScanner.stop();
    } else if (!document.hidden && document.getElementById('scanner-view').classList.contains('hidden') === false) {
        initScanner();
    }
});

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanupScanner);

// Update createHistoryItem function
function createHistoryItem(item) {
    const date = new Date(item.timestamp).toLocaleString();
    let icon = 'fa-qrcode';
    let content = item.content || item.assetCode || 'Unknown content';
    let statusIcon = '';
    
    if (content.startsWith('AST/')) {
        icon = 'fa-box';
        // Add verification status icon
        if (item.verified) {
            statusIcon = '<i class="fas fa-check-circle" style="color: #2ed573; margin-left: 8px;"></i>';
        }
    } else if (content.startsWith('http')) {
        icon = 'fa-link';
    }

    return `
        <div class="history-item" 
            data-id="${item.id}" 
            data-type="${item.type || 'scan'}" 
            data-content="${content}"
            onclick="handleHistoryItemClick(this)">
            <div class="history-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="history-content">
                <div class="history-title">
                    ${content}
                    ${statusIcon}
                </div>
                <div class="history-subtitle">
                    <i class="fas fa-clock"></i>
                    <span>${date}</span>
                </div>
            </div>
            <button class="history-delete" onclick="handleDeleteClick(event, this)">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
}

// Update handleHistoryItemClick function
function handleHistoryItemClick(element) {
    const content = element.dataset.content;
    const type = element.dataset.type;
    const itemId = element.dataset.id;
    
    const user = auth.currentUser;
    if (!user) return;

    if (type === 'generated') {
        // Show generated QR code details
        database.ref(`generated_qr/${user.uid}/${itemId}`).once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    showGeneratedQRDetails(data);
                }
            });
    } else if (type === 'scan') {
        // Show scanned QR code details
        database.ref(`scans/${user.uid}/${itemId}`).once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    showScanDetails(data);
                }
            });
    } else if (content.startsWith('AST/')) {
        // Show asset details
        const assetPage = document.createElement('div');
        assetPage.className = 'container asset-page';
        
        database.ref(`verifications/${user.uid}`)
            .orderByChild('assetCode')
            .equalTo(content)
            .once('value')
            .then((snapshot) => {
                const verifications = [];
                snapshot.forEach(child => {
                    verifications.push({
                        ...child.val(),
                        id: child.key
                    });
                });

                assetPage.innerHTML = `
                    <div class="top-nav">
                        <div class="nav-left">
                            <button class="back-btn">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <h1>Asset Details</h1>
                        </div>
                    </div>

                    <div class="asset-content">
                        <div class="section">
                            <h3 class="section-title">Asset Information</h3>
                            <div class="detail-items">
                                <div class="detail-item">
                                    <span class="label">Asset Code</span>
                                    <span class="value">${content}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Status</span>
                                    <span class="value">Active</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Location</span>
                                    <span class="value">Main Warehouse</span>
                                </div>
                            </div>
                        </div>

                        ${verifications.length > 0 ? `
                            <div class="section">
                                <h3 class="section-title">Verification History</h3>
                                <div class="verification-history">
                                    ${verifications.map(v => `
                                        <div class="verification-item">
                                            <div class="verification-header">
                                                <i class="fas fa-check-circle"></i>
                                                <span class="verification-date">
                                                    ${new Date(v.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <div class="verification-details">
                                                <div class="verification-comment">
                                                    ${v.comments || 'No comments'}
                                                </div>
                                                <div class="verification-location">
                                                    <i class="fas fa-map-marker-alt"></i>
                                                    ${v.location || 'Location not available'}
                                                </div>
                                                <div class="verification-user">
                                                    <i class="fas fa-user"></i>
                                                    ${v.userEmail}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="section verification-section">
                            <h3 class="section-title">Verify Asset</h3>
                            <div class="verification-form">
                                <div class="input-group">
                                    <label class="input-label">Comments</label>
                                    <textarea id="verification-comments" placeholder="Enter your comments about this asset..."></textarea>
                                </div>
                                <button id="verify-btn" class="primary-btn">
                                    <i class="fas fa-check-circle"></i> Verify Asset
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                // Add back button functionality
                assetPage.querySelector('.back-btn').addEventListener('click', () => {
                    assetPage.remove();
                    document.getElementById('scanner-container').classList.remove('hidden');
                    document.querySelectorAll('.nav-btn').forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.view === 'history') {
                            btn.classList.add('active');
                        }
                    });
                });

                // Add verify button functionality
                assetPage.querySelector('#verify-btn').addEventListener('click', () => {
                    showVerificationConfirm(content);
                });

                // Hide other views and show asset page
                document.getElementById('scanner-view').classList.add('hidden');
                document.getElementById('scanner-container').classList.add('hidden');
                document.getElementById('generate-view').classList.add('hidden');
                document.body.appendChild(assetPage);
            });
    }
}

function handleDeleteClick(event, button) {
    event.stopPropagation();
    const historyItem = button.closest('.history-item');
    const itemId = historyItem.dataset.id;
    const itemType = historyItem.dataset.type;
    deleteHistoryItem(itemId, itemType);
}

// Update showGeneratedQRDetails function
function showGeneratedQRDetails(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Generated QR Code</h3>
            <div class="qr-details">
                <div class="qr-preview"></div>
                <p class="qr-content">${data.content}</p>
                <p class="qr-date">Generated on: ${new Date(data.timestamp).toLocaleString()}</p>
            </div>
            <div class="modal-buttons">
                <button class="primary-btn" onclick="downloadQRCode(this)">Download QR</button>
                <button class="secondary-btn" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Generate QR code in preview
    new QRCode(modal.querySelector('.qr-preview'), {
        text: data.content,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Helper function for copying text
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .catch(err => console.error('Failed to copy:', err));
}

// Update deleteHistoryItem function to handle all types of items
function deleteHistoryItem(itemId, itemType) {
    const user = auth.currentUser;
    if (user && itemId) {
        let path;
        switch(itemType) {
            case 'verification':
                path = 'verifications';
                break;
            case 'generated':
                path = 'generated_qr';
                break;
            default:
                path = 'scans';
        }

        database.ref(`${path}/${user.uid}/${itemId}`).remove()
            .then(() => {
                populateHistory();
            })
            .catch((error) => {
                console.error('Error deleting item:', error);
            });
    }
}

// Update QR code generation functionality
document.getElementById('generate-qr-btn').addEventListener('click', () => {
    const input = document.getElementById('qr-input').value.trim();
    if (!input) {
        alert('Please enter a URL or text');
        return;
    }

    // Add http:// if input is a URL without protocol
    let qrContent = input;
    if (input.includes('.') && !input.startsWith('http://') && !input.startsWith('https://')) {
        qrContent = 'https://' + input;
    }

    // Clear previous QR code
    const qrContainer = document.querySelector('.qr-preview');
    qrContainer.innerHTML = '';

    // Create QR code
    try {
        new QRCode(qrContainer, {
            text: qrContent,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Show QR result
        document.getElementById('qr-result').classList.remove('hidden');

        // Store in Firebase and update history
        const user = auth.currentUser;
        if (user) {
            database.ref('generated_qr/' + user.uid).push({
                content: qrContent,
                timestamp: Date.now(),
                type: 'generated'
            }).then(() => {
                populateHistory(); // Update history after generating QR
            });
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Error generating QR code');
    }
});

// Update download functionality
document.getElementById('download-qr').addEventListener('click', () => {
    const qrImage = document.querySelector('.qr-preview img');
    if (qrImage) {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = qrImage.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccessMessage('QR Code downloaded successfully');
    }
});

// Add generate view close button functionality
document.getElementById('generate-close').addEventListener('click', () => {
    // Clear input and hide QR result
    document.getElementById('qr-input').value = '';
    document.getElementById('qr-result').classList.add('hidden');
    document.querySelector('.qr-preview').innerHTML = '';
    
    // Show history view
    document.getElementById('generate-view').classList.add('hidden');
    document.getElementById('scanner-container').classList.remove('hidden');
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === 'history') {
            btn.classList.add('active');
        }
    });
});

// Copy button functionality
document.getElementById('copy-btn').addEventListener('click', async () => {
    const content = document.getElementById('scan-result').textContent;
    try {
        await navigator.clipboard.writeText(content);
        const copyBtn = document.getElementById('copy-btn');
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy text');
    }
});

// Close modal button
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('result-modal').classList.add('hidden');
    // Restart scanner if we're still in scanner view
    if (!document.getElementById('scanner-view').classList.contains('hidden')) {
        initScanner();
    }
});

// Close modal when clicking outside
document.querySelector('.modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        document.getElementById('result-modal').classList.add('hidden');
    }
});

// Update initMenu function
function initMenu() {
    const menuBtn = document.getElementById('menu-btn');
    
    menuBtn.addEventListener('click', () => {
        const user = auth.currentUser; // Get current user inside click handler
        
        // Remove existing dropdown if any
        const existingDropdown = document.querySelector('.menu-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Create new dropdown
        const menuDropdown = document.createElement('div');
        menuDropdown.className = 'menu-dropdown';
        menuDropdown.innerHTML = `
            <div class="user-email">
                <i class="fas fa-user"></i>
                ${user ? user.email : 'No user'}
            </div>
            <a href="#" class="menu-item" id="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </a>
        `;
        
        // Add dropdown to header
        const header = document.querySelector('.app-header');
        header.appendChild(menuDropdown);
        
        // Show dropdown
        setTimeout(() => {
            menuDropdown.classList.add('show');
        }, 10);
        
        // Add logout functionality
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.reload();
            }).catch(error => {
                console.error('Logout error:', error);
                alert('Error logging out');
            });
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#menu-btn') && !e.target.closest('.menu-dropdown')) {
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('show');
                setTimeout(() => menuDropdown.remove(), 300);
            }
        }
    });
}

function addDeleteHandlers() {
    const historyList = document.querySelector('.history-list');
    historyList.querySelectorAll('.history-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const historyItem = e.target.closest('.history-item');
            const itemId = historyItem.dataset.id;
            const itemType = historyItem.dataset.type;
            deleteHistoryItem(itemId, itemType);
        });
    });
}

// Add download QR code function
function downloadQRCode(button) {
    const qrImage = button.closest('.modal-content').querySelector('.qr-preview img');
    if (qrImage) {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = qrImage.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Update the history view HTML structure
function initHistoryView() {
    const historyView = document.getElementById('scanner-container');
    
    // Remove any existing top nav
    const existingNav = historyView.querySelector('.top-nav');
    if (existingNav) {
        existingNav.remove();
    }

    // Create new top nav
    const topNav = document.createElement('div');
    topNav.className = 'top-nav';
    topNav.innerHTML = `
        <h1>History</h1>
        <button class="menu-btn" id="menu-btn">
            <i class="fas fa-bars"></i>
        </button>
    `;
    
    // Insert the top nav at the beginning
    historyView.insertBefore(topNav, historyView.firstChild);

    // Add menu button functionality
    const menuBtn = topNav.querySelector('#menu-btn');
    menuBtn.addEventListener('click', () => {
        showMenu();
    });
}

// Call this function when the app initializes
document.addEventListener('DOMContentLoaded', () => {
    initHistoryView();
});

// Add showMenu function
function showMenu() {
    const menuDropdown = document.createElement('div');
    menuDropdown.className = 'menu-dropdown';
    menuDropdown.innerHTML = `
        <div class="menu-content">
            <div class="menu-header">
                <div class="user-info">
                    <i class="fas fa-user-circle"></i>
                    <span>${auth.currentUser.email}</span>
                </div>
            </div>
            <div class="menu-items">
                <button class="menu-item" id="logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(menuDropdown);
    
    // Add animation class after a small delay
    setTimeout(() => menuDropdown.classList.add('show'), 50);
    
    // Add logout functionality
    menuDropdown.querySelector('#logout-btn').addEventListener('click', () => {
        auth.signOut().then(() => {
            // Remove menu dropdown
            menuDropdown.remove();
            // Redirect to login
            window.location.reload();
        }).catch(error => {
            console.error('Logout error:', error);
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#menu-btn') && !e.target.closest('.menu-dropdown')) {
            menuDropdown.classList.remove('show');
            setTimeout(() => menuDropdown.remove(), 300);
        }
    });
}

// Update the QR code generation view
function initGenerateView() {
    const generateView = document.getElementById('generate-view');
    
    // Add navigation bar
    const nav = document.createElement('div');
    nav.className = 'top-nav';
    nav.innerHTML = `
        <div class="nav-left">
            <button class="back-btn" onclick="closeGenerateView()">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h1>Generate QR</h1>
        </div>
    `;
    
    // Insert nav at the beginning of generate view
    generateView.insertBefore(nav, generateView.firstChild);
}

// Add close function
function closeGenerateView() {
    document.getElementById('generate-view').classList.add('hidden');
    document.getElementById('scanner-container').classList.remove('hidden');
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === 'history') {
            btn.classList.add('active');
        }
    });
}

// Call this when initializing the app
document.addEventListener('DOMContentLoaded', () => {
    initGenerateView();
});

// Update closeScanner function
function closeScanner() {
    if (currentScanner) {
        currentScanner.stop();
        
        // Stop video stream
        const preview = document.getElementById('preview');
        if (preview.srcObject) {
            const tracks = preview.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            preview.srcObject = null;
        }
    }
    
    document.getElementById('scanner-view').classList.add('hidden');
    document.getElementById('scanner-container').classList.remove('hidden');
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === 'history') {
            btn.classList.add('active');
        }
    });
} 