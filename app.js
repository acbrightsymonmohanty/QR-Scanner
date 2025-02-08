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
        initHistoryItemClick();
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
    // Store scan in Firebase
    const user = auth.currentUser;
    if (user) {
        database.ref('scans/' + user.uid).push({
            content: content,
            timestamp: Date.now()
        });
    }

    // Show scan result modal
    const resultModal = document.getElementById('result-modal');
    const resultText = document.getElementById('scan-result');
    const openBtn = document.getElementById('open-btn');

    try {
        // Check if content is a URL
        if (content.startsWith('http://') || content.startsWith('https://')) {
            resultText.textContent = content;
            openBtn.textContent = 'Open Link';
            openBtn.dataset.type = 'url';
            openBtn.dataset.url = content;
        }
        // Check if content is an asset code
        else if (content.match(/^AST\/\d{2}-\d{2}\/\d{4}$/)) {
            resultText.textContent = content;
            openBtn.textContent = 'View Details';
            openBtn.dataset.type = 'asset';
            openBtn.dataset.content = content;
        }
        // Handle other types of content
        else {
            resultText.textContent = content;
            openBtn.textContent = 'Copy';
            openBtn.dataset.type = 'text';
            openBtn.dataset.content = content;
        }
    } catch (e) {
        // If any error, show content as plain text
        resultText.textContent = content;
        openBtn.textContent = 'Copy';
        openBtn.dataset.type = 'text';
        openBtn.dataset.content = content;
    }

    // Show the result modal
    resultModal.classList.remove('hidden');
    
    // Update history
    populateHistory();
}

// Function to show asset details page
function showAssetDetails(assetCode) {
    const assetPage = document.createElement('div');
    assetPage.className = 'container asset-page';
    
    assetPage.innerHTML = `
        <header class="app-header asset-header">
            <button class="back-btn">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>QR Code Data</h2>
        </header>

        <div class="asset-content">
            <div class="section">
                <h3 class="section-title">Asset Details</h3>
                <div class="detail-items">
                    <div class="detail-item">
                        <span class="label">Name</span>
                        <span class="value">Na</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Code</span>
                        <span class="value">${assetCode}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">MFG Date</span>
                        <span class="value">Na</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Purchase Date</span>
                        <span class="value">Na</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">Asset Images</h3>
                <div class="asset-images" id="assetImages">
                    <div class="image-item" onclick="showFullImage(this)">
                        <img src="path/to/image1.jpg" alt="Asset Image">
                    </div>
                    <div class="image-item" onclick="showFullImage(this)">
                        <img src="path/to/image2.jpg" alt="Asset Image">
                    </div>
                    <div class="image-item" onclick="showFullImage(this)">
                        <img src="path/to/image3.jpg" alt="Asset Image">
                    </div>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">Asset Documents</h3>
                <div class="documents-list">
                    <div class="document-item">
                        <div class="doc-info">
                            <i class="fas fa-file-pdf"></i>
                            <span class="doc-name">Document 1</span>
                        </div>
                        <a href="path/to/document1.pdf" download class="download-btn">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            </div>

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

    // Add image viewer functionality with fixed close button
    window.showFullImage = function(element) {
        const imgSrc = element.querySelector('img').src;
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        viewer.innerHTML = `
            <div class="viewer-content">
                <img src="${imgSrc}" alt="Full size image">
                <button class="close-viewer" onclick="closeImageViewer(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(viewer);

        // Close viewer on background click
        viewer.addEventListener('click', (e) => {
            if (e.target.classList.contains('image-viewer')) {
                closeImageViewer(viewer.querySelector('.close-viewer'));
            }
        });
    };

    // Add close viewer function to window scope
    window.closeImageViewer = function(closeBtn) {
        const viewer = closeBtn.closest('.image-viewer');
        if (viewer) {
            viewer.classList.add('fade-out');
            setTimeout(() => viewer.remove(), 300);
        }
    };

    // Add verification functionality
    const verifyBtn = assetPage.querySelector('#verify-btn');
    verifyBtn.addEventListener('click', () => {
        showVerificationConfirm(assetCode);
    });

    // Add back button functionality
    assetPage.querySelector('.back-btn').addEventListener('click', () => {
        assetPage.remove();
        document.getElementById('scanner-container').classList.remove('hidden');
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === 'history') {
                btn.classList.add('active');
            }
        });
    });

    // Hide scanner view and show asset page
    document.getElementById('scanner-view').classList.add('hidden');
    document.body.appendChild(assetPage);
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
    initHistoryItemClick();
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
    const historyList = document.querySelector('.history-list');
    const user = auth.currentUser;
    
    if (user) {
        // Get scans, verifications, and generated QR codes
        Promise.all([
            database.ref('scans/' + user.uid).orderByChild('timestamp').limitToLast(10).once('value'),
            database.ref('verifications/' + user.uid).orderByChild('timestamp').limitToLast(10).once('value'),
            database.ref('generated_qr/' + user.uid).orderByChild('timestamp').limitToLast(10).once('value')
        ]).then(([scansSnapshot, verificationsSnapshot, generatedSnapshot]) => {
            const historyItems = [];
            
            // Add all types of items to history
            [
                { snapshot: scansSnapshot, type: 'scan' },
                { snapshot: verificationsSnapshot, type: 'verification' },
                { snapshot: generatedSnapshot, type: 'generated' }
            ].forEach(({ snapshot, type }) => {
                snapshot.forEach((childSnapshot) => {
                    const item = childSnapshot.val();
                    historyItems.push({
                        id: childSnapshot.key,
                        type: type,
                        content: item.content || item.assetCode,
                        timestamp: item.timestamp,
                        comments: item.comments,
                        location: item.location
                    });
                });
            });
            
            // Sort by timestamp
            historyItems.sort((a, b) => b.timestamp - a.timestamp);
            
            // Update HTML
            historyList.innerHTML = historyItems.map(item => createHistoryItem(item)).join('');
            
            // Add delete functionality
            historyList.querySelectorAll('.history-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent item click event
                    const historyItem = e.target.closest('.history-item');
                    if (confirm('Are you sure you want to delete this item?')) {
                        const itemId = historyItem.dataset.id;
                        const itemType = historyItem.dataset.type;
                        deleteHistoryItem(itemId, itemType);
                    }
                });
            });
        });
    }
}

