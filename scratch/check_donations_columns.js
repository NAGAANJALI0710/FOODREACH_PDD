const SUPABASE_URL = 'https://ocsgzbmnnldpcsbfgocz.supabase.co';
const ANON_KEY = 'sb_publishable_NdZzQBEthlCcKXp5c-tEQg_o5davYD8';

async function checkDonationsColumns() {
  console.log('=== Checking driver_latitude on donations Table ===');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/donations?select=id,driver_latitude,driver_longitude,driver_last_updated&limit=1`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    }
  });
  const status = res.status;
  const body = await res.json();
  console.log(`Status code: ${status}`);
  console.log('Response body:', JSON.stringify(body, null, 2));
}

checkDonationsColumns();
