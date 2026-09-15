import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setup() {
  console.log("Checking buckets...");
  const { data: buckets } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(b => b.name === 'resumes')) {
    console.log("Creating 'resumes' bucket...");
    const { data, error } = await supabase.storage.createBucket('resumes', {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    })
    if (error) {
      console.error("Error creating bucket:", error)
    } else {
      console.log("Bucket created successfully:", data)
    }
  } else {
    console.log("'resumes' bucket already exists.")
  }
}

setup().catch(console.error);
