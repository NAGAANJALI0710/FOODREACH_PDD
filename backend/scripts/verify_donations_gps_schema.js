require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ocsgzbmnnldpcsbfgocz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_NdZzQBEthlCcKXp5c-tEQg_o5davYD8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyDonationsGpsSchema() {
  console.log('====================================================');
  console.log(' 🔍 SUPABASE GPS TRACKING SCHEMA VERIFICATION');
  console.log('====================================================');
  console.log(`URL: ${SUPABASE_URL}\n`);

  console.log('1. Checking driver location columns on public.donations table...');
  const { data: donData, error: donError } = await supabase
    .from('donations')
    .select('id, driver_latitude, driver_longitude, driver_last_updated, driver_tracking_status')
    .limit(1);

  let driverColumnsExist = false;
  if (donError) {
    console.log('   ❌ driver location columns check failed!');
    console.log('      Code:', donError.code);
    console.log('      Message:', donError.message);
  } else {
    driverColumnsExist = true;
    console.log('   ✅ driver_latitude, driver_longitude, driver_last_updated, and driver_tracking_status columns are PRESENT on donations table!');
  }

  console.log('\n====================================================');
  console.log(' 📊 VERIFICATION SUMMARY');
  console.log('====================================================');
  if (driverColumnsExist) {
    console.log('🎉 SCHEMA VERIFIED! Donations table contains all GPS tracking columns.');
  } else {
    console.log('⚠️ Run migration in Supabase SQL Editor:');
    console.log('   File: supabase/migrations/20260726000000_donations_live_tracking.sql');
  }
}

verifyDonationsGpsSchema();
