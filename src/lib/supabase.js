import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === "your_supabase_project_url_here") {
  console.warn(
    "⚠️ Supabase URL not configured. Please add VITE_SUPABASE_URL to your .env file.\n" +
    "Get it from: supabase.com → Project Settings → API"
  );
}

export { supabaseUrl, supabaseAnonKey };

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
);
