// supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oozbqgwmexotvlanaaav.supabase.co"; // From Supabase dashboard
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vemJxZ3dtZXhvdHZsYW5hYWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjMyMzksImV4cCI6MjA1OTY5OTIzOX0.Jhkx5ay4j7W8AFtJNlTKL-cTcX_9kqMTUp9mSstAiNI"; // From Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey);