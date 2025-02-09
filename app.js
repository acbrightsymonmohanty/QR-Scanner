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
            // Show generate view by default
            handleLoginSuccess('generate');
        } else {
            // Login existing user
            await auth.signInWithEmailAndPassword(email, password);
            // Show success message
            showToast('Welcome back! 👋', 'success');
            // Show generate view by default
            handleLoginSuccess('generate');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showToast(getErrorMessage(error.code), 'error');
    }
});

// Add toast message function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type} show`;
    
    // Choose icon based on type
    let icon;
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'info':
            icon = 'fa-info-circle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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

// Update the initScanner function
function initScanner() {
    // Stop any existing scanner
    if (currentScanner) {
        currentScanner.stop();
    }

    const preview = document.getElementById('preview');
    currentScanner = new Instascan.Scanner({
        video: preview,
        mirror: false,
        continuous: true,
        captureImage: true,
        scanPeriod: 5,
        backgroundScan: true,
        refractoryPeriod: 5000,
        willReadFrequently: true
    });

    // Add scan event listener
    currentScanner.addListener('scan', handleScanResult);

    let cameras = [];
    let currentCameraIndex = 0;

    // Start camera with better error handling
    Instascan.Camera.getCameras()
        .then(availableCameras => {
            cameras = availableCameras;
            if (cameras.length > 0) {
                // Try to find back camera first
                const backCamera = cameras.find(camera => 
                    camera.name.toLowerCase().includes('back') || 
                    camera.name.toLowerCase().includes('environment')
                );
                currentCameraIndex = backCamera ? cameras.indexOf(backCamera) : 0;
                return currentScanner.start(cameras[currentCameraIndex]);
            } else {
                throw new Error('No cameras found');
            }
        })
        .catch(error => {
            console.error('Error starting camera:', error);
            alert('Error accessing camera. Please make sure camera permissions are granted.');
        });

    // Handle gallery selection
    const galleryBtn = document.querySelector('.control-btn:nth-child(1)');
    const flashBtn = document.querySelector('.control-btn:nth-child(2)');
    const switchBtn = document.querySelector('.control-btn:nth-child(3)');
    const galleryInput = document.getElementById('gallery-input');

    // Gallery button functionality
    galleryBtn.addEventListener('click', () => {
        galleryInput.click();
    });

    // Flash button functionality
    let isFlashOn = false;
    flashBtn.addEventListener('click', async () => {
        try {
            if (!preview.srcObject) return;
            const track = preview.srcObject.getVideoTracks()[0];
            const capabilities = await track.getCapabilities();
            
            if (capabilities.torch) {
                isFlashOn = !isFlashOn;
                await track.applyConstraints({
                    advanced: [{ torch: isFlashOn }]
                });
                flashBtn.innerHTML = isFlashOn ? 
                    '<i class="fas fa-bolt" style="color: var(--primary-color)"></i>' : 
                    '<i class="fas fa-bolt"></i>';
            } else {
                alert('Your device does not support flash');
            }
        } catch (err) {
            console.error('Error toggling flash:', err);
            alert('Error toggling flash');
        }
    });

    // Camera switch button functionality
    switchBtn.addEventListener('click', () => {
        if (cameras.length > 1) {
            currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
            currentScanner.stop();
            currentScanner.start(cameras[currentCameraIndex])
                .then(() => {
                    // Update video style based on camera type
                    const isBackCamera = cameras[currentCameraIndex].name.toLowerCase().includes('back') ||
                                      cameras[currentCameraIndex].name.toLowerCase().includes('environment');
                    preview.style.transform = isBackCamera ? 'scaleX(-1)' : 'scaleX(1)';
                })
                .catch(err => {
                    console.error('Error switching camera:', err);
                    alert('Error switching camera');
                });
        } else {
            alert('Only one camera is available');
        }
    });

    // Add gallery input handler
    galleryInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleGalleryImage(file);
        }
        // Clear input value to allow selecting the same file again
        e.target.value = '';
    });

    // Add close button functionality
    const closeBtn = document.querySelector('.close-scanner-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // Stop the scanner
            cleanupScanner();
            
            // Hide scanner view
            document.getElementById('scanner-view').classList.add('hidden');
            
            // Show scanner container
            document.getElementById('scanner-container').classList.remove('hidden');
            
            // Update active nav button
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === 'history') {
                    btn.classList.add('active');
                }
            });
        });
    }
}

