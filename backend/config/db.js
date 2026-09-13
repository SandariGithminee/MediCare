const dotenv = require("dotenv");
dotenv.config();

const { Pool } = require("pg");

function formatConnectionString(urlStr) {
  if (!urlStr) return "";
  let cleanUrl = urlStr.replace(/\?sslmode=\w+/, "").replace(/&sslmode=\w+/, "");

  const lastAtIndex = cleanUrl.lastIndexOf('@');
  const protocolIndex = cleanUrl.indexOf('://');

  if (protocolIndex !== -1 && lastAtIndex > protocolIndex + 3) {
    const protocol = cleanUrl.slice(0, protocolIndex + 3);
    const hostAndDb = cleanUrl.slice(lastAtIndex + 1);
    const userInfo = cleanUrl.slice(protocolIndex + 3, lastAtIndex);

    const firstColonIndex = userInfo.indexOf(':');
    if (firstColonIndex !== -1) {
      const user = userInfo.slice(0, firstColonIndex);
      const pass = userInfo.slice(firstColonIndex + 1);
      const encodedPass = encodeURIComponent(decodeURIComponent(pass));
      return `${protocol}${user}:${encodedPass}@${hostAndDb}`;
    }
  }
  return cleanUrl;
}

const rawUrl = process.env.DATABASE_URL || "";
const connectionString = formatConnectionString(rawUrl);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectDB = async () => {
  try {
    if (!connectionString) {
      console.warn("⚠️ DATABASE_URL is not provided or empty in environment variables.");
      return;
    }
    const client = await pool.connect();
    console.log("✅ Supabase PostgreSQL Connected successfully!");
    client.release();
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      // Only exit process in standalone local dev mode, not in serverless
      process.exit(1);
    }
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  connectDB,
};
