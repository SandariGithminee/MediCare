const { supabase, bucketName } = require("../config/supabase");
const db = require("../config/db");

async function run() {
  console.log("Testing Supabase Storage on bucket:", bucketName);

  // First, ensure storage policies allow public access to the Uploads bucket
  try {
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Uploads Select'
        ) THEN
          CREATE POLICY "Public Access Uploads Select" ON storage.objects FOR SELECT USING (bucket_id = 'Uploads');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Uploads Insert'
        ) THEN
          CREATE POLICY "Public Access Uploads Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'Uploads');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Uploads Update'
        ) THEN
          CREATE POLICY "Public Access Uploads Update" ON storage.objects FOR UPDATE USING (bucket_id = 'Uploads');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Uploads Delete'
        ) THEN
          CREATE POLICY "Public Access Uploads Delete" ON storage.objects FOR DELETE USING (bucket_id = 'Uploads');
        END IF;
      END
      $$;
    `);
    console.log("Storage policies verified/applied.");
  } catch (err) {
    console.error("Policy check note:", err.message);
  }

  // Test file upload
  const testFileName = `test_${Date.now()}.txt`;
  const fileBuffer = Buffer.from("Hello Medicare Supabase Storage Uploads bucket!");

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(testFileName, fileBuffer, {
      contentType: "text/plain",
      upsert: true,
    });

  if (error) {
    console.error("❌ Upload error:", error);
  } else {
    console.log("✅ Upload successful:", data);
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName);
    console.log("Public URL:", urlData.publicUrl);
  }

  process.exit(0);
}

run();
