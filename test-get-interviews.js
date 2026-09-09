const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from("interviews")
    .select(`
      *,
      applications (
        id,
        jobs (
          company,
          title
        )
      )
    `)
    .order("scheduled_at", { ascending: true });

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
