# ⚡ Quick Start - Anvil License Server

Get your license server running in 5 minutes!

## 🚀 Installation

```bash
cd cloud-services
npm install
```

## ⚙️ Configuration

Create `.env` file:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/anvil
JWT_SECRET=your-secret-here
ADMIN_KEY=your-admin-key-here
PORT=3000
```

Generate secrets:

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Admin Key  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🏗️ Build & Run

```bash
# Build TypeScript
npm run build

# Start server
npm start

# OR run in development mode
npm run dev
```

## 🌐 Access

- **Website**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Admin Panel**: http://localhost:3000/admin

## 👤 First User

1. Go to http://localhost:3000/register
2. Create account
3. Login at http://localhost:3000/login

## 🔑 First Admin

After registering, manually update user role in database:

```sql
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

Or create via API (if you have ADMIN_KEY):

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "username": "admin",
    "role": "super_admin"
  }'
```

## 🎫 Generate License

### Via Web UI
1. Login to http://localhost:3000/admin
2. Click "Generate License"
3. Fill form and submit

### Via API
```bash
curl -X POST http://localhost:3000/api/admin/licenses/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "tier": "pro",
    "durationDays": 365
  }'
```

## 📝 Test License

```bash
curl -X POST http://localhost:3000/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX"
  }'
```

## 🎯 Next Steps

1. **Configure Fee Structures**: Go to Admin Panel > Fee Structures
2. **Set Up Cloud Sync**: Integrates automatically with Anvil Solo app
3. **Add Download Files**: Update `AVAILABLE_FILES` in `src/routes/downloads.ts`
4. **Deploy to Production**: See [LICENSE-SERVER-GUIDE.md](LICENSE-SERVER-GUIDE.md) deployment section

## 🐛 Troubleshooting

### Database Connection Error
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Database will auto-create tables on first run

### Authentication Error
- Check JWT_SECRET is set
- Token may have expired (7 day default)
- Clear browser localStorage and login again

### Admin Access Denied
- Verify user role is 'admin' or 'super_admin' in database
- Re-login after role change

## 📚 Full Documentation

See [LICENSE-SERVER-GUIDE.md](LICENSE-SERVER-GUIDE.md) for complete documentation.

## ✅ You're Ready!

Your license server is now running with:
- ✅ User authentication
- ✅ License generation & validation
- ✅ Admin panel
- ✅ Cloud sync API
- ✅ Download management
- ✅ Fee structures

Happy licensing! 🎉