// Add this helper function for handling gallery images
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
                    // Stop scanner temporarily
                    if (currentScanner) {
                        currentScanner.stop();
                    }
                    // Handle the QR code result
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
                <div class="asset-header">
                    <button class="back-btn">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Asset Details</h2>
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

// Update showVerificationConfirm function with improved navigation
function showVerificationConfirm(assetCode) {
    const comments = document.getElementById('verification-comments').value;
    const modal = document.createElement('div');
    modal.className = 'modal verification-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirm Verification</h3>
            <p>Are you sure you want to verify this asset?</p>
            <div class="location-info">
                <i class="fas fa-map-marker-alt"></i>
                <span id="location-text">Getting location...</span>
            </div>
            <div class="modal-buttons">
                <button class="secondary-btn" onclick="this.closest('.modal').remove()">No</button>
                <button class="primary-btn" id="confirm-verify">Yes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Get location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationText = modal.querySelector('#location-text');
                const location = `${position.coords.latitude}, ${position.coords.longitude}`;
                locationText.textContent = location;

                // Add confirm button functionality
                modal.querySelector('#confirm-verify').addEventListener('click', () => {
                    const user = auth.currentUser;
                    if (user) {
                        // Save verification to Firebase
                        const verificationData = {
                            assetCode: assetCode,
                            timestamp: Date.now(),
                            comments: comments,
                            location: location,
                            userEmail: user.email,
                            verified: true
                        };

                        database.ref(`verifications/${user.uid}`).push(verificationData)
                            .then(() => {
                                // Remove modal and asset page
                                modal.remove();
                                document.querySelector('.asset-page').remove();
                                
                                // Show success message
                                showSuccessMessage('Asset verified successfully');
                                
                                // Show history view and update list
                                document.getElementById('scanner-container').classList.remove('hidden');
                                document.querySelectorAll('.nav-btn').forEach(btn => {
                                    btn.classList.remove('active');
                                    if (btn.dataset.view === 'history') {
                                        btn.classList.add('active');
                                    }
                                });
                                populateHistory();
                            })
                            .catch(error => {
                                console.error('Error saving verification:', error);
                                alert('Error saving verification');
                            });
                    }
                });
            },
            (error) => {
                console.error('Error getting location:', error);
                modal.querySelector('.location-info').innerHTML = 
                    '<i class="fas fa-exclamation-circle"></i> Location unavailable';
            }
        );
    }
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
    // Handle bottom navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            // Remove active class from all nav buttons
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Handle view switching
            if (view === 'generate') {
                // Show generate view
                document.getElementById('scanner-view').classList.add('hidden');
                document.getElementById('scanner-container').classList.add('hidden');
                document.getElementById('generate-view').classList.remove('hidden');
                cleanupScanner();
            } else if (view === 'history') {
                // Show history view
                document.getElementById('scanner-view').classList.add('hidden');
                document.getElementById('generate-view').classList.add('hidden');
                document.getElementById('scanner-container').classList.remove('hidden');
                cleanupScanner();
                populateHistory();
            }
        });
    });

    // Handle center button (scanner)
    document.querySelectorAll('.center-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all nav buttons
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            btn.classList.add('active');
            
            // Hide all views
            document.getElementById('scanner-container').classList.add('hidden');
            document.getElementById('generate-view').classList.add('hidden');
            
            // Show scanner view and start scanner
            document.getElementById('scanner-view').classList.remove('hidden');
            initScanner();
        });
    });
}

// Update tab functionality
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.textContent === 'Create') {
                // Show only generated QR codes
                showGeneratedHistory();
            } else {
                // Show only scanned QR codes
                showScannedHistory();
            }
        });
    });
}

// Function to show generated QR history
function showGeneratedHistory() {
    const historyList = document.querySelector('.history-list');
    const user = auth.currentUser;
    
    if (user) {
        database.ref('generated_qr/' + user.uid)
            .orderByChild('timestamp')
            .limitToLast(10)
            .once('value')
            .then((snapshot) => {
                const historyItems = [];
                snapshot.forEach((childSnapshot) => {
                    const item = childSnapshot.val();
                    historyItems.push({
                        id: childSnapshot.key,
                        type: 'generated',
                        content: item.content,
                        timestamp: item.timestamp
                    });
                });
                
                // Sort by timestamp (newest first)
                historyItems.sort((a, b) => b.timestamp - a.timestamp);
                
                // Update history list
                historyList.innerHTML = historyItems.length > 0 ? 
                    historyItems.map(item => createHistoryItem(item)).join('') :
                    '<div class="empty-state">No generated QR codes yet</div>';
                
                // Add delete functionality
                addDeleteHandlers();
            });
    }
}

