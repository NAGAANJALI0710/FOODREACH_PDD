// Cleaned up scratch file. Uses process.env.
require('dotenv').config();
console.log('Environment variable check:', Boolean(process.env.SUPABASE_SERVICE_KEY));
