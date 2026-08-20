# 🔧 FoodReach AI — Troubleshooting Guide

Solutions to common issues encountered when running the FoodReach QA automation framework.

---

## 🌐 Selenium Issues

### ❌ "ChromeDriver not found" / "cannot find Chrome binary"

**Cause**: ChromeDriver version doesn't match installed Chrome.

**Fix**:
```powershell
# Check Chrome version:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version

# Update chromedriver to match:
npm install chromedriver@<your-chrome-major-version>

# Or use the auto-matching package:
npm install chromedriver@latest
```

---

### ❌ "ECONNREFUSED — No connection to http://localhost:9515"

**Cause**: ChromeDriver service failed to start.

**Fix**:
```powershell
# Kill any existing chromedriver processes:
taskkill /F /IM chromedriver.exe

# Then re-run tests:
node run-all.js
```

---

### ❌ Tests run but all fail with "Element not found"

**Cause**: Running against wrong URL or app not deployed.

**Fix**:
```powershell
# Verify the live URL is accessible:
curl -I https://nagaanjali0710.github.io/FOODREACH_PDD/

# Set correct BASE_URL:
$env:BASE_URL = "https://nagaanjali0710.github.io/FOODREACH_PDD/"
node run-all.js
```

---

### ❌ Excel report not generated — "Cannot find module 'exceljs'"

**Fix**:
```powershell
cd frontend/selenium-tests
npm install exceljs fs-extra
node reporter/excelReporter.js all
```

---

### ❌ "ENOENT: no such file or directory — results/"

**Cause**: Results directory missing.

**Fix**:
```powershell
cd frontend/selenium-tests
mkdir results
mkdir reports
node run-all.js
```

---

## 📱 Appium Issues

### ❌ "Could not connect to Appium server at localhost:4723"

**Cause**: Appium server not running.

**Fix**:
```powershell
# Start Appium in a new terminal:
appium --port 4723 --base-path /wd/hub --log-level info

# Verify it's running:
curl http://localhost:4723/wd/hub/status
```

---

### ❌ "No such driver: uiautomator2"

**Fix**:
```powershell
appium driver install uiautomator2
appium driver list
```

---

### ❌ "Emulator not found" / "No connected devices"

**Fix**:
```powershell
# List connected devices:
adb devices

# Start emulator manually:
emulator -avd Pixel_6_API_33 -no-snapshot -no-audio

# Wait for boot to complete:
adb wait-for-device
adb shell getprop sys.boot_completed
# Should return: 1
```

---

### ❌ "INSTALL_FAILED_ALREADY_EXISTS" during APK install

**Fix**:
```powershell
# Uninstall existing app first:
adb uninstall com.foodreachai.app

# Then install:
adb install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

### ❌ "TypeScript compilation error: Cannot find module 'fs-extra'"

**Fix**:
```powershell
cd automation
npm install fs-extra @types/fs-extra
npx ts-node runners/masterRunner.ts
```

---

## 🔥 Load Testing Issues

### ❌ "k6: command not found"

**Fix**:
```powershell
# Install via winget:
winget install k6

# Or via chocolatey:
choco install k6

# Verify:
k6 version
```

---

### ❌ k6 shows 100% error rate

**Cause**: Backend API is not running or rate-limited.

**Fix**:
```powershell
# Verify backend is accessible:
curl https://foodreach-backend.onrender.com/api/health

# Use correct BASE_URL:
k6 run --env BASE_URL=https://foodreach-backend.onrender.com load-test.js
```

---

### ❌ JMeter — "java.net.ConnectException: Connection refused"

**Fix**:
1. Open `Vulnerability Test Results/jmeter-test-plan.jmx`
2. Update the `HTTP Request` server name/IP field to your backend URL
3. Re-run the test plan

---

## 🤖 GitHub Actions Issues

### ❌ Pages deployment fails with "No artifact found"

**Fix**:
1. Ensure `frontend/dist/` is built: `cd frontend && npm run build`
2. Check that `upload-pages-artifact` step is not skipped
3. Verify `actions/configure-pages@v5` is called before upload

---

### ❌ Selenium tests fail in CI but pass locally

**Cause**: Chrome/ChromeDriver version mismatch in CI.

**Fix** (already handled in `deploy-and-test.yml`):
```yaml
- uses: browser-actions/setup-chrome@v1
- uses: nanasess/setup-chromedriver@v2
```

These actions auto-match Chrome and ChromeDriver versions.

---

### ❌ "Permission denied" for GitHub Pages

**Fix**:
1. Go to `Settings → Actions → General`
2. Under "Workflow permissions" → select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save and re-run the workflow

---

### ❌ Appium workflow stuck at "Start Emulator"

**Cause**: Emulator boot timeout in CI environment.

**Fix**: The workflow uses `SIMULATE_TESTS: true` by default to avoid this. For real emulator runs, the timeout is set to 5 minutes with `adb wait-for-device`.

---

### ❌ SSH "Host key verification failed" on push

**Fix**:
```powershell
# Add GitHub to known_hosts:
ssh-keyscan github.com 2>$null | Out-File -Append -FilePath "$env:USERPROFILE\.ssh\known_hosts" -Encoding ascii

# Re-try push:
git push origin main
```

---

## 📊 Report Generation Issues

### ❌ HTML report shows "0 tests"

**Cause**: `results/` directory is empty — test runner failed before writing JSON.

**Fix**:
```powershell
# Run tests first:
node run-all.js

# Then generate reports:
node reporter/excelReporter.js all
node reporter/htmlReporter.js
```

---

### ❌ Excel report has no data in "Failed Tests" sheet

This is expected behavior when all tests pass. The "Failed Tests" sheet only populates when `fail > 0`.

---

## 🆘 Still Stuck?

1. Check the GitHub Actions run log for the exact error message
2. Verify `node --version` outputs v20+ 
3. Run `npm install` in the failing directory
4. Check that environment variables are set correctly

---

*FoodReach AI — Enterprise QA Framework v2.0.0*