// Function to show scanned QR history
function showScannedHistory() {
    const historyList = document.querySelector('.history-list');
    const user = auth.currentUser;
    
    if (user) {
        Promise.all([
            database.ref('scans/' + user.uid).orderByChild('timestamp').limitToLast(10).once('value'),
            database.ref('verifications/' + user.uid).orderByChild('timestamp').limitToLast(10).once('value')
        ]).then(([scansSnapshot, verificationsSnapshot]) => {
            const historyItems = [];
            
            // Add scans
            scansSnapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val();
                historyItems.push({
                    id: childSnapshot.key,
                    type: 'scan',
                    content: item.content,
                    timestamp: item.timestamp
                });
            });
            
            // Add verifications
            verificationsSnapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val();
                historyItems.push({
                    id: childSnapshot.key,
                    type: 'verification',
                    content: item.assetCode,
                    timestamp: item.timestamp,
                    comments: item.comments,
                    location: item.location
                });
            });
            
            // Sort by timestamp
            historyItems.sort((a, b) => b.timestamp - a.timestamp);
            
            // Update history list
            historyList.innerHTML = historyItems.length > 0 ? 
                historyItems.map(item => createHistoryItem(item)).join('') :
                '<div class="empty-state">No scanned QR codes yet</div>';
            
            // Add delete functionality
            addDeleteHandlers();
        });
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

// Update populateHistory function to include verifications
function populateHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = ''; // Clear existing items

    // Get all types of history items
    Promise.all([
        database.ref(`scans/${user.uid}`).once('value'),
        database.ref(`generated_qr/${user.uid}`).once('value'),
        database.ref(`verifications/${user.uid}`).once('value')
    ]).then(([scans, generated, verifications]) => {
        const historyItems = [];

        // Add scan items
        scans.forEach(child => {
            historyItems.push({
                id: child.key,
                type: 'scan',
                ...child.val()
            });
        });

        // Add generated QR items
        generated.forEach(child => {
            historyItems.push({
                id: child.key,
                type: 'generated',
                ...child.val()
            });
        });

        // Add verification items
        verifications.forEach(child => {
            historyItems.push({
                id: child.key,
                type: 'verification',
                ...child.val()
            });
        });

        // Sort by timestamp
        historyItems.sort((a, b) => b.timestamp - a.timestamp);

        // Render items
        historyList.innerHTML = historyItems.map(item => createHistoryItem(item)).join('');
    });
}

