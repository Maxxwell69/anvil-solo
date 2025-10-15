# 🔐 Anvil License Server - Complete Guide

A full-featured license management system with web UI, authentication, cloud sync, and payment integration.

## 📋 Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Web Interface](#web-interface)
6. [API Documentation](#api-documentation)
7. [Deployment](#deployment)
8. [Admin Guide](#admin-guide)
9. [User Guide](#user-guide)
10. [Development](#development)

---

## ✨ Features

### 🔑 License Management
- Generate, validate, and manage licenses
- Support for multiple tiers (Free, Professional, Enterprise)
- Multi-device activation tracking
- License expiration and renewal
- Hardware ID binding

### 👥 User Management
- User registration and authentication with JWT
- Role-based access control (User, Admin, Super Admin)
- Session management
- Profile management

### 💰 Fee Structure System
- Configurable fee structures for downloads, licenses, renewals
- Percentage, fixed, and tiered fee types
- Fee transaction tracking
- Multiple recipient wallets

### ☁️ Cloud Sync
- Sync trading strategies across devices
- Settings synchronization
- Trade history backup
- Device-specific data management

### 📥 Download Management
- Secure time-limited download tokens
- Download tracking and analytics
- Fee application on downloads
- Version management

### 🎨 Modern Web Interface
- Beautiful responsive UI
- User dashboard with license and download management
- Comprehensive admin panel
- Real-time statistics

### 📊 Analytics & Reporting
- User activity tracking
- Revenue analytics
- Download statistics
- Audit logging

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

```bash
cd cloud-services
npm install
```

### Configuration

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/anvil_licenses

# Security
JWT_SECRET=your-secure-secret-key-here
ADMIN_KEY=your-admin-api-key-here

# Server
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=*

# Solana (for fee collection)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
FEE_WALLET_ADDRESS=your-solana-wallet-address
```

### Build and Run

```bash
# Build TypeScript
npm run build

# Start server
npm start

# Or for development with hot reload
npm run dev
```

### Access

- **Website**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Admin Panel**: http://localhost:3000/admin

---

## 📦 Installation

### 1. Clone and Setup

```bash
cd cloud-services
npm install
```

### 2. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE anvil_licenses;
```

The application will automatically create tables on first run using the schema in `src/database/schema.sql`.

### 3. Environment Variables

Copy example env file:

```bash
cp env.example .env
```

Edit `.env` with your configuration.

### 4. Build

```bash
npm run build
```

### 5. Start

```bash
npm start
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | ✅ Yes | - |
| `ADMIN_KEY` | API key for admin operations | ✅ Yes | - |
| `PORT` | Server port | ❌ No | 3000 |
| `NODE_ENV` | Environment (development/production) | ❌ No | development |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated or *) | ❌ No | * |
| `SOLANA_RPC_URL` | Solana RPC endpoint | ❌ No | - |
| `FEE_WALLET_ADDRESS` | Default wallet for fee collection | ❌ No | - |

### Generate Secure Keys

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Admin Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 Web Interface

### Public Pages

#### Landing Page (`/`)
- Feature showcase
- Pricing plans
- Getting started information

#### Login (`/login`)
- User authentication
- JWT token-based sessions
- Auto-redirect for logged-in users

#### Register (`/register`)
- User registration
- Email and username validation
- Password strength requirements

### User Dashboard (`/dashboard`)

**Requires**: User authentication

**Features**:
- View active licenses
- Download management
- Cloud sync status
- Account settings
- Password change

### Admin Panel (`/admin`)

**Requires**: Admin role

**Features**:
- System statistics dashboard
- User management (create, view, edit, deactivate)
- License management (generate, view, edit, revoke)
- Fee structure configuration
- System settings
- Audit log viewer

---

## 📡 API Documentation

Base URL: `/api`

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "johndoe",
  "fullName": "John Doe" // optional
}

Response: {
  "success": true,
  "user": { ... },
  "token": "jwt-token-here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: {
  "success": true,
  "user": { ... },
  "token": "jwt-token-here"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: {
  "success": true,
  "user": { ... }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Logged out successfully"
}
```

### License Endpoints

#### Generate License (Admin)
```http
POST /api/admin/licenses/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "tier": "pro",
  "durationDays": 365,
  "maxDevices": 3,
  "notes": "Generated for customer"
}

Response: {
  "success": true,
  "license": {
    "id": 1,
    "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
    "tier": "pro",
    "expiresAt": "2025-10-15T00:00:00.000Z"
  }
}
```

#### Validate License
```http
POST /api/license/validate
Content-Type: application/json

{
  "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
  "hardwareId": "unique-hardware-id" // optional
}

Response: {
  "success": true,
  "valid": true,
  "tier": "pro",
  "expiresAt": "2025-10-15T00:00:00.000Z"
}
```

### Download Endpoints

#### Get Available Files
```http
GET /api/downloads/files

Response: {
  "success": true,
  "files": [
    {
      "name": "anvil-solo-setup.exe",
      "version": "3.0.0",
      "size": 150000000,
      "description": "Anvil Solo Trading Bot - Windows Setup",
      "requiresLicense": true
    }
  ]
}
```

#### Request Download
```http
POST /api/downloads/request/:fileName
Authorization: Bearer <token>

Response: {
  "success": true,
  "downloadToken": "secure-token",
  "downloadUrl": "/api/downloads/file/secure-token",
  "expiresAt": "2024-10-16T00:00:00.000Z",
  "fees": {
    "total": 2.50,
    "breakdown": [...]
  }
}
```

#### Download File
```http
GET /api/downloads/file/:token

Response: File download or {
  "success": true,
  "file": { ... }
}
```

### Cloud Sync Endpoints

#### Upload Sync Data
```http
POST /api/sync/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
  "dataType": "strategies",
  "dataKey": "my-strategy-1",
  "dataValue": { ... },
  "deviceId": "device-123" // optional
}

Response: {
  "success": true,
  "sync": {
    "id": 1,
    "version": 2,
    "syncedAt": "2024-10-15T12:00:00.000Z"
  }
}
```

#### Download Sync Data
```http
GET /api/sync/download?dataType=strategies
Authorization: Bearer <token>

Response: {
  "success": true,
  "data": [
    {
      "dataType": "strategies",
      "dataKey": "my-strategy-1",
      "dataValue": { ... },
      "version": 2
    }
  ]
}
```

### Admin Endpoints

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <token>

Response: {
  "success": true,
  "users": [...]
}
```

#### Get Statistics
```http
GET /api/admin/stats
Authorization: Bearer <token>

Response: {
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalLicenses": 200,
    "activeLicenses": 180,
    "totalRevenue": 15000.00
  }
}
```

#### Get Audit Logs
```http
GET /api/admin/audit-logs?limit=50
Authorization: Bearer <token>

Response: {
  "success": true,
  "logs": [...]
}
```

---

## 🚀 Deployment

### Railway Deployment

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
railway init
```

4. **Add PostgreSQL Database**
```bash
railway add
# Select: Database -> PostgreSQL
```

5. **Set Environment Variables**
```bash
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set FEE_WALLET_ADDRESS=your-wallet-address
railway variables set NODE_ENV=production
```

6. **Deploy**
```bash
npm run build
railway up
```

7. **Get URL**
```bash
railway status
```

### Heroku Deployment

```bash
# Create app
heroku create anvil-license-server

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Deploy
git push heroku main
```

### Docker Deployment

```bash
# Build image
docker build -t anvil-license-server .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=your-database-url \
  -e JWT_SECRET=your-secret \
  -e ADMIN_KEY=your-admin-key \
  anvil-license-server
```

---

## 👨‍💼 Admin Guide

### First-Time Setup

1. Deploy the application
2. Create super admin account via registration
3. Update user role in database to `super_admin`
4. Login to admin panel at `/admin`

### Managing Users

**Create User**:
1. Go to Admin Panel > Users tab
2. Click "Create User"
3. Fill in details and select role
4. Click "Create"

**View User Details**:
- Click on user in list to view licenses and activity

**Deactivate User**:
- Edit user and set `is_active` to false

### Managing Licenses

**Generate License**:
1. Go to Admin Panel > Licenses tab
2. Click "Generate License"
3. Enter:
   - Email address
   - Tier (free/pro/enterprise)
   - Duration in days (leave empty for lifetime)
   - Max devices
   - Notes
4. Click "Generate"
5. Copy and send license key to user

**View License Details**:
- Click on license to see activation history and devices

**Revoke License**:
- Click revoke button (ban icon) on license card

### Configuring Fee Structures

1. Go to Admin Panel > Fee Structures tab
2. Click "Add Fee Structure"
3. Configure:
   - **Name**: Descriptive name
   - **Type**: percentage, fixed, or tiered
   - **Value**: Fee amount (e.g., 2.5 for 2.5%)
   - **Applies To**: download, license, renewal, trade, or all
   - **Recipient Wallet**: Solana wallet address
   - **Priority**: Order of application (lower = first)
4. Click "Add"

### Viewing Analytics

- Dashboard shows real-time statistics
- Audit log tracks all admin actions
- Download history shows user activity

---

## 👤 User Guide

### Getting Started

1. **Register**: Go to `/register` and create account
2. **Login**: Login at `/login`
3. **Dashboard**: Access your dashboard at `/dashboard`

### Managing Licenses

**View Licenses**:
- Go to Dashboard > My Licenses tab
- See all your licenses, status, and expiry dates

**Activate License**:
- Use license key in Anvil Solo desktop app
- License will bind to your hardware ID

### Downloading Software

1. Go to Dashboard > Downloads tab
2. Click "Download" on desired file
3. Download link generated with 24-hour expiry
4. Click link to download file

### Cloud Sync

**Enable Sync**:
- Sync is automatic when using Anvil Solo with valid license
- View sync status in Dashboard > Cloud Sync tab

**Synced Data**:
- Trading strategies
- Application settings
- Trade history
- Favorites and alerts

### Account Settings

**Update Profile**:
1. Go to Dashboard > Settings tab
2. Update full name or wallet address
3. Click "Save Changes"

**Change Password**:
1. Go to Dashboard > Settings tab
2. Enter current password
3. Enter and confirm new password
4. Click "Update Password"

---

## 🛠️ Development

### Project Structure

```
cloud-services/
├── src/
│   ├── database/
│   │   ├── schema.sql           # Database schema
│   │   └── db-enhanced.ts       # Database operations
│   ├── middleware/
│   │   └── auth-enhanced.ts     # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── admin.ts             # Admin endpoints
│   │   ├── downloads.ts         # Download endpoints
│   │   └── sync.ts              # Cloud sync endpoints
│   ├── utils/
│   │   └── auth.ts              # Auth utilities
│   └── index-enhanced.ts        # Main server file
├── public/
│   ├── index.html               # Landing page
│   ├── login.html               # Login page
│   ├── register.html            # Registration page
│   ├── dashboard.html           # User dashboard
│   ├── admin.html               # Admin panel
│   └── js/
│       ├── dashboard.js         # Dashboard logic
│       └── admin.js             # Admin panel logic
├── package.json
└── tsconfig.json
```

### Running Locally

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Adding New Features

1. **New API Endpoint**: Add route in `src/routes/`
2. **New Database Table**: Update `src/database/schema.sql`
3. **New UI Page**: Add HTML in `public/` and JS in `public/js/`

---

## 🔒 Security

### Best Practices

1. **Use Strong Secrets**: Generate secure JWT_SECRET and ADMIN_KEY
2. **HTTPS Only**: Always use HTTPS in production
3. **Rate Limiting**: Built-in rate limiting on API routes
4. **Password Requirements**: Enforced password complexity
5. **Session Management**: JWT tokens with expiration
6. **SQL Injection**: Protected with parameterized queries
7. **CORS**: Configurable origin restrictions

### Security Headers

Helmet.js is configured for:
- Content Security Policy
- XSS Protection
- MIME Type Sniffing Prevention
- Clickjacking Protection

---

## 📞 Support

For issues or questions:
- Check this documentation first
- Review API error messages
- Check audit logs in admin panel
- Contact system administrator

---

## 📝 License

All rights reserved. Proprietary software for Anvil Solo trading platform.

---

## 🎉 Congratulations!

You now have a fully functional license server system with:
- ✅ Complete web UI
- ✅ User authentication
- ✅ License management
- ✅ Fee structures
- ✅ Cloud sync
- ✅ Download tracking
- ✅ Admin panel
- ✅ Analytics

Ready to deploy and start managing licenses! 🚀

