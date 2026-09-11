const http = require("http");

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
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
    if (bodyData) {
      req.write(JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function run() {
  console.log("=== 1. Testing Registration with 'admin' role (should be rejected) ===");
  const adminRegRes = await request(
    { path: "/api/auth/register", method: "POST" },
    {
      name: "Sneaky Admin",
      email: "hacker_admin@test.com",
      password: "password123",
      role: "admin",
      phone: "0771234567",
    }
  );
  console.log("Status:", adminRegRes.status);
  console.log("Body:", adminRegRes.body);
  if (adminRegRes.status === 400 && adminRegRes.body.message.includes("Admin accounts cannot be self-registered")) {
    console.log("✅ Admin self-registration correctly rejected!");
  } else {
    console.error("❌ Admin self-registration check failed!");
    process.exit(1);
  }

  console.log("\n=== 2. Testing Registration with 'nurse' role (should be Pending) ===");
  const testEmail = `testnurse_${Date.now()}@medicare.com`;
  const nurseRegRes = await request(
    { path: "/api/auth/register", method: "POST" },
    {
      name: "Test Nurse Florence",
      email: testEmail,
      password: "Password123!",
      role: "Nurse",
      phone: "0712345678",
      department: "Pediatrics",
    }
  );
  console.log("Status:", nurseRegRes.status);
  console.log("Body:", nurseRegRes.body);
  if (
    nurseRegRes.status === 201 &&
    nurseRegRes.body.status === "Pending" &&
    !nurseRegRes.body.token
  ) {
    console.log("✅ Nurse registered with status 'Pending' and no token issued!");
  } else {
    console.error("❌ Nurse registration failed!");
    process.exit(1);
  }
  const nurseUserId = nurseRegRes.body.id;

  console.log("\n=== 3. Attempting login as Pending Nurse (should be blocked with 403) ===");
  const nurseLoginRes = await request(
    { path: "/api/auth/login", method: "POST" },
    {
      email: testEmail,
      password: "Password123!",
    }
  );
  console.log("Status:", nurseLoginRes.status);
  console.log("Body:", nurseLoginRes.body);
  if (nurseLoginRes.status === 403 && nurseLoginRes.body.isPendingApproval) {
    console.log("✅ Unapproved login successfully blocked with 403 and requires_approval flag!");
  } else {
    console.error("❌ Pending user login was NOT blocked properly!");
    process.exit(1);
  }

  console.log("\n=== 4. Admin Login ===");
  // Try admin login with admin123 or password123
  let adminLoginRes = await request(
    { path: "/api/auth/login", method: "POST" },
    { email: "admin@medicare.com", password: "admin123" }
  );
  if (adminLoginRes.status !== 200) {
    adminLoginRes = await request(
      { path: "/api/auth/login", method: "POST" },
      { email: "admin@medicare.com", password: "password123" }
    );
  }
  console.log("Admin login status:", adminLoginRes.status);
  if (adminLoginRes.status !== 200 || !adminLoginRes.body.token) {
    console.error("❌ Admin login failed:", adminLoginRes.body);
    process.exit(1);
  }
  const adminToken = adminLoginRes.body.token;
  console.log("✅ Admin logged in successfully!");

  console.log("\n=== 5. Admin fetching registrations list ===");
  const listRes = await request({
    path: "/api/auth/registrations?status=Pending",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log("List status:", listRes.status);
  const registrations = Array.isArray(listRes.body) ? listRes.body : (listRes.body.registrations || []);
  console.log(`Pending registrations count: ${registrations.length}`);
  const foundPending = registrations.find((u) => u.email === testEmail);
  if (foundPending) {
    console.log("✅ Found newly registered nurse in pending list:", foundPending.name, foundPending.email);
  } else {
    console.error("❌ Newly registered user not found in registrations list! All users:", registrations);
    process.exit(1);
  }

  console.log("\n=== 6. Admin Approving registration ===");
  const approveRes = await request({
    path: `/api/auth/registrations/${nurseUserId}/approve`,
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log("Approve status:", approveRes.status);
  console.log("Approve body:", approveRes.body);
  if (approveRes.status === 200 && approveRes.body.user.status === "Approved") {
    console.log("✅ Registration approved successfully!");
  } else {
    console.error("❌ Approving registration failed!");
    process.exit(1);
  }

  console.log("\n=== 7. Approved Nurse Logging In ===");
  const approvedLoginRes = await request(
    { path: "/api/auth/login", method: "POST" },
    {
      email: testEmail,
      password: "Password123!",
    }
  );
  console.log("Login status:", approvedLoginRes.status);
  if (approvedLoginRes.status === 200 && approvedLoginRes.body.token) {
    console.log("✅ Approved nurse logged in successfully with token!");
  } else {
    console.error("❌ Approved nurse login failed:", approvedLoginRes.body);
    process.exit(1);
  }

  console.log("\n=== 8. Admin Cleaning Up (Deleting) Test User ===");
  const deleteRes = await request({
    path: `/api/auth/registrations/${nurseUserId}`,
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log("Delete status:", deleteRes.status);
  console.log("Delete body:", deleteRes.body);
  if (deleteRes.status === 200) {
    console.log("✅ Test nurse user cleaned up successfully!");
  } else {
    console.error("❌ Deleting test user failed!");
  }

  console.log("\n🎉 ALL ADMIN APPROVAL FLOW TESTS PASSED!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
