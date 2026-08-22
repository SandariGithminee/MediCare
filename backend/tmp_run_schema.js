const { Pool } = require('pg');
const fs = require('fs');

// Note: URL encoding %40 for @ and %23 for # in password Sandari@123#
const connectionString = 'postgresql://postgres:Sandari%40123%23@db.rgyetagqprwtehywtwlo.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runSchema() {
    try {
        const sql = fs.readFileSync('./schema.sql', 'utf8');
        await pool.query(sql);
        console.log("✅ Schema created successfully on Supabase!");
        pool.end();
    } catch (error) {
        console.error("❌ Error running schema:", error.message);
        process.exit(1);
    }
}

runSchema();
