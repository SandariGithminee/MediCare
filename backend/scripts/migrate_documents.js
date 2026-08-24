const db = require("../config/db");

async function migrate() {
  console.log("Checking and migrating database schema for documents/attachments...");

  try {
    // 1. Add documents column to medical_records if not exists
    await db.query(`
      ALTER TABLE medical_records 
      ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("✅ medical_records.documents column verified/added");

    // 2. Add documents column to laboratory if not exists
    await db.query(`
      ALTER TABLE laboratory 
      ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("✅ laboratory.documents column verified/added");

    // 3. Add documents column to patients if not exists (for ID, insurance, etc.)
    await db.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("✅ patients.documents column verified/added");

    console.log("All document schema migrations completed successfully!");
  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
