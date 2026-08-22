const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_tAO1IjPn9rBx@ep-shiny-cherry-azu7od9r-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb',
    ssl: { rejectUnauthorized: false }
});

async function dumpSchema() {
    const tables = [
        'users', 'patients', 'doctors', 'appointments',
        'medical_records', 'laboratory', 'medicines',
        'admissions', 'staff', 'billing', 'audit_logs'
    ];

    for (const table of tables) {
        console.log(`\n=== TABLE: ${table} ===`);
        const cols = await pool.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [table]);

        cols.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name}) | Null: ${col.is_nullable} | Default: ${col.column_default}`);
        });
    }

    pool.end();
}

dumpSchema().catch(console.error);
