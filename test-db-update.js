require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').update({ experience_years: 5 }).eq('id', '00000000-0000-0000-0000-000000000000').select();
  console.log("Error:", error);
  console.log("Data:", data);
}
check();
