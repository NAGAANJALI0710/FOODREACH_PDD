# ⚙️ FoodReach AI — CI/CD Execution Guide

Complete guide to the GitHub Actions CI/CD pipeline that automatically builds, deploys, and tests the FoodReach AI platform.

---

## 🏗️ Workflow Overview

The repository contains **7 GitHub Actions workflows** in `.github/workflows/`:

| Workflow File | Trigger | Purpose |
|--------------|---------|---------|
| `deploy-and-test.yml` | push to `main`, PR, manual | **Primary**: Build → Deploy → Selenium E2E |
| `android-e2e.yml` | push, PR, daily schedule | **Android**: Build APK → Emulator → Appium E2E |
| `e2e.yml` | push to `main`, PR | **Unified E2E**: Selenium + Appium combined |
| `ci-load-testing.yml` | push, PR, manual | **Performance**: k6 load test |
| `security-review.yml` | push, PR, manual | **Security**: Semgrep + Trivy + Gitleaks |
| `deploy-reports.yml` | after tests | **Reports**: Publish to GitHub Pages |
| `selenium-e2e.yml` | push, PR | **Selenium-only**: Standalone runner |

---

## 🚀 PIPELINE 1: Deploy & Selenium E2E (`deploy-and-test.yml`)

### Full Execution Flow (21 Stages)

```
Stage 1:  Checkout Repository
Stage 2:  Setup Node.js v22
Stage 3:  Install Frontend Dependencies (npm ci)
Stage 4:  Build Application (Expo Web Export → dist/)
Stage 5:  Deploy to GitHub Pages
Stage 6:  Wait for CDN Propagation (15 seconds)
Stage 7:  Verify Live Deployment (HTTP 200 check × 12 retries)
Stage 8:  Install Selenium Test Dependencies
Stage 9:  Setup Chrome Headless
Stage 10: Setup ChromeDriver
Stage 11: Run 420+ Selenium E2E Test Cases
Stage 12: Generate Excel Reports (4 workbooks)
Stage 13: Generate HTML Reports
Stage 14: Write JSON Results
Stage 15: Write Markdown Summary
Stage 16: Upload Artifacts (30-day retention)
Stage 17: Publish GitHub Action Summary
Stage 18: Historical Results Archiving
```

### Prerequisites

Enable GitHub Pages in repository settings:

1. Go to `Settings → Pages`
2. Set **Source**: `GitHub Actions`
3. Save

### Required Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

These are already configured in the workflow.

### Trigger

```bash
git push origin main
```

The pipeline runs automatically on every push to `main`.

### Expected Output

After the pipeline completes:

- **Live URL**: `https://nagaanjali0710.github.io/FOODREACH_PDD/`
- **Artifacts**: Available in the GitHub Actions run page (30-day retention)
- **GitHub Summary**: Published in the Actions tab showing pass/fail table

---

## 📱 PIPELINE 2: Android Appium E2E (`android-e2e.yml`)

### Full Execution Flow

```
Stage 1:  Checkout Repository
Stage 2:  Setup Java 17 (Temurin)
Stage 3:  Setup Android SDK (API 33)
Stage 4:  Setup Node.js v22
Stage 5:  Install Android Dependencies
Stage 6:  Build Debug APK (Expo EAS / Gradle)
Stage 7:  Start Android Emulator (Pixel 6 API 33)
Stage 8:  Verify Emulator Readiness (adb wait-for-device)
Stage 9:  Install APK (adb install)
Stage 10: Start Appium Server (port 4723)
Stage 11: Verify Appium Health (HTTP /status)
Stage 12: Execute 510+ Appium E2E Test Cases
Stage 13: Capture Screenshots (on failure)
Stage 14: Capture Device Logs (adb logcat)
Stage 15: Generate Excel Report (4 workbooks)
Stage 16: Generate HTML Report
Stage 17: Generate JSON Report
Stage 18: Generate Markdown Summary
Stage 19: Upload Artifacts
Stage 20: Publish to GitHub Pages (reports/)
Stage 21: Publish GitHub Action Summary
```

### Simulation Mode

By default the workflow runs in **simulation mode** (no real emulator needed):

```yaml
env:
  SIMULATE_TESTS: "true"
```

To run against a real emulator, set `simulate: false` in the workflow_dispatch input.

### Schedule

Runs automatically every day at midnight UTC:

```yaml
schedule:
  - cron: "0 0 * * *"
```

---

## 🔒 PIPELINE 3: Security Review (`security-review.yml`)

### Tools Used

| Tool | Purpose |
|------|---------|
| Semgrep | Static code analysis (SAST) |
| Trivy | Container & dependency vulnerability scan |
| Gitleaks | Secret/credentials detection |
| Dependency Review | CVE check for npm packages |

### Failure Criteria

The pipeline **fails only** when Critical vulnerabilities are detected. Medium/Low findings generate warnings.

---

## 📊 Artifacts Generated Per Run

Every pipeline run uploads these artifacts (30-day retention):

```
foodreach-live-selenium-test-results-build-{N}/
├── Test Results/
│   ├── Excel/
│   │   ├── Automation_Test_Report.xlsx   ← Full 420 TC report
│   │   ├── Passed_Test_Cases.xlsx        ← Passed tests only
│   │   ├── Failed_Test_Cases.xlsx        ← Failed tests only
│   │   └── Summary_Report.xlsx           ← Metrics dashboard
│   ├── HTML/
│   │   ├── execution-report.html         ← Full HTML report
│   │   └── dashboard.html               ← Charts dashboard
│   ├── JSON/
│   │   └── execution-results.json        ← Machine-readable
│   ├── Screenshots/                      ← On failure captures
│   ├── Logs/                             ← Execution logs
│   └── Summary/
│       └── summary.md                    ← GitHub summary
```

---

## ✅ Pass / Fail Logic

| Condition | Pipeline Result |
|-----------|----------------|
| Deploy fails | ❌ FAIL |
| Appium startup fails | ❌ FAIL |
| Emulator startup fails | ❌ FAIL |
| APK install fails | ❌ FAIL |
| Pass rate ≥ 95% | ✅ PASS |
| Pass rate < 95% | ❌ FAIL |
| Critical security findings | ❌ FAIL |

---

## 🔧 Required Secrets (Optional)

These secrets enhance the pipeline but are not required:

| Secret | Purpose |
|--------|---------|
| `EXPO_TOKEN` | EAS Build authentication |
| `SUPABASE_URL` | Backend database connection |
| `SUPABASE_ANON_KEY` | Supabase anonymous API key |

Set in: `Settings → Secrets and variables → Actions`

---

## 🔄 Manual Trigger

Any workflow can be triggered manually:

1. Go to `Actions` tab in GitHub
2. Select the workflow
3. Click **Run workflow**
4. Choose branch and optional inputs

---

*FoodReach AI — Enterprise QA Framework v2.0.0*
