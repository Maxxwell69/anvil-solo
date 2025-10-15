# 🎯 CREATE YOUR ADMIN ACCOUNT - COPY & PASTE

## ✅ **Do This in 2 Minutes:**

---

## **Step 1: Open Railway Database**

1. Go to: **https://railway.app/dashboard**
2. Click your project (e.g., "pure-analysis")
3. Click the **PostgreSQL** service (the database icon)
4. Go to the **"Query"** tab

---

## **Step 2: Copy and Paste This SQL**

**Copy ALL of this and paste into Railway's query box:**

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create your admin account
INSERT INTO users (email, username, full_name, role, is_active, password_hash)
VALUES (
    'maxx@pantherpilot.com',
    'traderMaxx',
    'maxx fairo',
    'super_admin',
    true,
    '$2b$10$JlUYeQVKwOcri3rW5vSJLeKl7/Pf/tOA3hgxJ8qVlErWCiZjrRYf2'
)
ON CONFLICT (email) DO UPDATE SET role = 'super_admin';

-- Show your account
SELECT id, email, username, full_name, role, is_active, created_at 
FROM users 
WHERE email = 'maxx@pantherpilot.com';
```

---

## **Step 3: Click "Run" or "Execute"**

You should see output like:

```
id  | email                   | username   | full_name  | role        | is_active | created_at
----|-------------------------|------------|------------|-------------|-----------|------------------
1   | maxx@pantherpilot.com   | traderMaxx | maxx fairo | super_admin | true      | 2024-10-15...
```

✅ **If you see this, your account is created!**

---

## **Step 4: Login**

1. Go to: **https://anvil-solo-production.up.railway.app/login**
2. Enter:
   - **Email**: `maxx@pantherpilot.com`
   - **Password**: `ShogunMaxx1969!`
3. Click **"Sign In"**

---

## **Step 5: Access Admin Panel**

After logging in, go to:
```
https://anvil-solo-production.up.railway.app/admin
```

**You should see your full admin dashboard!** 🎉

---

## 🔐 **Your Credentials (SAVE THESE):**

```
Email:    maxx@pantherpilot.com
Username: traderMaxx
Password: ShogunMaxx1969!
Role:     super_admin

Login:    https://anvil-solo-production.up.railway.app/login
Admin:    https://anvil-solo-production.up.railway.app/admin
```

---

## ⚠️ **Can't Find Query Tab?**

### **Alternative: Use Data Tab**

1. Click **"Data"** tab instead
2. Click on **"users"** table (if it exists)
3. Click **"Add Row"** or **"Insert"**
4. Or look for SQL query option

### **Or Use Connect Tab**

1. Click **"Connect"** tab
2. Look for external connection URL
3. Use pgAdmin or any PostgreSQL client
4. Run the SQL there

---

## ✅ **That's It!**

Just:
1. ✅ Open Railway Database
2. ✅ Copy the SQL above
3. ✅ Paste and run
4. ✅ Login with your credentials

**Takes 2 minutes!** 🚀

---

**Let me know if you can't find the Query tab and I'll help you another way!**

