# 📡 API Reference - Anvil License Server

Complete API endpoint documentation.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

Get token from `/api/auth/login` or `/api/auth/register` endpoints.

---

## 🔐 Authentication Endpoints

### POST /api/auth/register

Register new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login

Login existing user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt-token-here"
}
```

### GET /api/auth/me

Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-10-15T00:00:00.000Z",
    "lastLogin": "2024-10-15T12:00:00.000Z"
  }
}
```

### PATCH /api/auth/me

Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "fullName": "John Updated Doe",
  "walletAddress": "SolanaWalletAddressHere"
}
```

### POST /api/auth/logout

Logout and invalidate session.

**Headers:** `Authorization: Bearer <token>`

### POST /api/auth/change-password

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

### POST /api/auth/refresh

Refresh JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "token": "new-jwt-token"
}
```

---

## 🎫 License Endpoints

### POST /api/license/validate

Validate a license key.

**Body:**
```json
{
  "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
  "hardwareId": "unique-hardware-id",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "tier": "pro",
  "isActive": true,
  "expiresAt": "2025-10-15T00:00:00.000Z",
  "maxDevices": 3,
  "deviceCount": 1
}
```

### POST /api/license/activate

Activate license on hardware.

**Body:**
```json
{
  "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
  "hardwareId": "unique-hardware-id",
  "email": "user@example.com"
}
```

---

## 📥 Download Endpoints

### GET /api/downloads/files

Get list of available files.

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "name": "anvil-solo-setup.exe",
      "version": "3.0.0",
      "size": 150000000,
      "description": "Anvil Solo Trading Bot - Windows Setup",
      "requiresLicense": true,
      "downloadUrl": "/api/downloads/request/anvil-solo-setup.exe"
    }
  ]
}
```

### POST /api/downloads/request/:fileName

Request download for file (generates time-limited token).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "downloadToken": "secure-random-token",
  "downloadUrl": "/api/downloads/file/secure-random-token",
  "expiresAt": "2024-10-16T12:00:00.000Z",
  "file": {
    "name": "anvil-solo-setup.exe",
    "version": "3.0.0",
    "size": 150000000
  },
  "fees": {
    "total": 2.50,
    "breakdown": [
      {
        "name": "Standard Download Fee",
        "amount": 2.50,
        "type": "percentage"
      }
    ]
  }
}
```

### GET /api/downloads/file/:token

Download file using token.

**Response:** File download or error

### GET /api/downloads/history

Get download history for current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "downloads": [
    {
      "id": 1,
      "fileName": "anvil-solo-setup.exe",
      "fileVersion": "3.0.0",
      "status": "completed",
      "startedAt": "2024-10-15T12:00:00.000Z",
      "completedAt": "2024-10-15T12:05:00.000Z",
      "feeApplied": 2.50
    }
  ]
}
```

---

## ☁️ Cloud Sync Endpoints

### POST /api/sync/upload

Upload/sync data to cloud.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
  "dataType": "strategies",
  "dataKey": "my-strategy-1",
  "dataValue": {
    "name": "Smart Ratio Strategy",
    "config": { ... }
  },
  "deviceId": "device-123"
}
```

**Allowed Data Types:**
- `strategies`
- `settings`
- `trades`
- `favorites`
- `wallets`
- `alerts`
- `preferences`

**Response:**
```json
{
  "success": true,
  "sync": {
    "id": 1,
    "dataType": "strategies",
    "dataKey": "my-strategy-1",
    "version": 2,
    "syncedAt": "2024-10-15T12:00:00.000Z"
  }
}
```

### GET /api/sync/download

Download synced data.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `dataType` (optional): Filter by data type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "dataType": "strategies",
      "dataKey": "my-strategy-1",
      "dataValue": { ... },
      "version": 2,
      "deviceId": "device-123",
      "syncedAt": "2024-10-15T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET /api/sync/data/:dataType/:dataKey

Get specific synced data item.

**Headers:** `Authorization: Bearer <token>`

### DELETE /api/sync/data/:dataType/:dataKey

Delete synced data item.

**Headers:** `Authorization: Bearer <token>`

### GET /api/sync/status

