# 🔐 Anvil License Server

**A complete, production-ready license management system with modern web UI, authentication, cloud sync, and payment integration.**

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)](https://www.typescriptlang.org/)

---

## 🌟 Features

### 🎨 **Beautiful Modern Web Interface**
- Responsive design with Tailwind CSS
- Landing page with feature showcase
- User authentication (login/register)
- User dashboard for license and download management
- Comprehensive admin panel with analytics

### 🔑 **Complete License Management**
- Generate and validate license keys
- Multiple tiers (Free, Professional, Enterprise)
- Multi-device activation tracking
- Expiration and renewal management
- Hardware ID binding for security

### 👥 **User Authentication & Authorization**
- JWT-based authentication
- Secure password hashing with bcrypt
- Session management
- Role-based access control (User, Admin, Super Admin)
- Password reset and profile management

### 💰 **Flexible Fee Structure System**
- Configurable fee structures
- Percentage, fixed, and tiered fee types
- Apply fees to downloads, licenses, renewals, trades
- Multiple recipient wallets
- Transaction tracking and analytics

### ☁️ **Cloud Synchronization**
- Sync trading strategies across devices
- Settings and preferences backup
- Trade history synchronization
- Device-specific data management
- Bulk upload/download support

### 📥 **Secure Download Management**
- Time-limited download tokens
- Fee application on downloads
- Download history tracking
- Version management
- Multiple file support

### 📊 **Analytics & Reporting**
- Real-time system statistics
- User activity tracking
- Revenue analytics
- Download metrics
- Comprehensive audit logging

### 🔒 **Enterprise Security**
- JWT token authentication
- Helmet.js security headers
- Rate limiting on API routes
- SQL injection protection
- CORS configuration
- Password complexity requirements

---

## 📸 Screenshots

### Landing Page
Modern, professional landing page with feature showcase and pricing.

### User Dashboard
Manage licenses, downloads, cloud sync, and account settings.

### Admin Panel
Complete control over users, licenses, fees, and system settings.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd cloud-services
npm install

# 2. Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@localhost:5432/anvil
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PORT=3000
EOF

# 3. Build and start
npm run build
npm start
```

**Access at:** http://localhost:3000

📚 **Full guide:** [QUICK-START.md](QUICK-START.md)

---

## 📖 Documentation

- **[Complete Guide](LICENSE-SERVER-GUIDE.md)** - Full documentation
- **[Quick Start](QUICK-START.md)** - Get started in 5 minutes
- **[API Reference](API-REFERENCE.md)** - Complete API documentation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Web Interface                     │
│  (Landing, Login, Register, Dashboard, Admin)       │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Express.js API                     │
│    /api/auth  /api/admin  /api/downloads  /sync    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│               Authentication Layer                  │
│         (JWT, bcrypt, session management)           │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                PostgreSQL Database                  │
│  users│licenses│fees│downloads│sync│audit_log      │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (18+) - Runtime
- **TypeScript** - Type safety
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers

### Frontend
- **Tailwind CSS** - Styling
- **Vanilla JS** - Interactivity
- **Font Awesome** - Icons

### DevOps
- **Railway** - Deployment platform
- **Docker** - Containerization (optional)
- **Heroku** - Alternative deployment

---

## 📁 Project Structure

```
cloud-services/
├── src/
│   ├── database/
│   │   ├── schema.sql              # Database schema
│   │   ├── db-enhanced.ts          # Database operations
│   │   ├── init.ts                 # DB initialization
│   │   └── postgres-init.ts        # PostgreSQL setup
│   ├── middleware/
│   │   ├── auth.ts                 # Legacy auth
│   │   └── auth-enhanced.ts        # JWT authentication
│   ├── routes/
│   │   ├── auth.ts                 # Authentication endpoints
│   │   ├── admin.ts                # Admin management
│   │   ├── downloads.ts            # Download management
│   │   ├── sync.ts                 # Cloud sync
│   │   ├── license.ts              # License validation (legacy)
│   │   ├── archive.ts              # Archive management
│   │   ├── data.ts                 # Data endpoints
│   │   └── fees.ts                 # Fee management
│   ├── utils/
│   │   └── auth.ts                 # Auth utilities
│   ├── index.ts                    # Legacy server
│   └── index-enhanced.ts           # Main server
├── public/
│   ├── index.html                  # Landing page
│   ├── login.html                  # Login page
│   ├── register.html               # Registration
│   ├── dashboard.html              # User dashboard
│   ├── admin.html                  # Admin panel
│   └── js/
│       ├── dashboard.js            # Dashboard logic
│       └── admin.js                # Admin logic
├── LICENSE-SERVER-GUIDE.md         # Complete documentation
├── QUICK-START.md                  # Quick start guide
├── API-REFERENCE.md                # API documentation
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README.md                       # This file
```

---

## 🎯 Use Cases

### For Software Vendors
- Sell licenses for your software
- Track activations and usage
- Manage customer subscriptions
- Automated fee collection

### For SaaS Platforms
- User authentication system
- Subscription management
- Download delivery
- Cloud data synchronization

### For Trading Platforms
- License trading bots
- Sync strategies across devices
- Track bot usage
- Collect performance fees

---

## 🔐 Security Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Password Hashing** - bcrypt with salt rounds  
✅ **Session Management** - Token expiration and refresh  
✅ **Rate Limiting** - Prevent abuse  
✅ **SQL Injection Protection** - Parameterized queries  
✅ **CORS Configuration** - Origin restrictions  
✅ **Security Headers** - Helmet.js protection  
✅ **Audit Logging** - Track all admin actions  

---

## 📊 Database Schema

### Core Tables
- `users` - User accounts with authentication
- `sessions` - JWT token sessions
- `licenses` - License keys and activations
- `license_tiers` - Tier configurations
- `license_devices` - Device tracking
- `fee_structures` - Fee configurations
- `fee_transactions` - Transaction records
- `downloads` - Download tracking
- `cloud_sync` - Synchronized data
- `audit_log` - Admin action tracking
- `system_settings` - Configuration

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password

### Licenses
- `POST /api/license/validate` - Validate license
- `POST /api/admin/licenses/generate` - Generate license (admin)
- `GET /api/admin/licenses` - List licenses (admin)
- `PATCH /api/admin/licenses/:key` - Update license (admin)

### Downloads
- `GET /api/downloads/files` - List files
- `POST /api/downloads/request/:file` - Request download
- `GET /api/downloads/file/:token` - Download file
- `GET /api/downloads/history` - Download history

### Cloud Sync
- `POST /api/sync/upload` - Upload data
- `GET /api/sync/download` - Download data
- `GET /api/sync/status` - Sync status
- `POST /api/sync/bulk-upload` - Bulk upload

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/fees` - List fee structures
- `POST /api/admin/fees` - Create fee structure
- `GET /api/admin/audit-logs` - View audit log

**Full API docs:** [API-REFERENCE.md](API-REFERENCE.md)

---

## 🚀 Deployment

### Railway (Recommended)

```bash
railway login
railway init
railway add  # Add PostgreSQL
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
npm run build
railway up
```

### Heroku

```bash
heroku create anvil-license-server
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
git push heroku main
```

### Docker

```bash
docker build -t anvil-license-server .
docker run -d -p 3000:3000 \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-secret \
  anvil-license-server
```

**Full deployment guide:** [LICENSE-SERVER-GUIDE.md#deployment](LICENSE-SERVER-GUIDE.md#deployment)

---

## 💻 Development

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests (coming soon)
npm test
```

---

## 🤝 Contributing

This is proprietary software for Anvil Solo trading platform.

---

## 📄 License

All rights reserved. Proprietary software.

---

## 🆘 Support

For issues or questions:
1. Check [LICENSE-SERVER-GUIDE.md](LICENSE-SERVER-GUIDE.md)
2. Review [API-REFERENCE.md](API-REFERENCE.md)
3. Check audit logs in admin panel
4. Contact system administrator

---

## ✨ What You Get

✅ **Complete license management system**  
✅ **Modern, beautiful web interface**  
✅ **User authentication with JWT**  
✅ **Admin panel with full control**  
✅ **Cloud synchronization API**  
✅ **Download management with fees**  
✅ **Analytics and reporting**  
✅ **Production-ready code**  
✅ **Comprehensive documentation**  
✅ **Easy deployment**  

---

## 🎉 Ready to Deploy!

This is a **complete, production-ready** license server system. Everything you need to manage licenses, users, downloads, and payments for your software.

### Get Started Now:

```bash
cd cloud-services
npm install
npm run build
npm start
```

Then open http://localhost:3000 and start managing licenses! 🚀

---

**Built with ❤️ for Anvil Solo Trading Platform**
