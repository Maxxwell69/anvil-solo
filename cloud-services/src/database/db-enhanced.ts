import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sql: postgres.Sql | null = null;

export async function initDatabase() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    sql = postgres(process.env.DATABASE_URL, {
        max: 20,
        idle_timeout: 20,
        connect_timeout: 10,
    });

    console.log('📊 Database connected');

    // Run schema
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        
        // Split by semicolon and execute each statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            await sql.unsafe(statement);
        }

        console.log('✅ Database schema initialized');
    } catch (error) {
        console.error('❌ Error initializing schema:', error);
        throw error;
    }

    return sql;
}

export function getDb(): postgres.Sql {
    if (!sql) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return sql;
}

// User operations
export const userDb = {
    async create(email: string, passwordHash: string, username: string, fullName?: string) {
        const [user] = await getDb()`
            INSERT INTO users (email, password_hash, username, full_name)
            VALUES (${email}, ${passwordHash}, ${username}, ${fullName || null})
            RETURNING id, email, username, full_name, role, is_active, created_at
        `;
        return user;
    },

    async findByEmail(email: string) {
        const [user] = await getDb()`
            SELECT * FROM users WHERE email = ${email}
        `;
        return user;
    },

    async findById(id: number) {
        const [user] = await getDb()`
            SELECT * FROM users WHERE id = ${id}
        `;
        return user;
    },

    async update(id: number, data: any) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        const [user] = await getDb()`
            UPDATE users 
            SET ${getDb()(fields.map((field, i) => getDb()`${getDb().unsafe(field)} = ${values[i]}`))},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;
        return user;
    },

    async updateLastLogin(id: number) {
        await getDb()`
            UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${id}
        `;
    },

    async list(filters: any = {}) {
        let query = getDb()`SELECT id, email, username, full_name, role, is_active, created_at, last_login FROM users WHERE 1=1`;
        
        if (filters.role) {
            query = getDb()`${query} AND role = ${filters.role}`;
        }
        if (filters.is_active !== undefined) {
            query = getDb()`${query} AND is_active = ${filters.is_active}`;
        }
        
        return await query;
    }
};

// License operations
export const licenseDb = {
    async create(licenseKey: string, userId: number, tier: string, email: string, expiresAt?: Date) {
        const [license] = await getDb()`
            INSERT INTO licenses (license_key, user_id, tier, email, expires_at)
            VALUES (${licenseKey}, ${userId}, ${tier}, ${email}, ${expiresAt || null})
            RETURNING *
        `;
        return license;
    },

    async findByKey(licenseKey: string) {
        const [license] = await getDb()`
            SELECT l.*, lt.tier_display_name, lt.features, lt.max_devices as tier_max_devices,
                   u.email as user_email, u.username
            FROM licenses l
            LEFT JOIN license_tiers lt ON l.tier = lt.tier_name
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.license_key = ${licenseKey}
        `;
        return license;
    },

    async findByUserId(userId: number) {
        return await getDb()`
            SELECT l.*, lt.tier_display_name, lt.features
            FROM licenses l
            LEFT JOIN license_tiers lt ON l.tier = lt.tier_name
            WHERE l.user_id = ${userId}
            ORDER BY l.issued_at DESC
        `;
    },

    async update(id: number, data: any) {
        const updates = Object.entries(data)
            .map(([key, value]) => `${key} = ${getDb().param(value)}`)
            .join(', ');
        
        const [license] = await getDb().unsafe(`
            UPDATE licenses 
            SET ${updates}
            WHERE id = ${id}
            RETURNING *
        `);
        return license;
    },

    async updateValidation(licenseKey: string) {
        await getDb()`
            UPDATE licenses 
            SET last_validated = CURRENT_TIMESTAMP,
                validation_count = validation_count + 1
            WHERE license_key = ${licenseKey}
        `;
    },

    async list(filters: any = {}) {
        let conditions = [];
        let params = [];

        if (filters.status) conditions.push(`status = ?`);
        if (filters.tier) conditions.push(`tier = ?`);
        if (filters.user_id) conditions.push(`user_id = ?`);

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        return await getDb().unsafe(`
            SELECT l.*, lt.tier_display_name, u.email as user_email, u.username
            FROM licenses l
            LEFT JOIN license_tiers lt ON l.tier = lt.tier_name
            LEFT JOIN users u ON l.user_id = u.id
            ${whereClause}
            ORDER BY l.issued_at DESC
        `);
    }
};

// Session operations
export const sessionDb = {
    async create(userId: number, tokenHash: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
        const [session] = await getDb()`
            INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
            VALUES (${userId}, ${tokenHash}, ${expiresAt}, ${ipAddress || null}, ${userAgent || null})
            RETURNING *
        `;
        return session;
    },

    async findByTokenHash(tokenHash: string) {
        const [session] = await getDb()`
            SELECT s.*, u.email, u.username, u.role, u.is_active as user_active
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token_hash = ${tokenHash} 
            AND s.is_active = true 
            AND s.expires_at > CURRENT_TIMESTAMP
        `;
        return session;
    },

    async invalidate(tokenHash: string) {
        await getDb()`
            UPDATE sessions SET is_active = false WHERE token_hash = ${tokenHash}
        `;
    },

    async cleanExpired() {
        await getDb()`
            UPDATE sessions SET is_active = false WHERE expires_at < CURRENT_TIMESTAMP
        `;
    }
};

// Fee structure operations
export const feeDb = {
    async create(data: any) {
        const [fee] = await getDb()`
            INSERT INTO fee_structures (name, description, fee_type, fee_value, applies_to, recipient_wallet, tier_filter, priority, created_by)
            VALUES (${data.name}, ${data.description}, ${data.fee_type}, ${data.fee_value}, ${data.applies_to}, 
                    ${data.recipient_wallet}, ${data.tier_filter || null}, ${data.priority || 0}, ${data.created_by})
            RETURNING *
        `;
        return fee;
    },

    async list(appliesTo?: string) {
        if (appliesTo) {
            return await getDb()`
                SELECT * FROM fee_structures 
                WHERE is_active = true AND (applies_to = ${appliesTo} OR applies_to = 'all')
                ORDER BY priority ASC
            `;
        }
        return await getDb()`
            SELECT * FROM fee_structures WHERE is_active = true ORDER BY priority ASC
        `;
    },

    async update(id: number, data: any) {
        const [fee] = await getDb().unsafe(`
            UPDATE fee_structures 
            SET ${Object.entries(data).map(([k, v]) => `${k} = ${getDb().param(v)}`).join(', ')},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `);
        return fee;
    },

    async recordTransaction(data: any) {
        const [transaction] = await getDb()`
            INSERT INTO fee_transactions (user_id, license_id, fee_structure_id, transaction_type, 
                                         base_amount, fee_amount, total_amount, recipient_wallet, metadata)
            VALUES (${data.user_id || null}, ${data.license_id || null}, ${data.fee_structure_id}, 
                    ${data.transaction_type}, ${data.base_amount || null}, ${data.fee_amount}, 
                    ${data.total_amount}, ${data.recipient_wallet}, ${JSON.stringify(data.metadata || {})})
            RETURNING *
        `;
        return transaction;
    }
};

// Download operations
export const downloadDb = {
    async create(data: any) {
        const [download] = await getDb()`
            INSERT INTO downloads (user_id, license_id, file_name, file_version, download_token, 
                                  token_expires_at, ip_address, user_agent, fee_applied)
            VALUES (${data.user_id}, ${data.license_id}, ${data.file_name}, ${data.file_version}, 
                    ${data.download_token}, ${data.token_expires_at}, ${data.ip_address || null}, 
                    ${data.user_agent || null}, ${data.fee_applied || 0})
            RETURNING *
        `;
        return download;
    },

    async findByToken(token: string) {
        const [download] = await getDb()`
            SELECT * FROM downloads 
            WHERE download_token = ${token} 
            AND status = 'initiated'
            AND token_expires_at > CURRENT_TIMESTAMP
        `;
        return download;
    },

    async updateStatus(id: number, status: string) {
        await getDb()`
            UPDATE downloads 
            SET status = ${status}, 
                completed_at = CASE WHEN ${status} = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE id = ${id}
        `;
    },

    async listByUser(userId: number) {
        return await getDb()`
            SELECT * FROM downloads 
            WHERE user_id = ${userId} 
            ORDER BY started_at DESC 
            LIMIT 50
        `;
    }
};

// Cloud sync operations
export const cloudSyncDb = {
    async upsert(userId: number, licenseKey: string, dataType: string, dataKey: string, dataValue: any, deviceId?: string) {
        const [sync] = await getDb()`
            INSERT INTO cloud_sync (user_id, license_key, data_type, data_key, data_value, device_id, version)
            VALUES (${userId}, ${licenseKey}, ${dataType}, ${dataKey}, ${JSON.stringify(dataValue)}, ${deviceId || null}, 1)
            ON CONFLICT (user_id, data_type, data_key)
            DO UPDATE SET 
                data_value = ${JSON.stringify(dataValue)},
                version = cloud_sync.version + 1,
                synced_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        return sync;
    },

    async get(userId: number, dataType?: string) {
        if (dataType) {
            return await getDb()`
                SELECT * FROM cloud_sync 
                WHERE user_id = ${userId} AND data_type = ${dataType}
                ORDER BY synced_at DESC
            `;
        }
        return await getDb()`
            SELECT * FROM cloud_sync 
            WHERE user_id = ${userId}
            ORDER BY synced_at DESC
        `;
    },

    async delete(userId: number, dataType: string, dataKey: string) {
        await getDb()`
            DELETE FROM cloud_sync 
            WHERE user_id = ${userId} AND data_type = ${dataType} AND data_key = ${dataKey}
        `;
    }
};

