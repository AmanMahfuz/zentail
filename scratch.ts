import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function main() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'applications' });
  console.log("RPC Error:", error);
  // fallback to standard REST query
  const { data: cols } = await supabase.from('applications').select('*').limit(0);
  console.log("No data found but here is the request");
}
main();
