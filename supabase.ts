// supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bwajuispehanidlotqov.supabase.co"; // From Supabase dashboard
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWp1aXNwZWhhbmlkbG90cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NDUxMjcsImV4cCI6MjA2MDIyMTEyN30.e3wg7EgYzQzObA4Pv6Tyu-AWSF74_7iewCphJgluLY0"; // From Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey);