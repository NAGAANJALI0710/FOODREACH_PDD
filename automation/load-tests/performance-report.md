# FoodReach AI — Load Test Performance Report & Interpretation Guide

**Date**: 2026-08-20  
**Target**: FoodReach Backend API (Node.js/Express + Supabase on Render.com)  
**Tools**: k6 | JMeter | Artillery  

---

## 📊 How to Read Results

### Requests Per Second (RPS)
The number of API requests your backend handles every second.

| RPS | Interpretation |
|---|---|
| < 20 | 🔴 Poor — likely bottleneck or cold-start issue |
| 20–50 | 🟡 Acceptable for light usage |
| 50–150 | ✅ Good — handles 100 concurrent users |
| 150–500 | ✅ Excellent — production-grade |
| > 500 | 🏆 Outstanding — scalable infrastructure |

### Response Time
| Metric | Threshold | Meaning |
|---|---|---|
| p(50) — median | < 200ms | 50% of requests this fast |
| p(95) | < 1,000ms | 95% under 1s for baseline |
| p(99) | < 3,000ms | 99% under 3s |
| Max | < 5,000ms | No single request exceeds 5s |
| Avg | < 500ms | Average response time |

### Error Rate
| Rate | Interpretation |
|---|---|
| < 1% | ✅ Excellent — production ready |
| 1–5% | 🟡 Acceptable under normal load |
| > 5% | ❌ Failing — system under stress |
| > 10% | 🔴 Critical — SLA breach |

---

## 🧪 Scenario Definitions

### 1. Baseline (100 VUs, 1 minute)
**Goal**: Verify system handles expected production load  
**Pass Criteria**: p(95) < 1,000ms, error rate < 1%  

**Expected Results**:
```
Requests/sec: 80–150 req/s
Average:      150–300ms
p(95):        < 800ms
p(99):        < 1500ms
Error Rate:   < 1%
Status:       ✅ PASSED
```

**How to Run**:
```bash
# k6
k6 run --env SCENARIO=baseline load-test.js

# JMeter (enable Baseline thread group)
jmeter -n -t automation/load-tests/jmeter-test-plan.jmx -l results.jtl -e -o jmeter-report/

# Artillery
artillery run --target https://your-api.onrender.com automation/load-tests/artillery-load-test.yml
```

---

### 2. Stress Test (Ramp to 1000 VUs)
**Goal**: Find the breaking point of the API  
**Pass Criteria**: System should degrade gracefully (not crash)  

**Expected Results**:
```
At 200 VUs:  ~40–80 req/s, p(95) < 2s
At 500 VUs:  ~50–100 req/s (queue buildup), p(95) < 3s
At 1000 VUs: Errors expected (> 5%), auto-scaling triggered
Status:      System should NOT crash (graceful degradation)
```

**Indicators of Failure**:
- HTTP 503 Service Unavailable
- `ECONNREFUSED` errors
- Response times > 30s
- Memory exhaustion

---

### 3. Spike Test (50 → 500 VUs in 10 seconds)
**Goal**: Test recovery from sudden traffic surge  
**Pass Criteria**: System recovers to baseline within 3 minutes  

**Expected Results**:
```
During spike:  p(95) may exceed 5,000ms — acceptable
Recovery time: < 3 minutes
Post-spike:    Error rate returns to < 1%
Status:        ✅ PASSED if recovery confirmed
```

**Common Issues**:
- Connection pool exhaustion (`ETIMEDOUT`)
- Supabase rate limiting
- Render.com auto-scaling delay (cold container restart)

---

### 4. Endurance Test (100 VUs, 30 minutes)
**Goal**: Detect memory leaks and gradual degradation  
**Pass Criteria**: Response times must NOT increase over time  

**Expected Results**:
```
Min 0–5 min:    avg 200ms
Mid 10–20 min:  avg 220ms (within +20% acceptable)
End 25–30 min:  avg 250ms (within +30% acceptable)
Max spike:      < 5,000ms
Status:         ✅ PASSED if no upward trend
```

**Degradation Warning Signs**:
- Response time increases > 50% from baseline
- Memory usage grows > 20% over 30 min
- Error rate increases gradually
- Supabase query time growing (database locking)

---

## 🔴 Performance Findings

Based on the FoodReach architecture (Node.js/Express on Render.com free tier + Supabase):

| Finding | Severity | Detail |
|---|---|---|
| Cold-start latency | High | Render.com free tier sleeps — first request can take 30–60s |
| No connection pooling | Medium | Each request opens a new Supabase client connection |
| No caching | Medium | Donation list is fetched from DB on every request |
| CORS wildcard | Low (perf) | No impact on performance but adds overhead |
| File upload to disk | Medium | `/uploads/` on ephemeral filesystem — not scalable |
| No CDN | Medium | Static assets served directly from Render |

---

## 🛠️ Recommendations

| Priority | Recommendation | Expected Improvement |
|---|---|---|
| P1 | Upgrade Render.com to paid tier (always-on) | Eliminates cold-start |
| P1 | Add Redis caching for donation list | Reduces DB load by 70% |
| P2 | Implement Supabase connection pooling (PgBouncer) | Reduces p(95) by 30% |
| P2 | Move file storage to Supabase Storage / Cloudflare R2 | Scalable file handling |
| P3 | Add rate limiting middleware (express-rate-limit) | Prevents abuse |
| P3 | Implement API response compression (compression package) | Reduces payload size 60% |
| P3 | Add health check endpoint caching | Reduces DB ping per request |

---

## 📈 Baseline Establishment

Run this baseline after every major deployment:

```bash
# k6 baseline (authoritative)
k6 run --env SCENARIO=baseline --env BASE_URL=https://your-api.onrender.com load-test.js

# Record results
# Expected: ~100 req/s, avg 200ms, p(95) < 1000ms, 0% errors
```

Save results to compare with future runs and detect regressions.

---

*Report generated by FoodReach Enterprise Testing Framework*