// Update createHistoryItem function
function createHistoryItem(item) {
    const date = new Date(item.timestamp).toLocaleString();
    let icon = 'fa-qrcode';
    let content = item.content || item.assetCode || 'Unknown content'; // Add fallback for content
    
    // Determine icon based on content type
    if (content.startsWith('AST/')) {
        icon = 'fa-box';
    } else if (content.startsWith('http')) {
        icon = 'fa-link';
    } else if (item.type === 'verification') {
        icon = 'fa-check-circle';
        content = item.assetCode || content;
    } else if (item.type === 'generated') {
        icon = 'fa-qrcode';
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
                <div class="history-title">${content}</div>
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
                    <div class="asset-header">
                        <button class="back-btn">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h2>Asset Details</h2>
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
        showToast('Please enter a URL or text', 'error');
        return;
    }

    const qrResult = document.getElementById('qr-result');
    const qrPreview = document.querySelector('.qr-preview');
    qrPreview.innerHTML = '';

    // Create QR code
    new QRCode(qrPreview, {
        text: input,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Show result with animation
    qrResult.classList.remove('hidden');
    setTimeout(() => qrResult.classList.add('show'), 10);

    // Save to history
    saveToHistory(input);
});

// Share functionality
document.getElementById('share-qr').addEventListener('click', async () => {
    const qrImage = document.querySelector('.qr-preview img');
    if (!qrImage) return;

    try {
        // Convert QR code to blob
        const blob = await (await fetch(qrImage.src)).blob();
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        
        // Check if Web Share API is available
        if (navigator.share) {
            await navigator.share({
                files: [file],
                title: 'QR Code',
                text: 'Check out this QR code!'
            });
            showToast('QR code shared successfully', 'success');
        } else {
            // Fallback for browsers that don't support Web Share API
            const shareUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = shareUrl;
            a.download = 'qrcode.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(shareUrl);
            showToast('QR code downloaded (sharing not supported)', 'info');
        }
    } catch (err) {
        console.error('Error sharing:', err);
        showToast('Failed to share QR code', 'error');
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

// Generate view close button functionality
document.getElementById('generate-close').addEventListener('click', () => {
    // Hide generate view
    document.getElementById('generate-view').classList.add('hidden');
    
    // Show scanner container and ensure it's visible
    const scannerContainer = document.getElementById('scanner-container');
    scannerContainer.classList.remove('hidden');
    scannerContainer.style.display = 'block';
    
    // Reset generate form
    document.getElementById('qr-input').value = '';
    document.getElementById('qr-result').classList.add('hidden');
    const qrPreview = document.querySelector('.qr-preview');
    if (qrPreview) {
        qrPreview.innerHTML = '';
    }
    
    // Update navigation state
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

// Add this to your app.js file
function showAssetDetails() {
    // Hide all other containers
    document.querySelectorAll('.container').forEach(container => {
        container.classList.add('hidden');
    });
    
    // Show asset details view
    const assetDetailsView = document.getElementById('asset-details-view');
    assetDetailsView.classList.remove('hidden');
}

// Add click handler for back button
document.querySelector('.back-btn').addEventListener('click', () => {
    document.getElementById('asset-details-view').classList.add('hidden');
    // Show previous view (e.g., scanner or history view)
    document.getElementById('scanner-container').classList.remove('hidden');
});

// Add collapsible functionality to cards
document.querySelectorAll('.card-header').forEach(header => {
    header.addEventListener('click', () => {
        const card = header.closest('.details-card');
        card.classList.toggle('collapsed');
    });
});

// Function to show full-size image
function showFullImage(imageDiv) {
    const imgSrc = imageDiv.querySelector('img').src;
    const viewer = document.getElementById('image-viewer');
    const fullImage = document.getElementById('full-image');
    
    fullImage.src = imgSrc;
    viewer.classList.remove('hidden');
    
    // Close on click outside
    viewer.onclick = (e) => {
        if (e.target === viewer) {
            viewer.classList.add('hidden');
        }
    };
}

// Function to download document
function downloadDocument(documentPath) {
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = documentPath;
    link.download = documentPath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to show verification confirmation
function showVerificationConfirm() {
    const modal = document.getElementById('verification-modal');
    modal.classList.remove('hidden');
    
    // Get current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationSpan = document.getElementById('current-location');
                locationSpan.textContent = `${position.coords.latitude}, ${position.coords.longitude}`;
            },
            (error) => {
                console.error('Error getting location:', error);
                document.getElementById('current-location').textContent = 'Location unavailable';
            }
        );
    }
}

// Function to close verification modal
function closeVerificationModal() {
    document.getElementById('verification-modal').classList.add('hidden');
}

// Function to confirm verification
function confirmVerification() {
    const comment = document.getElementById('verification-comment').value;
    const locationText = document.getElementById('current-location').textContent;
    const user = firebase.auth().currentUser;
    const assetCode = document.querySelector('[data-field="code"]')?.textContent || 'AST/24-25/0026';
    
    if (user) {
        // Create verification data
        const verificationData = {
            assetCode: assetCode,
            userEmail: user.email,
            timestamp: Date.now(),
            comments: comment || 'No comments', // Store empty comment as 'No comments'
            location: locationText,
            verified: true
        };

        // Save to Firebase
        firebase.database().ref(`verifications/${user.uid}`).push(verificationData)
            .then(() => {
                // Show success toast
                showToast('Asset verified successfully', 'success');
                
                // Close verification modal
                closeVerificationModal();
                
                // Return to home page (scanner container)
                document.querySelectorAll('.container').forEach(container => {
                    container.classList.add('hidden');
                });
                document.getElementById('scanner-container').classList.remove('hidden');
                
                // Reset comment field
                document.getElementById('verification-comment').value = '';
                
                // Update history if needed
                if (typeof populateHistory === 'function') {
                    populateHistory();
                }
            })
            .catch((error) => {
                console.error('Error saving verification:', error);
                showToast('Failed to verify asset', 'error');
            });
    } else {
        showToast('Please login to verify assets', 'error');
    }
}

// Add this CSS to your styles.css file 

// Add navigation functionality
document.querySelectorAll('#generate-view .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        
        // Hide all containers
        document.querySelectorAll('.container').forEach(container => {
            container.classList.add('hidden');
        });
        
        // Show selected view
        if (view === 'generate') {
            document.getElementById('generate-view').classList.remove('hidden');
        } else if (view === 'history') {
            document.getElementById('scanner-container').classList.remove('hidden');
        }
        
        // Update active state
        document.querySelectorAll('.nav-btn').forEach(navBtn => {
            navBtn.classList.remove('active');
        });
        btn.classList.add('active');
    });
});

// Add paste functionality
document.getElementById('paste-btn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('qr-input').value = text;
    } catch (err) {
        console.error('Failed to read clipboard:', err);
    }
});

