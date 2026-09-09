const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const id = "b891ffee-a868-4d8a-ab7c-e376f35bfdbb";
  const { data: interview, error: iError } = await supabase
    .from("interviews")
    .select(`
      *,
      applications (
        id,
        jobs (
          company,
          title,
          description
        ),
        resume_id
      )
    `)
    .eq("id", id)
    .single();

  console.log("Interview error:", iError);
  console.log("Interview:", interview);
}

test();
