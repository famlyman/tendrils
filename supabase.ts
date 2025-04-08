// supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL"; // From Supabase dashboard
const supabaseAnonKey = "YOUR_ANON_KEY"; // From Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey);