# 🚀 FoodReach AI — Local Execution Guide

This guide walks you through running all test suites locally on your development machine.

---

## 📋 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v20 LTS or v22 LTS | Runtime for Selenium + Appium tests |
| npm | v10+ | Package management |
| Java JDK | 17 (Temurin/OpenJDK) | Appium / Android SDK dependency |
| Android SDK | API Level 33 | Android emulator management |
| Google Chrome | Latest | Selenium headless browser |
| ChromeDriver | Matching Chrome version | Selenium WebDriver |
| Appium | v2.10+ | Android mobile automation |
| Git | 2.x | Source control |

---

## 🏗️ Project Structure

```
FOODREACH_PDD/
├── frontend/
│   └── selenium-tests/          ← Selenium E2E tests (420 TCs)
│       ├── tests/               ← 10 test suites
│       ├── reporter/            ← Excel & HTML report generators
│       ├── run-all.js           ← Master runner
│       └── package.json
│
├── automation/                  ← Appium E2E tests (510 TCs)
│   ├── tests/appium/            ← 9 Appium test suites
│   ├── pages/                   ← Page Object Model
│   ├── utils/                   ← Generators, logger, retry
│   ├── runners/                 ← masterRunner.ts
│   └── package.json
│
├── Vulnerability Test Results/  ← Security audit reports (pre-generated)
└── Test Results/                ← Generated during test execution
    ├── Excel/                   ← 4 Excel workbooks
    ├── HTML/                    ← HTML dashboards
    ├── JSON/                    ← execution-results.json
    ├── Screenshots/
    ├── Logs/
    └── Summary/
```

---

## 🌐 PART 1 — Selenium E2E Tests (Web Application)

### Step 1: Install Dependencies

```powershell
cd frontend/selenium-tests
npm install
```

### Step 2: Set the Target URL

```powershell
# Live GitHub Pages (recommended):
$env:BASE_URL = "https://nagaanjali0710.github.io/FOODREACH_PDD/"

# Local dev server:
$env:BASE_URL = "http://localhost:19006"
```

### Step 3: Run All 420 Test Cases

```powershell
node run-all.js
```

**What happens:**
1. Runs 10 test suites sequentially
2. Generates Excel workbooks in `Test Results/Excel/`
3. Generates HTML reports in `Test Results/HTML/`
4. Writes JSON to `Test Results/JSON/`

### Step 4: Run Individual Suites

```powershell
npm run login       # Login tests (50 TCs)
npm run donor       # Donor flow tests (60 TCs)
npm run admin       # Admin panel tests (60 TCs)
npm run security    # Security tests (30 TCs)
```

### Step 5: Generate Reports Only

```powershell
npm run report:excel   # 4 Excel workbooks
npm run report:html    # HTML execution report + dashboard
```

---

## 📱 PART 2 — Appium E2E Tests (Android Mobile)

### Step 1: Install Dependencies

```powershell
cd automation
npm install
```

### Step 2: Install Appium

```powershell
npm install -g appium@latest
appium driver install uiautomator2
```

### Step 3: Start Android Emulator

```powershell
emulator -avd Pixel_6_API_33 -no-snapshot -no-audio
```

### Step 4: Start Appium Server (new terminal)

```powershell
appium --port 4723 --base-path /wd/hub
```

### Step 5a: Simulation Mode (No Emulator)

```powershell
$env:SIMULATE_TESTS = "true"
npx ts-node runners/masterRunner.ts
```

### Step 5b: Real Emulator Mode

```powershell
$env:SIMULATE_TESTS = "false"
npx ts-node runners/runAppiumTests.ts
```

---

## 🔥 PART 3 — Load & Performance Testing

### k6 Baseline (100 VUs, 1 min)

```powershell
k6 run --env BASE_URL=https://foodreach-backend.onrender.com load-test.js
```

### JMeter

Open `Vulnerability Test Results/jmeter-test-plan.jmx` in Apache JMeter and run.

### Artillery

```powershell
artillery run "Vulnerability Test Results/artillery-load-test.yml" --target https://foodreach-backend.onrender.com
```

---

## 📊 Test Count Summary

| Suite | Tool | TCs |
|-------|------|-----|
| Selenium (10 suites) | Selenium/Mocha | **420** |
| Appium (9 suites) | Appium/TypeScript | **510** |
| **Grand Total** | | **930+** |

---

## 🛠️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://nagaanjali0710.github.io/FOODREACH_PDD/` | Selenium target URL |
| `SIMULATE_TESTS` | `true` | Appium simulation mode |
| `APPIUM_PORT` | `4723` | Appium server port |
| `GITHUB_RUN_NUMBER` | `local` | Build number for reports |

---

*FoodReach AI — Enterprise QA Framework v2.0.0*
