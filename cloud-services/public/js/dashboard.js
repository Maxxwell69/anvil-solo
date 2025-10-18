// Dashboard JavaScript
const API_BASE = '/api';
let currentUser = null;
let authToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        window.location.href = '/login';
        return;
    }

    await loadUser();
    await loadDashboardData();
    setupEventListeners();
});

// Load current user
async function loadUser() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        const data = await response.json();
        currentUser = data.user;

        // Update UI
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('userEmail').textContent = currentUser.email;
        
        // Settings
        document.getElementById('settingsEmail').value = currentUser.email;
        document.getElementById('settingsUsername').value = currentUser.username;
        document.getElementById('settingsFullName').value = currentUser.fullName || '';
        document.getElementById('settingsWallet').value = currentUser.walletAddress || '';

    } catch (error) {
        console.error('Load user error:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    }
}

// Load dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadLicenses(),
        loadDownloads(),
        loadSyncStatus(),
    ]);
}

// Load licenses
async function loadLicenses() {
    try {
        // For now, show placeholder - will connect to actual license endpoint later
        let licenses = [];
        
        // Try to get user's licenses if endpoint exists
        try {
            const response = await fetch(`${API_BASE}/admin/licenses`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.licenses) {
                    // Filter to current user's email
                    licenses = data.licenses.filter(l => l.email === currentUser.email);
                }
            }
        } catch (err) {
            // Endpoint might not be available, show empty state
            console.log('Could not load licenses:', err);
        }

        document.getElementById('licensesCount').textContent = licenses.length;
        
        const licensesList = document.getElementById('licensesList');
        licensesList.innerHTML = '';

        if (licenses.length === 0) {
            licensesList.innerHTML = `
                <div class="text-center py-12 bg-gray-50 rounded-lg">
                    <i class="fas fa-key text-gray-300 text-5xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No Licenses Yet</h3>
                    <p class="text-gray-500 mb-4">Purchase a license to get started with Anvil Solo</p>
                    <a href="/#pricing" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
                        View Plans
                    </a>
                </div>
            `;
            return;
        }

        licenses.forEach(license => {
            const statusColor = license.status === 'active' ? 'green' : 'gray';
            const expiryText = license.expires_at 
                ? new Date(license.expires_at).toLocaleDateString()
                : 'Lifetime';

            licensesList.innerHTML += `
                <div class="border rounded-lg p-6 bg-white shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">${license.tier.toUpperCase()} License</h3>
                            <p class="text-sm text-gray-600 font-mono">${license.license_key}</p>
                        </div>
                        <span class="px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-sm font-semibold">
                            ${license.status}
                        </span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Issued:</span>
                            <span class="font-semibold">${new Date(license.issued_at).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Expires:</span>
                            <span class="font-semibold">${expiryText}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Devices:</span>
                            <span class="font-semibold">${license.device_count || 0}/${license.max_devices || 1}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Validations:</span>
                            <span class="font-semibold">${license.validation_count || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        // Update tier badge
        if (licenses.length > 0) {
            const highestTier = licenses[0].tier.toUpperCase();
            document.getElementById('tierBadge').textContent = highestTier;
        }

    } catch (error) {
        console.error('Load licenses error:', error);
        document.getElementById('licensesList').innerHTML = `
            <div class="text-center text-red-600 py-8">
                <i class="fas fa-exclamation-circle text-3xl mb-4"></i>
                <p>Failed to load licenses</p>
            </div>
        `;
    }
}

// Load downloads
async function loadDownloads() {
    try {
        // Load available files
        const filesResponse = await fetch(`${API_BASE}/downloads/list`);
        const filesData = await filesResponse.json();

        const downloadsList = document.getElementById('downloadsList');
        downloadsList.innerHTML = '';

        // Always show download links (GitHub releases)
const availableDownloads = [
    {
        id: 'windows-installer',
        displayName: 'Anvil Solo - Windows Installer',
        description: 'Professional installer with license system and data preservation',
        version: '3.7.0',
        size: 88635462,
        platform: 'windows',
        downloadUrl: 'https://github.com/Maxxwell69/anvil-solo/releases/download/v3.7.0/Anvil-Solo-Setup-3.7.0.exe'
    }
];

        availableDownloads.forEach(file => {
            const sizeInMB = (file.size / 1000000).toFixed(0);
            const platformIcon = file.platform === 'windows' ? 'fa-windows' : 
                                file.platform === 'mac' ? 'fa-apple' : 'fa-linux';

            downloadsList.innerHTML += `
                <div class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-lg transition">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <i class="fab ${platformIcon} text-2xl text-purple-600 mr-3"></i>
                                <h3 class="text-xl font-bold text-gray-800">${file.displayName}</h3>
                            </div>
                            <p class="text-gray-600 mb-2">${file.description}</p>
                            <div class="flex gap-4 text-sm text-gray-500">
                                <span><i class="fas fa-tag mr-1"></i>Version ${file.version}</span>
                                <span><i class="fas fa-hdd mr-1"></i>${sizeInMB} MB</span>
                                <span><i class="fas fa-check-circle mr-1 text-green-600"></i>Free Download</span>
                            </div>
                        </div>
                        <a href="${file.downloadUrl}" 
                           download
                           class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center no-underline">
                            <i class="fas fa-download mr-2"></i>Download
                        </a>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <p class="text-sm text-gray-600 mb-2">
                            <i class="fas fa-info-circle mr-2 text-blue-500"></i>
                            <strong>Installation:</strong> Run the installer and follow the setup wizard
                        </p>
                        <p class="text-sm text-gray-500">
                            <i class="fas fa-check-circle mr-2 text-green-600"></i>
                            Creates desktop shortcut, Start Menu entry, and uninstaller automatically
                        </p>
                        <p class="text-sm text-gray-500 mt-2">
                            <i class="fas fa-shield-alt mr-2"></i>
                            Enter your license key when the app opens to unlock features
                        </p>
                    </div>
                </div>
            `;
        });

        // Still check if backend files exist too
        if (filesData.files && filesData.files.length > 0) {
            filesData.files.forEach(file => {
                const sizeInMB = file.size ? (file.size / 1000000).toFixed(0) : '~150';
                const platformIcon = file.platform === 'windows' ? 'fa-windows' : 
                                    file.platform === 'mac' ? 'fa-apple' : 'fa-linux';

                downloadsList.innerHTML += `
                    <div class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-lg transition">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <i class="fab ${platformIcon} text-2xl text-purple-600 mr-3"></i>
                                    <h3 class="text-xl font-bold text-gray-800">${file.displayName}</h3>
                                </div>
                                <p class="text-gray-600 mb-2">${file.description}</p>
                                <div class="flex gap-4 text-sm text-gray-500">
                                    <span><i class="fas fa-tag mr-1"></i>Version ${file.version}</span>
                                    <span><i class="fas fa-hdd mr-1"></i>${sizeInMB} MB</span>
                                    <span><i class="fas fa-shield-alt mr-1"></i>${file.requiresLicense ? 'License Required' : 'Free'}</span>
                                </div>
                            </div>
                            <button onclick="downloadFile('${file.id}', '${file.name}')" 
                                    class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center">
                                <i class="fas fa-download mr-2"></i>Download
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        if (downloadsList.innerHTML === '') {
                downloadsList.innerHTML = `
                    <div class="text-center py-12 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-dashed border-purple-300">
                        <i class="fas fa-cloud-upload-alt text-purple-300 text-6xl mb-4"></i>
                        <h3 class="text-2xl font-bold text-gray-800 mb-3">No Files Available Yet</h3>
                        <p class="text-gray-600 mb-4 max-w-lg mx-auto">
                            The installer hasn't been uploaded yet. Build and deploy it to make it available for download.
                        </p>
                        <div class="bg-white rounded-lg p-6 max-w-2xl mx-auto mt-6 text-left">
                            <h4 class="font-bold text-lg mb-3 text-purple-600">
                                <i class="fas fa-terminal mr-2"></i>To Add Downloads:
                            </h4>
                            <div class="space-y-3 text-sm">
                                <div class="flex items-start gap-3">
                                    <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                                    <div>
                                        <strong>Build installer:</strong>
                                        <code class="block bg-gray-100 p-2 rounded mt-1 text-xs">cd anvil-solo && BUILD-INSTALLER.bat</code>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                                    <div>
                                        <strong>Copy to downloads:</strong>
                                        <code class="block bg-gray-100 p-2 rounded mt-1 text-xs">COPY-TO-DOWNLOADS.bat</code>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                                    <div>
                                        <strong>Deploy to Railway:</strong>
                                        <code class="block bg-gray-100 p-2 rounded mt-1 text-xs">cd cloud-services && git push</code>
                                    </div>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-4 italic">
                                <i class="fas fa-info-circle mr-1"></i>
                                Check INSTALLER-READY.md for complete instructions
                            </p>
                        </div>
                    </div>
                `;
            }

        // Load download history
        try {
            const historyResponse = await fetch(`${API_BASE}/downloads/history`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                document.getElementById('downloadsCount').textContent = historyData.downloads.length;

            const historyList = document.getElementById('downloadHistory');
            historyList.innerHTML = '';

            if (historyData.downloads.length > 0) {
                historyData.downloads.slice(0, 10).forEach(download => {
                    const statusColor = download.status === 'completed' ? 'green' : 
                                      download.status === 'failed' ? 'red' : 'gray';

                    historyList.innerHTML += `
                        <div class="border rounded-lg p-4 bg-white shadow-sm">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h4 class="font-semibold text-gray-800">${download.file_name}</h4>
                                    <p class="text-sm text-gray-600">${new Date(download.started_at).toLocaleString()}</p>
                                </div>
                                <span class="px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-sm">
                                    ${download.status}
                                </span>
                            </div>
                        </div>
                    `;
                });
            } else {
                historyList.innerHTML = '<p class="text-gray-500 text-center py-4">No download history</p>';
            }
            } else {
                document.getElementById('downloadsCount').textContent = '0';
                document.getElementById('downloadHistory').innerHTML = '<p class="text-gray-500 text-center py-4">No download history</p>';
            }
        } catch (histErr) {
            console.log('Download history not available yet');
            document.getElementById('downloadsCount').textContent = '0';
        }

    } catch (error) {
        console.error('Load downloads error:', error);
    }
}

// Load sync status
async function loadSyncStatus() {
    try {
        const response = await fetch(`${API_BASE}/sync/status`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        
        document.getElementById('syncCount').textContent = data.status.totalItems;

        const syncStatus = document.getElementById('syncStatus');
        syncStatus.innerHTML = '';

        syncStatus.innerHTML = `
            <div class="bg-white border rounded-lg p-6">
                <h3 class="font-bold text-lg mb-4">Sync Status</h3>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Total Synced Items:</span>
                        <span class="font-semibold">${data.status.totalItems}</span>
                    </div>
                </div>
            </div>

            <div class="bg-white border rounded-lg p-6 mt-4">
                <h3 class="font-bold text-lg mb-4">Data by Type</h3>
                <div class="space-y-3">
                    ${Object.entries(data.status.dataByType).map(([type, info]) => `
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span class="font-semibold capitalize">${type}</span>
                            <div class="text-right">
                                <div class="font-semibold">${info.count} items</div>
                                ${info.lastSynced ? `<div class="text-xs text-gray-500">Last: ${new Date(info.lastSynced).toLocaleString()}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Load sync status error:', error);
    }
}

// Request download
async function requestDownload(fileName) {
    try {
        const response = await fetch(`${API_BASE}/downloads/request/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        const data = await response.json();

        if (data.success) {
            alert(`Download link generated!\n\nExpires: ${new Date(data.expiresAt).toLocaleString()}\n\nRedirecting to download...`);
            window.open(data.downloadUrl, '_blank');
            await loadDownloads(); // Refresh download history
        } else {
            alert(`Failed to generate download link: ${data.error}`);
        }
    } catch (error) {
        console.error('Request download error:', error);
        alert('Failed to request download. Please try again.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update buttons
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('border-purple-600', 'text-purple-600');
                b.classList.add('text-gray-600');
            });
            btn.classList.add('border-purple-600', 'text-purple-600');
            btn.classList.remove('text-gray-600');

            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`${tab}Tab`).classList.remove('hidden');
        });
    });

    // Refresh licenses
    document.getElementById('refreshLicenses').addEventListener('click', loadLicenses);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    });

    // Update profile
    document.getElementById('updateProfileBtn').addEventListener('click', async () => {
        const fullName = document.getElementById('settingsFullName').value;
        const walletAddress = document.getElementById('settingsWallet').value;

        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fullName, walletAddress }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Profile updated successfully!');
                await loadUser();
            } else {
                alert(`Failed to update profile: ${data.error}`);
            }
        } catch (error) {
            console.error('Update profile error:', error);
            alert('Failed to update profile. Please try again.');
        }
    });

    // Change password
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match!');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Password changed successfully!');
                document.getElementById('changePasswordForm').reset();
            } else {
                alert(`Failed to change password: ${data.error}`);
            }
        } catch (error) {
            console.error('Change password error:', error);
            alert('Failed to change password. Please try again.');
        }
    });
}

// Download file directly
async function downloadFile(fileId, fileName) {
    try {
        // Direct download link
        const downloadUrl = `${API_BASE}/downloads/${fileId}`;
        
        // Open download in new window
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        setTimeout(() => {
            alert(`Download started!\n\nFile: ${fileName}\n\nCheck your downloads folder.`);
        }, 500);
        
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to start download. Please try again.');
    }
}

// Make functions global
window.requestDownload = requestDownload;
window.downloadFile = downloadFile;

