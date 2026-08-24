const { supabase, bucketName } = require("../config/supabase");
const db = require("../config/db");

async function testAll() {
  console.log("--- 1. Testing Database Connection ---");
  const dbRes = await db.query("SELECT NOW() as time;");
  console.log("✅ DB Time:", dbRes.rows[0].time);

  console.log("\n--- 2. Testing Supabase Storage Bucket ---");
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error("❌ Bucket list error:", bErr);
  } else {
    console.log("✅ Available buckets:", buckets.map((b) => b.name));
  }

  console.log("\n--- 3. Testing Upload & Public URL in bucket:", bucketName, "---");
  const testBuffer = Buffer.from("MediCare Supabase Storage Verification Document");
  const testFile = `verification_${Date.now()}.txt`;
  const { data: uploadData, error: upErr } = await supabase.storage
    .from(bucketName)
    .upload(`system/${testFile}`, testBuffer, {
      contentType: "text/plain",
      upsert: true,
    });

  if (upErr) {
    console.error("❌ Upload test failed:", upErr);
  } else {
    console.log("✅ Uploaded test file:", uploadData.path);
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);
    console.log("✅ Public Download URL:", urlData.publicUrl);
  }

  console.log("\n--- 4. Verifying Table Columns ---");
  const mrCols = await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'documents';"
  );
  console.log("✅ medical_records.documents exists:", mrCols.rows.length > 0);

  const labCols = await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'laboratory' AND column_name = 'documents';"
  );
  console.log("✅ laboratory.documents exists:", labCols.rows.length > 0);

  process.exit(0);
}

testAll().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
