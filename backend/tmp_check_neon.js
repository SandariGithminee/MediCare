const { Pool } = require('pg');

const neonPool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_tAO1IjPn9rBx@ep-shiny-cherry-azu7od9r-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb',
    ssl: { rejectUnauthorized: false }
});

const supabasePool = new Pool({
    connectionString: 'postgresql://postgres:Sandari%40123%23@db.rgyetagqprwtehywtwlo.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const tables = [
        'users', 'patients', 'doctors', 'appointments',
        'medical_records', 'laboratory', 'medicines',
        'admissions', 'staff', 'billing', 'audit_logs'
    ];

    console.log("Checking Neon tables data counts:");
    for (const table of tables) {
        const res = await neonPool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ${table}: ${res.rows[0].count} rows`);
    }

    neonPool.end();
    supabasePool.end();
}

main().catch(console.error);
