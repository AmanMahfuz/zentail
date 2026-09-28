require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const email = "test_rls_" + Date.now() + "@example.com";
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: "password123!"
  });
  if (authError) return console.log("Auth Error:", authError);
  
  const userId = authData.user.id;
  // IMMEDIATELY UPDATE
  const { data: updateData, error: updateError } = await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId).select();
  console.log("Immediate update result:", updateError || updateData);
}
check();
