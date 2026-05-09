import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// SQL Server Configuration
// Check if server is IP address (for TLS/SSL configuration)
// TLS/SSL doesn't allow IP address as ServerName, so we disable encryption for IP addresses
const isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(process.env.DB_SERVER || '');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: !isIPAddress, // Disable encrypt if using IP address (TLS doesn't allow IP as ServerName)
    trustServerCertificate: true, // Trust server certificate
    enableArithAbort: true // Enable arithmetic abort for better compatibility
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Global connection pool
let pool = null;

// Get or create pool
export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

// Test connection function
export async function testConnection() {
  try {
    if (!process.env.DB_SERVER || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error('SQL Server configuration missing. Check DB_SERVER, DB_USER, DB_PASSWORD, DB_NAME in .env');
    }

    // Test SQL Server connection
    const pool = await getPool();
    await pool.request().query('SELECT 1 as test');
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${process.env.DB_NAME} on ${process.env.DB_SERVER}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

// Export for backward compatibility
export { sql, pool };

export default {
  getPool,
  testConnection,
  sql
};