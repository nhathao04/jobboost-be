const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client for admin operations
let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  console.log("✅ Supabase admin client initialized");
} else {
  console.warn(
    "⚠️ Supabase credentials not found. Admin operations will be limited."
  );
}

module.exports = { supabase };