// Gallery QR Code scanning functionality
document.querySelector('.control-btn i.fa-image').parentElement.addEventListener('click', () => {
    const galleryInput = document.getElementById('gallery-input');
    galleryInput.click();
});

document.getElementById('gallery-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Create an image element to load the selected file
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
            img.onload = () => {
                // Create a canvas to draw the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size to match image
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0);
                
                // Get image data for QR code detection
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Create a temporary container for the QR code
                const tempContainer = document.createElement('div');
                const qrCode = new QRCode(tempContainer, {
                    text: "temp",
                    width: canvas.width,
                    height: canvas.height
                });
                
                // Attempt to decode QR code
                try {
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        // QR code found
                        handleQRCodeResult(code.data);
                        showToast('QR Code detected successfully', 'success');
                    } else {
                        showToast('No QR code found in image', 'error');
                    }
                } catch (error) {
                    console.error('QR Code scanning error:', error);
                    showToast('Failed to scan QR code', 'error');
                }
                
                // Clean up
                URL.revokeObjectURL(img.src);
                resolve();
            };
        });
    } catch (error) {
        console.error('Error processing image:', error);
        showToast('Error processing image', 'error');
    }
});

// Function to handle QR code result
function handleQRCodeResult(result) {
    // Check if result is a URL
    try {
        new URL(result);
        // If it's a URL, navigate to asset details
        navigateToAssetDetails(result);
    } catch {
        // If it's not a URL, show the result
        showToast('Scanned content: ' + result, 'success');
    }
}

// Function to navigate to asset details
function navigateToAssetDetails(url) {
    // Hide scanner view
    document.getElementById('scanner-view').classList.add('hidden');
    
    // Show asset details view
    const assetDetailsView = document.getElementById('asset-details-view');
    assetDetailsView.classList.remove('hidden');
    
    // Load asset details using the URL
    loadAssetDetails(url);
}

// Function to handle login success
function handleLoginSuccess() {
    // Hide auth container
    document.getElementById('auth-container').classList.add('hidden');
    
    // Hide all views first
    document.querySelectorAll('.container').forEach(container => {
        container.classList.add('hidden');
    });

    // Show generate view by default
    document.getElementById('generate-view').classList.remove('hidden');
    
    // Update active state in bottom navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.querySelector('i.fa-qrcode')) {
            btn.classList.add('active');
        }
    });

    // Update center button state if needed
    const centerBtn = document.querySelector('.center-btn');
    if (centerBtn) {
        centerBtn.classList.remove('active');
    }
}

// Update dashboard information
function updateDashboard() {
    // Update current date
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString(undefined, options);

    // Update user name
    const userName = document.querySelector('.user-name');
    const user = auth.currentUser;
    if (user) {
        userName.textContent = user.email.split('@')[0];
    }

    // Load recent activities
    loadRecentActivities();
}

// Load recent activities
function loadRecentActivities() {
    const activityList = document.querySelector('.activity-list');
    // Example data - replace with actual data from your backend
    const activities = [
        { title: 'Scanned Asset AST/24-25/0026', time: '2 hours ago', type: 'scan' },
        { title: 'Generated QR Code', time: '5 hours ago', type: 'generate' },
        { title: 'Verified Asset AST/24-25/0025', time: 'Yesterday', type: 'verify' }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-item-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-item-details">
                <div class="activity-item-title">${activity.title}</div>
                <div class="activity-item-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// Helper function to get activity icon
function getActivityIcon(type) {
    switch(type) {
        case 'scan': return 'fa-qrcode';
        case 'generate': return 'fa-plus';
        case 'verify': return 'fa-check-circle';
        default: return 'fa-circle';
    }
}

// Navigation functions
function openScanner() {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('scanner-view').classList.remove('hidden');
}

function openGenerator() {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('generate-view').classList.remove('hidden');
}

function openHistory() {
    // Implement history view navigation
}

// Update the navigation handler
function handleNavigation(view) {
    // Hide all containers
    document.querySelectorAll('.container').forEach(container => {
        container.classList.add('hidden');
    });
    
    // Show selected view
    document.getElementById(`${view}-view`).classList.remove('hidden');
    
    // Update active states in navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
} 
