require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  let query = supabase.from('properties').select('*');
  const searchQuery = "Miami";
  query = query.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
  
  const { data, error } = await query;
  console.log("DATA:", data ? data.map(d => d.title) : null);
  console.log("ERROR:", error);
}

run();
