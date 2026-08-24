const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://rgyetagqprwtehywtwlo.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneWV0YWdxcHJ3dGVoeXd0d2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzUwODksImV4cCI6MjEwMjk1MTA4OX0.hr_lIxeZU8S8wCwpinPt_s37pqTVCSyC2jbSK3OFtFQ";
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "Uploads";

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
  supabase,
  bucketName,
};
