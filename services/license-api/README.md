# Anvil Solo - License API

Backend API for license validation and management.

## Features

- License key activation with hardware ID binding
- JWT-based token authentication
- Multi-tier support (Starter, Pro, Enterprise, Lifetime)
- Feature gating based on license tier
- PostgreSQL database
- Ready for cloud deployment

## Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create PostgreSQL database:
```bash
createdb anvil_licenses
psql anvil_licenses < schema.sql
```

3. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/anvil_licenses"
export JWT_SECRET="your-super-secret-key"
export PORT=3001
```

4. Run in development mode:
```bash
npm run dev
```

### Production Deployment

#### Deploy to Railway.app (Recommended)

1. Push code to GitHub
2. Connect Railway to your repository
3. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (automatically set if you add PostgreSQL service)
   - `JWT_SECRET` (generate a random 32-character string)
   - `NODE_ENV=production`
4. Railway will automatically deploy!

#### Deploy to Heroku

```bash
heroku create anvil-license-api
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET="your-secret-key"
git push heroku main
heroku run psql < schema.sql
```

#### Deploy to Render.com

1. Create new Web Service
2. Connect GitHub repository
3. Add PostgreSQL database
4. Set environment variables
5. Deploy!

## API Endpoints

### POST /api/license/activate
Activate a license key with hardware ID.

**Request:**
```json
{
  "licenseKey": "ANVIL-PRO-TEST-0001",
  "hwid": "hardware-id-string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "tier": "pro",
  "features": {
    "maxActiveStrategies": 10,
    "maxWallets": 10,
    "strategyTypes": ["dca", "ratio", "bundle"],
    "cloudBackup": true,
    "prioritySupport": false
  },
  "expiresAt": "2024-12-31T00:00:00Z"
}
```

### POST /api/license/validate
Validate an existing license token.

**Request:**
```json
{
  "token": "jwt-token-here"
}
```

**Response:**
```json
{
  "valid": true,
  "tier": "pro",
  "features": { ... },
  "expiresAt": "2024-12-31T00:00:00Z"
}
```

### GET /api/license/features/:tier
Get feature list for a specific tier (public endpoint).

**Response:**
```json
{
  "tier": "pro",
  "features": {
    "maxActiveStrategies": 10,
    "maxWallets": 10,
    "strategyTypes": ["dca", "ratio", "bundle"],
    "cloudBackup": true,
    "prioritySupport": false
  }
}
```

### POST /api/license/deactivate
Deactivate a license (remove hardware ID binding).

**Request:**
```json
{
  "token": "jwt-token-here"
}
```

## License Tiers

### Starter ($29/month)
- 1 active strategy
- Basic DCA only
- 5 wallets max
- No cloud backup

### Pro ($99/month)
- 10 active strategies
- All strategy types
- 10 wallets max
- Cloud strategy backup

### Enterprise ($299/month)
- Unlimited strategies
- All strategy types
- Unlimited wallets
- Cloud backup
- Priority support

### Lifetime ($999 one-time)
- All Enterprise features
- Forever

## Test License Keys

For testing, use these pre-generated keys:

- `ANVIL-STARTER-TEST-0001` - Starter tier
- `ANVIL-PRO-TEST-0001` - Pro tier
- `ANVIL-ENTERPRISE-TEST-0001` - Enterprise tier
- `ANVIL-LIFETIME-0001` - Lifetime tier

## Security

- All endpoints use HTTPS in production
- JWT tokens expire after 7 days
- Hardware ID binding prevents license sharing
- Database credentials stored as environment variables
- Rate limiting recommended (use nginx or Cloudflare)

## Cost Estimation

- Railway.app: ~$5-20/month (includes database)
- Heroku: ~$16/month (Eco dyno + Mini PostgreSQL)
- Render.com: Free tier available, paid starts at $7/month

Choose based on your expected traffic and features needed.


