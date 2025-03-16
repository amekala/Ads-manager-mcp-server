import { db, pool } from '../db';
import { apiKeys, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function testApiKey(apiKeyValue: string) {
  try {
    console.log('Testing API key validation...');
    console.log(`API Key to test: ${apiKeyValue.substring(0, 4)}***`);

    // Query the database to find the API key
    const keyRecord = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.keyValue, apiKeyValue))
      .limit(1);

    if (!keyRecord || keyRecord.length === 0) {
      console.log('❌ API key not found in database');
      return;
    }

    const apiKeyData = keyRecord[0];
    
    if (!apiKeyData.isActive) {
      console.log('❌ API key is inactive');
      return;
    }

    console.log('✅ API key found and is active');
    console.log(`API Key ID: ${apiKeyData.id}`);
    console.log(`Created: ${apiKeyData.createdAt}`);
    console.log(`Last used: ${apiKeyData.lastUsed || 'Never'}`);
    console.log(`Request count: ${apiKeyData.requestCount || 0}`);

    // Get user data
    const userData = await db.select()
      .from(users)
      .where(eq(users.id, apiKeyData.userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Associated user found');
    console.log(`User ID: ${userData[0].id}`);
    console.log(`User email: ${userData[0].email}`);
    console.log(`User role: ${userData[0].role}`);

    // Update last used timestamp
    await db.update(apiKeys)
      .set({ 
        lastUsed: new Date(),
        requestCount: (apiKeyData.requestCount || 0) + 1
      })
      .where(eq(apiKeys.id, apiKeyData.id));

    console.log('✅ Updated API key usage stats');
    console.log('API key validation successful!');
    
  } catch (error) {
    console.error('Error testing API key:', error);
  } finally {
    await pool.end();
  }
}

// Default test API key from the screenshot or use command line arg
const apiKeyToTest = process.argv[2] || 'mDT3YY27XvHYeqvthyWenpI8WE78Ljxf';
testApiKey(apiKeyToTest); 