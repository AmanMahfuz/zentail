const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: apps } = await supabase.from("applications").select("id").limit(1);
  if (!apps || apps.length === 0) return console.log("No applications found to attach to");

  const { data, error } = await supabase
    .from("interviews")
    .insert({
      application_id: apps[0].id,
      round: 1,
      interview_type: "technical",
      scheduled_at: new Date().toISOString(),
      notes: "test",
      prep_status: "pending",
    })
    .select()
    .single();
    
  console.log("Error:", error);
}

test();