Get sync status overview.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "status": {
    "totalItems": 25,
    "dataByType": {
      "strategies": {
        "count": 5,
        "lastSynced": "2024-10-15T12:00:00.000Z"
      },
      "settings": {
        "count": 10,
        "lastSynced": "2024-10-15T11:00:00.000Z"
      }
    },
    "allowedDataTypes": ["strategies", "settings", "trades", ...]
  }
}
```

### POST /api/sync/bulk-upload

Upload multiple items at once.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
  "items": [
    {
      "dataType": "strategies",
      "dataKey": "strategy-1",
      "dataValue": { ... }
    },
    {
      "dataType": "settings",
      "dataKey": "ui-settings",
      "dataValue": { ... }
    }
  ],
  "deviceId": "device-123"
}
```

---

## 👨‍💼 Admin Endpoints

**All admin endpoints require admin role authentication.**

### GET /api/admin/stats

Get system statistics dashboard.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalLicenses": 200,
    "activeLicenses": 180,
    "totalDownloads": 500,
    "recentUsers": 15,
    "totalRevenue": 15000.00
  }
}
```

### GET /api/admin/users

Get all users.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `role`: Filter by role
- `is_active`: Filter by active status

### GET /api/admin/users/:id

Get user details.

**Headers:** `Authorization: Bearer <token>`

### POST /api/admin/users

Create new user.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "username": "newuser",
  "fullName": "New User",
  "role": "user"
}
```

### PATCH /api/admin/users/:id

Update user.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "updated@example.com",
  "fullName": "Updated Name",
  "role": "admin",
  "isActive": true
}
```

### GET /api/admin/licenses

Get all licenses.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Filter by status
- `tier`: Filter by tier
- `user_id`: Filter by user

### GET /api/admin/licenses/:key

Get license details.

**Headers:** `Authorization: Bearer <token>`

### POST /api/admin/licenses/generate

Generate new license.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "user@example.com",
  "tier": "pro",
  "userId": 1,
  "durationDays": 365,
  "maxDevices": 3,
  "notes": "Generated for customer purchase"
}
```

### PATCH /api/admin/licenses/:key

Update license.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "status": "active",
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "maxDevices": 5,
  "notes": "Extended for premium customer"
}
```

### POST /api/admin/licenses/:key/revoke

Revoke license.

**Headers:** `Authorization: Bearer <token>`

### GET /api/admin/fees

Get all fee structures.

**Headers:** `Authorization: Bearer <token>`

### POST /api/admin/fees

Create fee structure.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Premium Download Fee",
  "description": "Applied to premium tier downloads",
  "feeType": "percentage",
  "feeValue": 5.0,
  "appliesTo": "download",
  "recipientWallet": "SolanaWalletAddress",
  "tierFilter": "pro",
  "priority": 1
}
```

### PATCH /api/admin/fees/:id

Update fee structure.

**Headers:** `Authorization: Bearer <token>`

### GET /api/admin/settings

Get system settings.

**Headers:** `Authorization: Bearer <token>`

### PUT /api/admin/settings/:key

Update system setting.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "value": "new-value"
}
```

### GET /api/admin/audit-logs

Get audit logs.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_id`: Filter by user
- `resource_type`: Filter by resource
- `limit`: Limit results (default: 100)

---

## 🔒 Legacy Endpoints (Backwards Compatibility)

### POST /api/license/generate

Generate license (legacy admin key auth).

**Headers:** `X-Admin-Key: <admin-key>`

**Body:**
```json
{
  "tier": "pro",
  "email": "user@example.com"
}
```

### POST /api/fees/record

Record fee transaction (legacy).

**Headers:** `X-Admin-Key: <admin-key>`

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": ["Additional", "error", "details"]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., user already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🚀 Rate Limiting

API endpoints are rate limited:
- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: Higher limits per user

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- JWT tokens expire after 7 days by default
- Download tokens expire after 24 hours
- License keys follow format: `ANVIL-XXXX-XXXX-XXXX-XXXX`

---

## 🛠️ Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","username":"testuser"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Get user (replace TOKEN)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate license (admin, replace TOKEN)
curl -X POST http://localhost:3000/api/admin/licenses/generate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","tier":"pro","durationDays":365}'
```

---

## 📚 Additional Resources

- [Complete Guide](LICENSE-SERVER-GUIDE.md)
- [Quick Start](QUICK-START.md)
- [Deployment Guide](LICENSE-SERVER-GUIDE.md#deployment)

---

Happy coding! 🚀

