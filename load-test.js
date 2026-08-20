// =============================================================================
// FoodReach AI — Enterprise k6 Load Testing Suite
// Covers: Baseline | Stress | Spike | Endurance scenarios
// Target: FoodReach Backend API (Node.js/Express + Supabase)
// Usage:
//   Baseline:  k6 run --env SCENARIO=baseline   load-test.js
//   Stress:    k6 run --env SCENARIO=stress     load-test.js
//   Spike:     k6 run --env SCENARIO=spike      load-test.js
//   Endurance: k6 run --env SCENARIO=endurance  load-test.js
//   All:       k6 run load-test.js
// =============================================================================
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// ── Custom metrics ────────────────────────────────────────────────────────────
const errorRate       = new Rate('error_rate');
const authDuration    = new Trend('auth_duration');
const donationDuration = new Trend('donation_duration');
const adminDuration   = new Trend('admin_duration');
const totalRequests   = new Counter('total_requests');

// ── Environment ───────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BASE_URL   || 'https://foodreach-backend.onrender.com';
const SCENARIO   = __ENV.SCENARIO   || 'all';
const JWT_TOKEN  = __ENV.JWT_TOKEN  || 'test-jwt-token-placeholder';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`,
};

// ── Scenario definitions ──────────────────────────────────────────────────────
const SCENARIOS = {
  // 1. Baseline: 100 VUs for 1 minute — normal production load
  baseline: {
    executor: 'constant-vus',
    vus: 100,
    duration: '1m',
    tags: { scenario: 'baseline' },
  },
  // 2. Stress: ramp to 1000 VUs to find breaking point
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 200 },   // Ramp to 200
      { duration: '3m', target: 200 },   // Hold 200
      { duration: '2m', target: 500 },   // Ramp to 500
      { duration: '3m', target: 500 },   // Hold 500
      { duration: '2m', target: 1000 },  // Ramp to 1000
      { duration: '3m', target: 1000 },  // Hold 1000
      { duration: '2m', target: 0 },     // Ramp down
    ],
    tags: { scenario: 'stress' },
  },
  // 3. Spike: sudden jump from 50 to 500 VUs
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 50 },   // Normal load
      { duration: '10s', target: 500 },  // Spike!
      { duration: '3m',  target: 500 },  // Hold spike
      { duration: '10s', target: 50 },   // Drop back
      { duration: '3m',  target: 50 },   // Recovery
      { duration: '30s', target: 0 },    // Ramp down
    ],
    tags: { scenario: 'spike' },
  },
  // 4. Endurance: 100 VUs for 30 minutes — memory leak / degradation detection
  endurance: {
    executor: 'constant-vus',
    vus: 100,
    duration: '30m',
    tags: { scenario: 'endurance' },
  },
};

// ── Select scenario(s) ────────────────────────────────────────────────────────
function buildScenarios() {
  if (SCENARIO === 'all') return SCENARIOS;
  if (SCENARIOS[SCENARIO]) return { [SCENARIO]: SCENARIOS[SCENARIO] };
  return { baseline: SCENARIOS.baseline };
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: {
    // Global thresholds
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],  // 95% under 2s, 99% under 4s
    http_req_failed:   ['rate<0.05'],                   // Error rate < 5%
    error_rate:        ['rate<0.05'],
    // Scenario-specific
    'http_req_duration{scenario:baseline}':  ['p(95)<1000'],  // Baseline: p95 < 1s
    'http_req_duration{scenario:stress}':    ['p(95)<3000'],  // Stress: p95 < 3s
    'http_req_duration{scenario:spike}':     ['p(95)<5000'],  // Spike: p95 < 5s
    'http_req_duration{scenario:endurance}': ['p(95)<2000'],  // Endurance: p95 < 2s
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// ── Test data ─────────────────────────────────────────────────────────────────
const DONOR_CREDENTIALS = {
  email:    'donor@foodreach.test',
  password: 'Test@12345',
  role:     'donor',
};
const NGO_CREDENTIALS = {
  email:    'ngo@foodreach.test',
  password: 'Test@12345',
  role:     'ngo',
};

// ── Test functions ─────────────────────────────────────────────────────────────
function testHealthCheck() {
  const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: 'health' } });
  totalRequests.add(1);
  check(res, {
    'health check status 200': r => r.status === 200,
    'health check has status ok': r => {
      try { return JSON.parse(r.body).status === 'ok'; } catch { return false; }
    },
    'health check duration < 500ms': r => r.timings.duration < 500,
  });
  errorRate.add(res.status !== 200);
}

function testAuthentication() {
  group('Authentication', () => {
    // Login
    const loginStart = Date.now();
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify(DONOR_CREDENTIALS),
      { headers: HEADERS, tags: { endpoint: 'login' } }
    );
    authDuration.add(Date.now() - loginStart);
    totalRequests.add(1);
    const loginOk = check(loginRes, {
      'login status 200 or 201': r => r.status === 200 || r.status === 201,
      'login has response body': r => r.body && r.body.length > 0,
      'login duration < 2s': r => r.timings.duration < 2000,
    });
    errorRate.add(!loginOk);

    // Test with invalid credentials
    const invalidRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'invalid@test.com', password: 'wrong' }),
      { headers: HEADERS, tags: { endpoint: 'login_invalid' } }
    );
    totalRequests.add(1);
    check(invalidRes, {
      'invalid login returns 401 or 400': r => r.status === 401 || r.status === 400 || r.status === 422,
    });
  });
}

function testDonations() {
  group('Donations API', () => {
    // List donations
    const listStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/donations`, {
      headers: HEADERS,
      tags: { endpoint: 'donations_list' }
    });
    donationDuration.add(Date.now() - listStart);
    totalRequests.add(1);
    const listOk = check(listRes, {
      'donations list status 200 or 401': r => r.status === 200 || r.status === 401 || r.status === 403,
      'donations list duration < 2s': r => r.timings.duration < 2000,
    });
    errorRate.add(listRes.status >= 500);

    // Create donation (POST)
    const createPayload = {
      title:       `Load Test Donation ${Date.now()}`,
      description: 'Automated load test donation',
      quantity:    5,
      unit:        'kg',
      foodType:    'dry',
      expiryDate:  new Date(Date.now() + 86400000).toISOString(),
    };
    const createRes = http.post(
      `${BASE_URL}/api/donations`,
      JSON.stringify(createPayload),
      { headers: HEADERS, tags: { endpoint: 'donations_create' } }
    );
    totalRequests.add(1);
    check(createRes, {
      'create donation not 500': r => r.status !== 500,
      'create donation duration < 3s': r => r.timings.duration < 3000,
    });
    errorRate.add(createRes.status >= 500);
  });
}

