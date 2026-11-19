const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jiaonpvcwhgdaklhepxv.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_KJP6fs3xaqClKpW1eNCrMQ_dj9w2y6J';
const client = createClient(url, key);

async function testConnection() {
  const { data, error } = await client.from('categories').select('*').limit(1);
  if (error) {
    console.error('Connection error:', error.message);
    process.exit(1);
  }
  console.log('SUCCESS: Supabase connected and table permissions verified!');
}

testConnection();
