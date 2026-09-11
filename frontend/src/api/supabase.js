import { createClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://rgyetagqprwtehywtwlo.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneWV0YWdxcHJ3dGVoeXd0d2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzUwODksImV4cCI6MjEwMjk1MTA4OX0.hr_lIxeZU8S8wCwpinPt_s37pqTVCSyC2jbSK3OFtFQ";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
