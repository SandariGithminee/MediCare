const dotenv = require("dotenv");
dotenv.config();

const { Pool } = require("pg");

const rawUrl = process.env.DATABASE_URL || "";
const connectionString = rawUrl.replace(/\?sslmode=require/, "").replace(/&sslmode=require/, "");

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Neon PostgreSQL Connected successfully!");
    client.release();
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  connectDB,
};
