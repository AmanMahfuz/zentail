require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const email = "test_rls_" + Date.now() + "@example.com";
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: "password123!"
  });
  if (authError) {
    console.log("Auth Error:", authError);
    return;
  }
  const userId = authData.user.id;
  console.log("Signed up user:", userId);

  // Try updating (wait a sec for trigger if exists)
  await new Promise(r => setTimeout(r, 1000));
  const { data: updateData, error: updateError } = await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId).select();
  console.log("Update result:", updateError || updateData);

  // Try inserting directly (to see if we get 403)
  const { data: insertData, error: insertError } = await supabase.from('profiles').insert({ id: userId, email: email, onboarding_completed: true }).select();
  console.log("Insert result:", insertError || insertData);
}
check();
