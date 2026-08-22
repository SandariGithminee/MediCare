const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_tAO1IjPn9rBx@ep-shiny-cherry-azu7od9r-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb',
    ssl: { rejectUnauthorized: false }
});

async function dumpSchemaDDL() {
    const tables = [
        'users', 'patients', 'doctors', 'appointments',
        'medical_records', 'laboratory', 'medicines',
        'admissions', 'staff', 'billing', 'audit_logs'
    ];

    let fullSql = '';

    for (const table of tables) {
        const cols = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        udt_name, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [table]);

        let colDefs = [];
        cols.rows.forEach(col => {
            let typeStr = col.data_type;
            if (col.data_type === 'USER-DEFINED') {
                typeStr = col.udt_name;
            } else if (col.data_type === 'ARRAY') {
                typeStr = 'TEXT[]'; // or whatever array element type
            } else if (col.udt_name === 'jsonb') {
                typeStr = 'JSONB';
            } else if (col.data_type === 'character varying') {
                typeStr = col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR(255)';
            } else if (col.data_type === 'timestamp without time zone') {
                typeStr = 'TIMESTAMP';
            } else if (col.data_type === 'timestamp with time zone') {
                typeStr = 'TIMESTAMPTZ';
            }

            let line = `  ${col.column_name} ${typeStr}`;
            if (col.column_default) {
                line += ` DEFAULT ${col.column_default}`;
            }
            if (col.is_nullable === 'NO') {
                line += ' NOT NULL';
            }
            colDefs.push(line);
        });

        let sql = `CREATE TABLE IF NOT EXISTS ${table} (\n${colDefs.join(',\n')}\n);\n\n`;
        fullSql += sql;
    }

    console.log(fullSql);
    fs.writeFileSync('schema.sql', fullSql);
    pool.end();
}

dumpSchemaDDL().catch(console.error);