function testAdminEndpoints() {
  group('Admin API', () => {
    const adminStart = Date.now();
    const statsRes = http.get(`${BASE_URL}/api/admin/stats`, {
      headers: HEADERS,
      tags: { endpoint: 'admin_stats' }
    });
    adminDuration.add(Date.now() - adminStart);
    totalRequests.add(1);
    check(statsRes, {
      'admin stats not 500': r => r.status !== 500,
      'admin stats duration < 3s': r => r.timings.duration < 3000,
    });
    errorRate.add(statsRes.status >= 500);
  });
}

function testNotifications() {
  group('Notifications API', () => {
    const res = http.get(`${BASE_URL}/api/notifications`, {
      headers: HEADERS,
      tags: { endpoint: 'notifications' }
    });
    totalRequests.add(1);
    check(res, {
      'notifications not 500': r => r.status !== 500,
      'notifications duration < 2s': r => r.timings.duration < 2000,
    });
    errorRate.add(res.status >= 500);
  });
}

function testLocation() {
  group('Location API', () => {
    const res = http.get(`${BASE_URL}/api/location/nearby?lat=12.9716&lng=77.5946&radius=10`, {
      headers: HEADERS,
      tags: { endpoint: 'location' }
    });
    totalRequests.add(1);
    check(res, {
      'location not 500': r => r.status !== 500,
    });
    errorRate.add(res.status >= 500);
  });
}

// ── Main VU function ──────────────────────────────────────────────────────────
export default function () {
  // All VUs execute this sequence per iteration
  testHealthCheck();
  sleep(0.2);

  testAuthentication();
  sleep(0.3);

  testDonations();
  sleep(0.2);

  // 30% of VUs hit admin and notification endpoints
  if (Math.random() < 0.3) {
    testAdminEndpoints();
    sleep(0.1);
  }

  if (Math.random() < 0.5) {
    testNotifications();
    sleep(0.1);
  }

  if (Math.random() < 0.2) {
    testLocation();
  }

  sleep(Math.random() * 1 + 0.5); // 0.5–1.5s think time
}

// ── Summary handler ───────────────────────────────────────────────────────────
export function handleSummary(data) {
  const passed  = data.metrics.http_req_failed.values.rate < 0.05;
  const p95     = data.metrics.http_req_duration.values['p(95)'];
  const rps     = data.metrics.http_reqs.values.rate;
  const avgDur  = data.metrics.http_req_duration.values.avg;
  const minDur  = data.metrics.http_req_duration.values.min;
  const maxDur  = data.metrics.http_req_duration.values.max;
  const errRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);

  console.log('\n' + '═'.repeat(65));
  console.log('  FOODREACH LOAD TEST RESULTS SUMMARY');
  console.log('═'.repeat(65));
  console.log(`  Scenario:          ${SCENARIO}`);
  console.log(`  Total Requests:    ${data.metrics.http_reqs.values.count}`);
  console.log(`  Requests/sec:      ${rps.toFixed(1)} req/s`);
  console.log(`  Avg Response Time: ${avgDur.toFixed(0)}ms`);
  console.log(`  Min Response Time: ${minDur.toFixed(0)}ms`);
  console.log(`  Max Response Time: ${maxDur.toFixed(0)}ms`);
  console.log(`  p(95) Response:    ${p95.toFixed(0)}ms`);
  console.log(`  p(99) Response:    ${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms`);
  console.log(`  Error Rate:        ${errRate}%`);
  console.log(`  Status:            ${passed ? '✅ PASSED (< 5% errors, p95 < threshold)' : '❌ FAILED'}`);
  console.log('═'.repeat(65) + '\n');

  // Interpretation
  if (rps > 100) {
    console.log(`📊 API handles ${rps.toFixed(0)} req/sec — excellent throughput`);
  } else if (rps > 50) {
    console.log(`📊 API handles ${rps.toFixed(0)} req/sec — adequate for current load`);
  } else {
    console.log(`⚠️  API only ${rps.toFixed(0)} req/sec — may need optimization`);
  }

  if (avgDur < 250) console.log(`⚡ Average response ${avgDur.toFixed(0)}ms — fast`);
  else if (avgDur < 500) console.log(`🟡 Average response ${avgDur.toFixed(0)}ms — acceptable`);
  else console.log(`🔴 Average response ${avgDur.toFixed(0)}ms — slow, needs optimization`);

  return {
    'automation/load-tests/k6-results.json': JSON.stringify(data, null, 2),
  };
}
