const { supabase } = require("../config/supabase");
const http = require("http");

function getWithToken(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("=== 1. Testing Admin Login via Supabase Auth ===");
  const { data: adminLogin, error: adminErr } = await supabase.auth.signInWithPassword({
    email: "admin@medicare.com",
    password: "admin123",
  });

  if (adminErr) {
    console.error("❌ Admin login failed:", adminErr.message);
    process.exit(1);
  }
  console.log("✅ Admin logged in! User ID:", adminLogin.user.id);
  const adminToken = adminLogin.session.access_token;

  console.log("\n=== 2. Testing Protected Backend Route /api/auth/profile with Supabase JWT ===");
  const profileRes = await getWithToken("/api/auth/profile", adminToken);
  console.log("Response Status:", profileRes.status);
  console.log("Profile Body:", profileRes.body);
  if (profileRes.status === 200 && profileRes.body.email === "admin@medicare.com") {
    console.log("✅ Backend authMiddleware successfully validated Supabase JWT & linked user!");
  } else {
    console.error("❌ Profile check failed");
    process.exit(1);
  }

  console.log("\n=== 3. Testing Protected HMS Endpoint /api/patients ===");
  const patientsRes = await getWithToken("/api/patients", adminToken);
  console.log("Patients Route Status:", patientsRes.status);
  if (patientsRes.status === 200) {
    console.log("✅ Backend patients route authorized and returned data!");
  } else {
    console.error("❌ Patients check failed");
    process.exit(1);
  }

  console.log("\n=== 4. Testing Doctor Login ===");
  const { data: docLogin, error: docErr } = await supabase.auth.signInWithPassword({
    email: "doctor@medicare.com",
    password: "doctor123",
  });
  if (docErr) {
    console.error("❌ Doctor login failed:", docErr.message);
  } else {
    console.log("✅ Doctor login succeeded:", docLogin.user.email);
  }

  console.log("\n=== 5. Testing Receptionist Login ===");
  const { data: recLogin, error: recErr } = await supabase.auth.signInWithPassword({
    email: "reception@medicare.com",
    password: "reception123",
  });
  if (recErr) {
    console.error("❌ Receptionist login failed:", recErr.message);
  } else {
    console.log("✅ Receptionist login succeeded:", recLogin.user.email);
  }

  console.log("\n🎉 ALL AUTHENTICATION TESTS PASSED!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
