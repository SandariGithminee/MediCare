const db = require("../config/db");

async function migrateDoctors() {
  console.log("Migrating doctors table schema...");
  try {
    await db.query(`
      ALTER TABLE doctors 
      ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 4.8,
      ADD COLUMN IF NOT EXISTS photo TEXT,
      ADD COLUMN IF NOT EXISTS available_time VARCHAR(100) DEFAULT '9:00 AM - 5:00 PM';
    `);
    console.log("✅ Successfully updated doctors table with experience, rating, photo, and available_time");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

migrateDoctors();
