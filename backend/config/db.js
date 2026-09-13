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

const initTables = async (client) => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth_id UUID,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL DEFAULT '',
        role VARCHAR(50) DEFAULT 'Admin',
        status VARCHAR(20) DEFAULT 'Approved',
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        age INTEGER NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20) NOT NULL,
        address TEXT,
        blood_group VARCHAR(10),
        medical_history TEXT,
        emergency_contact VARCHAR(100),
        photo TEXT,
        documents JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        specialization VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        qualification VARCHAR(255),
        consultation_fee NUMERIC DEFAULT 0,
        experience INTEGER DEFAULT 0,
        rating NUMERIC(3,1) DEFAULT 4.8,
        photo TEXT,
        available_time VARCHAR(100) DEFAULT '9:00 AM - 5:00 PM',
        available_days TEXT[],
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medical_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        record_date DATE DEFAULT CURRENT_DATE,
        diagnosis TEXT NOT NULL,
        symptoms TEXT,
        vitals JSONB DEFAULT '{}'::jsonb,
        prescriptions JSONB DEFAULT '[]'::jsonb,
        treatment_plan TEXT,
        notes TEXT,
        documents JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS laboratory (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        test_name VARCHAR(255) NOT NULL,
        test_category VARCHAR(100) NOT NULL,
        sample_details TEXT,
        result_value TEXT,
        normal_range VARCHAR(100),
        unit VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Requested',
        requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        technician_notes TEXT,
        cost NUMERIC DEFAULT 0,
        documents JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medicines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        manufacturer VARCHAR(255),
        batch_number VARCHAR(100) NOT NULL,
        quantity_in_stock INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 10,
        unit_price NUMERIC DEFAULT 0,
        expiry_date DATE NOT NULL,
        location VARCHAR(100) DEFAULT 'Main Pharmacy',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admissions (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        room_number VARCHAR(50) NOT NULL,
        bed_number VARCHAR(50) NOT NULL,
        admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        discharge_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Admitted',
        reason TEXT,
        daily_rate NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        salary NUMERIC DEFAULT 0,
        join_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'Active',
        attendance JSONB DEFAULT '[]'::jsonb,
        leaves JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS billing (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        items JSONB DEFAULT '[]'::jsonb,
        total_amount NUMERIC DEFAULT 0,
        paid_amount NUMERIC DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_method VARCHAR(50) DEFAULT 'Cash',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        role VARCHAR(50),
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ All required database tables verified/initialized.");
  } catch (err) {
    console.warn("⚠️ initTables notice:", err.message);
  }
};

let initAttempted = false;

const connectDB = async () => {
  try {
    if (!connectionString) {
      console.warn("⚠️ DATABASE_URL is not provided or empty in environment variables.");
      return;
    }
    const client = await pool.connect();
    console.log("✅ Supabase PostgreSQL Connected successfully!");
    if (!initAttempted) {
      initAttempted = true;
      await initTables(client);
    }
    client.release();
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = {
  pool,
  query: async (text, params) => {
    if (!initAttempted && connectionString) {
      initAttempted = true;
      try {
        const client = await pool.connect();
        await initTables(client);
        client.release();
      } catch (e) {}
    }
    return pool.query(text, params);
  },
  connectDB,
};
