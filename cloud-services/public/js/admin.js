// Admin Panel JavaScript
const API_BASE = '/api';
let currentAdmin = null;
let authToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        window.location.href = '/login';
        return;
    }

    await loadAdmin();
    await loadStats();
    await loadOverviewData();
    setupEventListeners();
});

// Load current admin user
async function loadAdmin() {
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
        currentAdmin = data.user;

        // Check admin role
        if (currentAdmin.role !== 'admin' && currentAdmin.role !== 'super_admin') {
            alert('Admin access required');
            window.location.href = '/dashboard';
            return;
        }

        document.getElementById('adminEmail').textContent = currentAdmin.email;

    } catch (error) {
        console.error('Load admin error:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const stats = data.stats;

        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalLicenses').textContent = stats.totalLicenses;
        document.getElementById('activeLicenses').textContent = stats.activeLicenses;
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;

    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// Load overview data
async function loadOverviewData() {
    await loadRecentActivity();
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_BASE}/admin/audit-logs?limit=10`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = '';

        if (data.logs.length === 0) {
            activityList.innerHTML = '<p class="text-gray-500">No recent activity</p>';
            return;
        }

        data.logs.forEach(log => {
            activityList.innerHTML += `
                <div class="text-gray-700 py-1 border-b">
                    <span class="font-semibold">${log.username || log.email}:</span> 
                    ${log.action} 
                    <span class="text-gray-500 text-xs">${new Date(log.created_at).toLocaleString()}</span>
                </div>
            `;
        });

    } catch (error) {
        console.error('Load recent activity error:', error);
    }
}

// Refresh users
async function refreshUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        data.users.forEach(user => {
            usersList.innerHTML += `
                <div class="border rounded-lg p-6 bg-white shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-gray-800">${user.username}</h3>
                            <p class="text-gray-600">${user.email}</p>
                            <p class="text-sm text-gray-500 mt-2">
                                Role: <span class="font-semibold">${user.role}</span> • 
                                Joined: ${new Date(user.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="flex space-x-2">
                            <span class="px-3 py-1 rounded-full text-sm ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button onclick="viewUser(${user.id})" class="text-purple-600 hover:text-purple-800">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Load users error:', error);
    }
}

// Refresh licenses
async function refreshLicenses() {
    try {
        const response = await fetch(`${API_BASE}/admin/licenses`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const licensesList = document.getElementById('licensesList');
        licensesList.innerHTML = '';

        if (data.licenses.length === 0) {
            licensesList.innerHTML = '<p class="text-gray-500 text-center py-8">No licenses found</p>';
            return;
        }

        data.licenses.forEach(license => {
            const statusColor = license.status === 'active' ? 'green' : 
                              license.status === 'expired' ? 'yellow' : 'red';

            licensesList.innerHTML += `
                <div class="border rounded-lg p-6 bg-white shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <h3 class="text-xl font-bold text-gray-800">${license.tier.toUpperCase()}</h3>
                                <span class="ml-3 px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-sm">
                                    ${license.status}
                                </span>
                            </div>
                            <p class="text-gray-600 font-mono text-sm mb-2">${license.license_key}</p>
                            <p class="text-gray-600">User: ${license.username || license.user_email || 'N/A'}</p>
                            <p class="text-sm text-gray-500 mt-2">
                                Issued: ${new Date(license.issued_at).toLocaleDateString()} • 
                                Expires: ${license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                            </p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editLicense('${license.license_key}')" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="revokeLicense('${license.license_key}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-ban"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Load licenses error:', error);
    }
}

// Load fee structures
async function loadFees() {
    try {
        const response = await fetch(`${API_BASE}/admin/fees`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const feesList = document.getElementById('feesList');
        feesList.innerHTML = '';

        if (data.fees.length === 0) {
            feesList.innerHTML = '<p class="text-gray-500 text-center py-8">No fee structures configured</p>';
            return;
        }

        data.fees.forEach(fee => {
            feesList.innerHTML += `
                <div class="border rounded-lg p-6 bg-white shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <h3 class="text-xl font-bold text-gray-800">${fee.name}</h3>
                                <span class="ml-3 px-3 py-1 ${fee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} rounded-full text-sm">
                                    ${fee.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p class="text-gray-600 mb-2">${fee.description || 'No description'}</p>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span class="text-gray-600">Type:</span>
                                    <span class="font-semibold">${fee.fee_type}</span>
                                </div>
                                <div>
                                    <span class="text-gray-600">Value:</span>
                                    <span class="font-semibold">${fee.fee_value}${fee.fee_type === 'percentage' ? '%' : ''}</span>
                                </div>
                                <div>
                                    <span class="text-gray-600">Applies To:</span>
                                    <span class="font-semibold">${fee.applies_to}</span>
                                </div>
                                <div>
                                    <span class="text-gray-600">Priority:</span>
                                    <span class="font-semibold">${fee.priority}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editFee(${fee.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="toggleFee(${fee.id}, ${!fee.is_active})" class="text-yellow-600 hover:text-yellow-800">
                                <i class="fas fa-${fee.is_active ? 'pause' : 'play'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Load fees error:', error);
    }
}

// Load settings
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/admin/settings`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const settingsList = document.getElementById('settingsList');
        settingsList.innerHTML = '';

        // Group by category
        const feeSettings = data.settings.filter(s => s.category === 'fees');
        const otherSettings = data.settings.filter(s => s.category !== 'fees');

        // Fee settings section
        if (feeSettings.length > 0) {
            settingsList.innerHTML += '<h3 class="text-xl font-bold text-gray-800 mb-4">Fee Configuration</h3>';
            
            feeSettings.forEach(setting => {
                const isDefaultFee = setting.setting_key === 'default_trade_fee_percentage';
                
                settingsList.innerHTML += `
                    <div class="border rounded-lg p-6 bg-white shadow-sm ${isDefaultFee ? 'border-purple-300 bg-purple-50' : ''}">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-gray-800">
                                    ${setting.description || setting.setting_key}
                                    ${isDefaultFee ? '<span class="text-xs bg-purple-600 text-white px-2 py-1 rounded ml-2">SYSTEM DEFAULT</span>' : ''}
                                </h3>
                                <p class="text-gray-600 text-sm mb-2">
                                    ${isDefaultFee ? 'This fee applies to all users unless overridden by tier or user settings.' : ''}
                                </p>
                                <div class="flex items-center mt-2">
                                    <p class="font-mono text-2xl font-bold text-purple-600">${setting.setting_value}${isDefaultFee ? '%' : ''}</p>
                                    <button onclick="editSetting('${setting.setting_key}', '${setting.setting_value}', '${setting.description}')" 
                                            class="ml-4 text-blue-600 hover:text-blue-800">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // Other settings
        if (otherSettings.length > 0) {
            settingsList.innerHTML += '<h3 class="text-xl font-bold text-gray-800 mb-4 mt-8">General Settings</h3>';
            
            otherSettings.forEach(setting => {
                settingsList.innerHTML += `
                    <div class="border rounded-lg p-6 bg-white shadow-sm">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-gray-800">${setting.setting_key}</h3>
                                <p class="text-gray-600 text-sm mb-2">${setting.description || 'No description'}</p>
                                <p class="font-mono text-sm bg-gray-100 p-2 rounded">${setting.setting_value}</p>
                            </div>
                            <button onclick="editSetting('${setting.setting_key}', '${setting.setting_value}', '${setting.description}')" 
                                    class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

    } catch (error) {
        console.error('Load settings error:', error);
    }
}

// Edit setting modal
function editSetting(key, currentValue, description) {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-bold mb-6">Edit Setting</h2>
            <form id="editSettingForm">
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Setting</label>
                    <input type="text" value="${key}" readonly class="w-full px-4 py-2 border rounded bg-gray-100">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Description</label>
                    <p class="text-gray-600">${description}</p>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Value</label>
                    <input type="text" id="settingValue" value="${currentValue}" class="w-full px-4 py-2 border rounded">
                    <p class="text-xs text-gray-500 mt-1">
                        ${key === 'default_trade_fee_percentage' ? 'Enter percentage (e.g., 0.5 for 0.5%)' : ''}
                    </p>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="hideModal()" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('editSettingForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const value = document.getElementById('settingValue').value;

        try {
            const response = await fetch(`${API_BASE}/admin/settings/${key}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ value }),
            });

            const result = await response.json();
            if (result.success) {
                alert('Setting updated successfully!');
                hideModal();
                await loadSettings();
            } else {
                alert(`Failed to update setting: ${result.error}`);
            }
        } catch (error) {
            console.error('Update setting error:', error);
            alert('Failed to update setting');
        }
    });

    showModal();
}

// Refresh audit log
async function refreshAuditLog() {
    try {
        const response = await fetch(`${API_BASE}/admin/audit-logs?limit=50`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const auditLogList = document.getElementById('auditLogList');
        auditLogList.innerHTML = '';

        if (data.logs.length === 0) {
            auditLogList.innerHTML = '<p class="text-gray-500 text-center py-8">No audit logs found</p>';
            return;
        }

        data.logs.forEach(log => {
            auditLogList.innerHTML += `
                <div class="border rounded p-4 bg-white shadow-sm text-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <span class="font-semibold">${log.username || log.email}</span>
                            <span class="text-gray-600 mx-2">•</span>
                            <span class="text-gray-700">${log.action}</span>
                            <span class="text-gray-600 mx-2">•</span>
                            <span class="text-gray-500">${log.resource_type}</span>
                        </div>
                        <span class="text-gray-500 text-xs whitespace-nowrap ml-4">
                            ${new Date(log.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Load audit log error:', error);
    }
}

// Show generate license modal
function showGenerateLicenseModal() {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-bold mb-6">Generate License</h2>
            <form id="generateLicenseForm">
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Email</label>
                    <input type="email" id="licenseEmail" required class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Tier</label>
                    <select id="licenseTier" required class="w-full px-4 py-2 border rounded">
                        <option value="free">Free - 1 DCA only</option>
                        <option value="tier1" selected>Tier 1 - 2 DCA + 1 Ratio + Cloud Sync ($29.99/mo)</option>
                        <option value="tier2">Tier 2 - 3 DCA + 3 Ratio + 3 Bundle ($59.99/mo)</option>
                        <option value="tier3">Tier 3 - Unlimited All ($99.99/mo)</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Duration (days)</label>
                    <input type="number" id="licenseDuration" value="365" class="w-full px-4 py-2 border rounded">
                    <p class="text-sm text-gray-500 mt-1">Leave empty for lifetime license</p>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Max Devices</label>
                    <input type="number" id="licenseMaxDevices" value="3" class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Notes</label>
                    <textarea id="licenseNotes" class="w-full px-4 py-2 border rounded" rows="3"></textarea>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="hideModal()" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Generate</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('generateLicenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            email: document.getElementById('licenseEmail').value,
            tier: document.getElementById('licenseTier').value,
            durationDays: parseInt(document.getElementById('licenseDuration').value) || null,
            maxDevices: parseInt(document.getElementById('licenseMaxDevices').value),
            notes: document.getElementById('licenseNotes').value || null,
        };

        try {
            const response = await fetch(`${API_BASE}/admin/licenses/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                alert(`License generated successfully!\n\nKey: ${result.license.licenseKey}`);
                hideModal();
                await refreshLicenses();
                await loadStats();
            } else {
                alert(`Failed to generate license: ${result.error}`);
            }
        } catch (error) {
            console.error('Generate license error:', error);
            alert('Failed to generate license');
        }
    });

    showModal();
}

// Show create user modal
function showCreateUserModal() {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-bold mb-6">Create New User</h2>
            <form id="createUserForm" autocomplete="off">
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Email</label>
                    <input type="email" id="userEmail" name="new-user-email" required 
                           autocomplete="off" 
                           placeholder="user@example.com"
                           class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Username</label>
                    <input type="text" id="userUsername" name="new-user-username" required 
                           autocomplete="off"
                           placeholder="username"
                           class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Password</label>
                    <input type="password" id="userPassword" name="new-user-password" required 
                           autocomplete="new-password"
                           placeholder="Minimum 8 characters"
                           class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Full Name (Optional)</label>
                    <input type="text" id="userFullName" name="new-user-fullname"
                           autocomplete="off"
                           placeholder="John Doe"
                           class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Role</label>
                    <select id="userRole" class="w-full px-4 py-2 border rounded">
                        <option value="user" selected>User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="hideModal()" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" id="createUserBtn" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                        Create User
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('createUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const submitBtn = document.getElementById('createUserBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        
        const data = {
            email: document.getElementById('userEmail').value,
            username: document.getElementById('userUsername').value,
            password: document.getElementById('userPassword').value,
            fullName: document.getElementById('userFullName').value || null,
            role: document.getElementById('userRole').value,
        };

        console.log('Creating user with data:', data);

        try {
            const response = await fetch(`${API_BASE}/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            console.log('Create user result:', result);

            if (result.success) {
                alert('User created successfully!\\n\\nEmail: ' + data.email + '\\nUsername: ' + data.username);
                hideModal();
                await refreshUsers();
                await loadStats();
            } else {
                alert(`Failed to create user: ${result.error}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create User';
            }
        } catch (error) {
            console.error('Create user error:', error);
            alert('Failed to create user. Check console for details.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create User';
        }
    });

    showModal();
}

// Show add fee modal
function showAddFeeModal() {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-bold mb-6">Add Fee Structure</h2>
            <form id="addFeeForm">
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Name</label>
                    <input type="text" id="feeName" required class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Description</label>
                    <textarea id="feeDescription" class="w-full px-4 py-2 border rounded" rows="2"></textarea>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Fee Type</label>
                    <select id="feeType" required class="w-full px-4 py-2 border rounded">
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="tiered">Tiered</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Fee Value</label>
                    <input type="number" step="0.01" id="feeValue" required class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Applies To</label>
                    <select id="feeAppliesTo" required class="w-full px-4 py-2 border rounded">
                        <option value="download">Download</option>
                        <option value="license">License Purchase</option>
                        <option value="renewal">License Renewal</option>
                        <option value="trade">Trade</option>
                        <option value="all">All</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Recipient Wallet</label>
                    <input type="text" id="feeWallet" required class="w-full px-4 py-2 border rounded">
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Priority</label>
                    <input type="number" id="feePriority" value="0" class="w-full px-4 py-2 border rounded">
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="hideModal()" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Add</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('addFeeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('feeName').value,
            description: document.getElementById('feeDescription').value,
            feeType: document.getElementById('feeType').value,
            feeValue: parseFloat(document.getElementById('feeValue').value),
            appliesTo: document.getElementById('feeAppliesTo').value,
            recipientWallet: document.getElementById('feeWallet').value,
            priority: parseInt(document.getElementById('feePriority').value),
        };

        try {
            const response = await fetch(`${API_BASE}/admin/fees`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                alert('Fee structure added successfully!');
                hideModal();
                await loadFees();
            } else {
                alert(`Failed to add fee structure: ${result.error}`);
            }
        } catch (error) {
            console.error('Add fee error:', error);
            alert('Failed to add fee structure');
        }
    });

    showModal();
}

// Modal helpers
function showModal() {
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

// Revoke license
async function revokeLicense(licenseKey) {
    if (!confirm('Are you sure you want to revoke this license?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/licenses/${licenseKey}/revoke`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        const result = await response.json();
        if (result.success) {
            alert('License revoked successfully!');
            await refreshLicenses();
            await loadStats();
        } else {
            alert(`Failed to revoke license: ${result.error}`);
        }
    } catch (error) {
        console.error('Revoke license error:', error);
        alert('Failed to revoke license');
    }
}

// Toggle fee
async function toggleFee(feeId, isActive) {
    try {
        const response = await fetch(`${API_BASE}/admin/fees/${feeId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive }),
        });

        const result = await response.json();
        if (result.success) {
            await loadFees();
        } else {
            alert(`Failed to toggle fee: ${result.error}`);
        }
    } catch (error) {
        console.error('Toggle fee error:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
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

            // Load data for tab
            if (tab === 'users') await refreshUsers();
            else if (tab === 'licenses') await refreshLicenses();
            else if (tab === 'tiers') await refreshTiers();
            else if (tab === 'settings') await loadSettings();
            else if (tab === 'audit') await refreshAuditLog();
        });
    });

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

    // Close modal on overlay click (but not on rapid clicks)
    let modalClickTimeout;
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') {
            // Debounce to prevent accidental closes
            clearTimeout(modalClickTimeout);
            modalClickTimeout = setTimeout(() => {
                if (confirm('Close this form? Any unsaved changes will be lost.')) {
                    hideModal();
                }
            }, 100);
        }
    });
}

// Load and display license tiers
async function refreshTiers() {
    try {
        const response = await fetch(`${API_BASE}/admin/license-tiers`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json();
        const tiersList = document.getElementById('tiersList');
        tiersList.innerHTML = '';

        if (!data.tiers || data.tiers.length === 0) {
            tiersList.innerHTML = '<p class="text-gray-500 text-center py-8">No tiers configured</p>';
            return;
        }

        data.tiers.forEach(tier => {
            const feeDisplay = tier.trade_fee_percentage !== null 
                ? `${tier.trade_fee_percentage}%` 
                : 'System Default (0.5%)';

            tiersList.innerHTML += `
                <div class="border rounded-lg p-6 bg-white shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">${tier.tier_display_name}</h3>
                            <p class="text-gray-600 mb-4">${tier.description}</p>
                            
                            <div class="grid grid-cols-3 gap-4 text-sm mb-4">
                                <div class="bg-gray-50 p-3 rounded">
                                    <div class="text-gray-600">Monthly Price</div>
                                    <div class="text-xl font-bold">$${tier.price_monthly}</div>
                                </div>
                                <div class="bg-gray-50 p-3 rounded">
                                    <div class="text-gray-600">Yearly Price</div>
                                    <div class="text-xl font-bold">$${tier.price_yearly}</div>
                                </div>
                                <div class="bg-purple-50 p-3 rounded">
                                    <div class="text-gray-600">Trade Fee</div>
                                    <div class="text-xl font-bold text-purple-600">${feeDisplay}</div>
                                </div>
                            </div>

                            <div class="text-sm text-gray-600">
                                <strong>Strategies:</strong> ${tier.max_concurrent_strategies} concurrent • 
                                <strong>Wallets:</strong> ${tier.max_wallets} • 
                                <strong>Cloud Sync:</strong> ${tier.can_cloud_sync ? 'Yes' : 'No'}
                            </div>
                        </div>
                        <button onclick="editTier('${tier.tier_name}')" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                            <i class="fas fa-edit mr-2"></i>Edit
                        </button>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Load tiers error:', error);
    }
}

// Edit tier modal
function editTier(tierName) {
    // Fetch tier data first
    fetch(`${API_BASE}/admin/license-tiers`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    })
    .then(res => res.json())
    .then(data => {
        const tier = data.tiers.find(t => t.tier_name === tierName);
        if (!tier) return;

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="p-6">
                <h2 class="text-2xl font-bold mb-6">Edit ${tier.tier_display_name}</h2>
                <form id="editTierForm">
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">Monthly Price ($)</label>
                        <input type="number" step="0.01" id="tierPriceMonthly" value="${tier.price_monthly}" class="w-full px-4 py-2 border rounded">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">Yearly Price ($)</label>
                        <input type="number" step="0.01" id="tierPriceYearly" value="${tier.price_yearly}" class="w-full px-4 py-2 border rounded">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">Trade Fee Override (%)</label>
                        <input type="number" step="0.01" id="tierFeeOverride" value="${tier.trade_fee_percentage || ''}" 
                               placeholder="Leave empty to use system default (0.5%)" class="w-full px-4 py-2 border rounded">
                        <p class="text-xs text-gray-500 mt-1">Leave empty = use system default. Set value = override for this tier.</p>
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2">Description</label>
                        <textarea id="tierDescription" class="w-full px-4 py-2 border rounded" rows="2">${tier.description || ''}</textarea>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" onclick="hideModal()" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                        <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save Changes</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('editTierForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const updates = {
                priceMonthly: parseFloat(document.getElementById('tierPriceMonthly').value),
                priceYearly: parseFloat(document.getElementById('tierPriceYearly').value),
                tradeFeePercentage: document.getElementById('tierFeeOverride').value ? parseFloat(document.getElementById('tierFeeOverride').value) : null,
                description: document.getElementById('tierDescription').value,
            };

            try {
                const response = await fetch(`${API_BASE}/admin/license-tiers/${tierName}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates),
                });

                const result = await response.json();
                if (result.success) {
                    alert('Tier updated successfully!');
                    hideModal();
                    await refreshTiers();
                    await loadStats();
                } else {
                    alert(`Failed to update tier: ${result.error}`);
                }
            } catch (error) {
                console.error('Update tier error:', error);
                alert('Failed to update tier');
            }
        });

        showModal();
    });
}

// Make functions global
window.showGenerateLicenseModal = showGenerateLicenseModal;
window.showCreateUserModal = showCreateUserModal;
window.showAddFeeModal = showAddFeeModal;
window.refreshUsers = refreshUsers;
window.refreshLicenses = refreshLicenses;
window.refreshTiers = refreshTiers;
window.editTier = editTier;
window.loadFees = loadFees;
window.refreshAuditLog = refreshAuditLog;
window.hideModal = hideModal;
window.revokeLicense = revokeLicense;
window.toggleFee = toggleFee;
// View/Edit user with fee override
window.viewUser = async (userId) => {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        const data = await response.json();
        if (!data.success) {
            alert('Failed to load user');
            return;
        }

        const user = data.user;
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = `
            <div class="p-6">
                <h2 class="text-2xl font-bold mb-6">Edit User: ${user.email}</h2>
                <form id="editUserForm">
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">Email</label>
                        <input type="text" value="${user.email}" readonly class="w-full px-4 py-2 border rounded bg-gray-100">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">Username</label>
                        <input type="text" value="${user.username}" readonly class="w-full px-4 py-2 border rounded bg-gray-100">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">Role</label>
                        <select id="userRole" class="w-full px-4 py-2 border rounded">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">Status</label>
                        <select id="userActive" class="w-full px-4 py-2 border rounded">
                            <option value="true" ${user.is_active ? 'selected' : ''}>Active</option>
                            <option value="false" ${!user.is_active ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    
                    <div class="border-t pt-4 mt-4">
                        <h3 class="font-bold text-lg mb-3 text-purple-600">
                            <i class="fas fa-percentage mr-2"></i>Fee Override (Optional)
                        </h3>
                        <div class="bg-purple-50 p-4 rounded mb-4">
                            <p class="text-sm text-gray-700 mb-2">
                                <strong>Priority:</strong> User Override > Tier Override > System Default
                            </p>
                            <p class="text-xs text-gray-600">
                                Leave empty to use tier/system fee. Set a value to give this user a custom rate.
                            </p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2">
                                Fee Override Percentage (%)
                            </label>
                            <input type="number" step="0.01" id="userFeeOverride" 
                                   value="${user.fee_override_percentage || ''}" 
                                   placeholder="Leave empty to use tier/system default"
                                   class="w-full px-4 py-2 border rounded">
                            <p class="text-xs text-gray-500 mt-1">
                                Examples: 0.1 (VIP rate), 0 (partner/no fee), 10 (penalty rate)
                            </p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2">Fee Notes</label>
                            <textarea id="userFeeNotes" class="w-full px-4 py-2 border rounded" rows="2" 
                                      placeholder="e.g., VIP customer, Partner deal, etc.">${user.fee_notes || ''}</textarea>
                        </div>
                        
                        <div class="bg-gray-100 p-3 rounded">
                            <strong>Current Fee:</strong> 
                            <span class="text-purple-600 font-bold">
                                ${user.fee_override_percentage !== null && user.fee_override_percentage !== undefined 
                                    ? user.fee_override_percentage + '% (User Override)' 
                                    : 'Using tier/system default'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-2 mt-6">
                        <button type="button" onclick="hideModal()" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                        <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save Changes</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const updates = {
                role: document.getElementById('userRole').value,
                isActive: document.getElementById('userActive').value === 'true',
                feeOverride: document.getElementById('userFeeOverride').value ? parseFloat(document.getElementById('userFeeOverride').value) : null,
                feeNotes: document.getElementById('userFeeNotes').value || null,
            };

            try {
                const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates),
                });

                const result = await response.json();
                if (result.success) {
                    alert('User updated successfully!');
                    hideModal();
                    await refreshUsers();
                } else {
                    alert(`Failed to update user: ${result.error}`);
                }
            } catch (error) {
                console.error('Update user error:', error);
                alert('Failed to update user');
            }
        });

        showModal();

    } catch (error) {
        console.error('View user error:', error);
        alert('Failed to load user details');
    }
};

window.editLicense = (key) => alert('Edit license ' + key);
window.editFee = (id) => alert('Edit fee ' + id);