// Update createHistoryItem function
function createHistoryItem(item) {
    const date = new Date(item.timestamp).toLocaleString();
    let icon, extraContent = '';
    
    switch(item.type) {
        case 'verification':
            icon = 'fa-check-circle';
            extraContent = `
                <div class="verification-details">
                    <div class="verification-comment">${item.comments}</div>
                    <div class="verification-location">
                        <i class="fas fa-map-marker-alt"></i> ${item.location}
                    </div>
                </div>
            `;
            break;
        case 'generated':
            icon = 'fa-qrcode';
            break;
        default:
            icon = 'fa-scan';
    }

    return `
        <div class="history-item" data-id="${item.id}" data-type="${item.type}" data-content="${item.content}">
            <div class="history-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="history-content">
                <div class="history-title">${item.content}</div>
                <div class="history-subtitle">${date}</div>
                ${extraContent}
            </div>
            <button class="history-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
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
                showSuccessMessage('Item deleted successfully');
                populateHistory();
            })
            .catch((error) => {
                console.error('Error deleting item:', error);
                alert('Error deleting item');
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

// Add history item click handler
function initHistoryItemClick() {
    document.querySelector('.history-list').addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        if (historyItem && !e.target.closest('.history-delete')) {
            const content = historyItem.dataset.content;
            showAssetDetails(content);
        }
    });
}

function addDeleteHandlers() {
    const historyList = document.querySelector('.history-list');
    historyList.querySelectorAll('.history-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const historyItem = e.target.closest('.history-item');
            if (confirm('Are you sure you want to delete this item?')) {
                const itemId = historyItem.dataset.id;
                const itemType = historyItem.dataset.type;
                deleteHistoryItem(itemId, itemType);
            }
        });
    });
} 