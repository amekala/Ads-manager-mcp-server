import { config } from 'dotenv';
import { db, pool } from '../db';
import { users, apiKeys } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

async function main() {
  try {
    console.log('Connecting to database...');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set'}`);

    // Make sure tables exist
    console.log('Creating or validating database schema...');
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'api_keys');
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables);
    
    // Create users table if not exists
    if (!existingTables.includes('users')) {
      console.log('Creating users table...');
      await pool.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Users table created');
    }
    
    // Create api_keys table if not exists
    if (!existingTables.includes('api_keys')) {
      console.log('Creating api_keys table...');
      await pool.query(`
        CREATE TABLE api_keys (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id),
          key_value TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          last_used TIMESTAMP,
          is_active BOOLEAN NOT NULL DEFAULT true,
          request_count INTEGER NOT NULL DEFAULT 0
        );
      `);
      console.log('API keys table created');
    }
    
    // List columns in users table for debugging
    console.log('Users table columns:');
    const usersColumnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);
    console.log(usersColumnsResult.rows);

    // Insert test user if not exists
    console.log('Checking for test user...');
    const userCheckResult = await pool.query(`
      SELECT id FROM users WHERE email = 'test@example.com';
    `);
    
    let userId: string;
    
    if (userCheckResult.rows.length === 0) {
      console.log('Creating test user...');
      const userInsertResult = await pool.query(`
        INSERT INTO users (email, password, role)
        VALUES ('test@example.com', 'testpassword', 'user')
        RETURNING id;
      `);
      userId = userInsertResult.rows[0].id;
      console.log(`Test user created with ID: ${userId}`);
    } else {
      userId = userCheckResult.rows[0].id;
      console.log(`Test user exists with ID: ${userId}`);
    }
    
    // Insert test API key if not exists
    const testApiKey = 'mDT3YY27XvHYeqvthyWenpI8WE78Ljxf';
    console.log('Checking for test API key...');
    const keyCheckResult = await pool.query(`
      SELECT id FROM api_keys WHERE key_value = $1;
    `, [testApiKey]);
    
    if (keyCheckResult.rows.length === 0) {
      console.log('Creating test API key...');
      const keyInsertResult = await pool.query(`
        INSERT INTO api_keys (user_id, key_value, name, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
      `, [userId, testApiKey, 'Test API key for development', true]);
      
      console.log(`Test API key created with ID: ${keyInsertResult.rows[0].id}`);
    } else {
      console.log(`Test API key exists with ID: ${keyCheckResult.rows[0].id}`);
    }

    console.log('Database seeded successfully!');
    console.log(`Test API Key: ${testApiKey}`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

main(); 