// Audit log
export const auditDb = {
    async log(userId: number, action: string, resourceType: string, resourceId?: number, details?: any, ipAddress?: string, userAgent?: string) {
        await getDb()`
            INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
            VALUES (${userId}, ${action}, ${resourceType}, ${resourceId || null}, 
                    ${JSON.stringify(details || {})}, ${ipAddress || null}, ${userAgent || null})
        `;
    },

    async getLogs(filters: any = {}, limit: number = 100) {
        let query = getDb()`
            SELECT a.*, u.email, u.username 
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;

        if (filters.user_id) {
            query = getDb()`${query} AND a.user_id = ${filters.user_id}`;
        }
        if (filters.resource_type) {
            query = getDb()`${query} AND a.resource_type = ${filters.resource_type}`;
        }

        query = getDb()`${query} ORDER BY a.created_at DESC LIMIT ${limit}`;
        
        return await query;
    }
};

// System settings
export const settingsDb = {
    async get(key: string) {
        const [setting] = await getDb()`
            SELECT * FROM system_settings WHERE setting_key = ${key}
        `;
        return setting ? JSON.parse(setting.setting_value) : null;
    },

    async set(key: string, value: any, updatedBy?: number) {
        await getDb()`
            INSERT INTO system_settings (setting_key, setting_value, updated_by)
            VALUES (${key}, ${JSON.stringify(value)}, ${updatedBy || null})
            ON CONFLICT (setting_key)
            DO UPDATE SET 
                setting_value = ${JSON.stringify(value)},
                updated_by = ${updatedBy || null},
                updated_at = CURRENT_TIMESTAMP
        `;
    },

    async getAll(publicOnly: boolean = false) {
        if (publicOnly) {
            return await getDb()`SELECT * FROM system_settings WHERE is_public = true`;
        }
        return await getDb()`SELECT * FROM system_settings`;
    }
};

