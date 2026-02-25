# Rive Device Testing Lab — Setup & Operations Guide

The device lab is located at Rive's San Francisco office. It provides physical devices for integration,
rendering accuracy, and performance testing of Rive across all supported platforms.

---

## Lab Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │                   Rive SF Device Lab                        │
  │                                                             │
  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐  │
  │  │  Hub Mac │   │ iOS rack │   │ Android  │   │ Windows│  │
  │  │ (runner) │   │ (USB hub)│   │  rack    │   │ tower  │  │
  │  └────┬─────┘   └────┬─────┘   └────┬─────┘   └───┬────┘  │
  │       │              │              │              │        │
  │       └──────────────┴──────────────┴──────────────┘       │
  │                    USB 3.0 / USB-C hub                      │
  └─────────────────────────────────────────────────────────────┘
                                │
                        GitHub Actions
                    (self-hosted runners)
```

---

## Device Inventory

See [`device-inventory.yml`](./device-inventory.yml) for the full, up-to-date list.

| Category | Device | OS | Purpose |
|---|---|---|---|
| iOS | iPhone 15 Pro | iOS 17 | Primary iOS runtime testing |
| iOS | iPhone 12 | iOS 16 | Legacy iOS compat |
| iOS | iPad Pro M2 | iPadOS 17 | Tablet layout testing |
| Android | Pixel 8 Pro | Android 14 | Primary Android testing |
| Android | Samsung Galaxy S21 | Android 13 | Samsung compat |
| Android | Pixel 5 | Android 12 | Legacy Android compat |
| macOS | Mac mini M2 | macOS 14 (Sonoma) | macOS desktop editor, macOS runner |
| Windows | Intel NUC i7 | Windows 11 | Windows desktop editor testing |
| Desktop | MacBook Pro M1 | macOS 13 (Ventura) | Legacy macOS compat |

---

## GitHub Actions Self-Hosted Runners

Each lab machine runs a GitHub Actions self-hosted runner. On triggers (e.g., nightly builds),
jobs are routed to the appropriate machine using runner labels.

### Runner Labels

| Machine | Label |
|---|---|
| Mac mini M2 | `lab-macos`, `lab-runner` |
| Intel NUC (Windows 11) | `lab-windows`, `lab-runner` |
| Hub Mac (orchestrator) | `lab-hub` |

### Runner Setup (repeat for each machine)

```bash
# 1. Download the runner
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-osx-arm64.tar.gz -L \
  https://github.com/actions/runner/releases/latest/download/actions-runner-osx-arm64.tar.gz
tar xzf actions-runner-osx-arm64.tar.gz

# 2. Configure (get token from: github.com/orgs/rive-app/settings/actions/runners/new)
./config.sh \
  --url https://github.com/rive-app \
  --token <RUNNER_TOKEN> \
  --name lab-macos \
  --labels lab-macos,lab-runner

# 3. Install as a service
sudo ./svc.sh install && sudo ./svc.sh start
```

---

## Mobile Device Management (MDM)

We use **Apple Business Manager + Jamf Pro** for iOS/macOS devices and
**Google Workspace MDM** for Android devices.

See [`mdm-config/enrollment.md`](./mdm-config/enrollment.md) for enrollment steps.

Key MDM policies:
- Developer mode enabled on all devices
- USB debugging enabled (Android)
- Automatic OS updates **disabled** (pinned OS versions)
- `rive-test-app` automatically provisioned on all iOS devices

---

## Running Tests on Lab Devices

### From GitHub Actions (automatic)

Lab tests are triggered by the `nightly.yml` workflow. To point a job to lab devices:

```yaml
jobs:
  ios-test:
    runs-on: [self-hosted, lab-macos]
    steps:
      - uses: actions/checkout@v4
      - name: Run iOS tests on iPhone 15 Pro
        run: |
          xcodebuild test \
            -project apps/ios-test/RiveTest.xcodeproj \
            -scheme RiveTest \
            -destination "platform=iOS,id=$(xcrun xctrace list devices 2>&1 | grep 'iPhone 15 Pro' | awk '{print $NF}')"
```

### Locally (USB)

```bash
# iOS (connected via USB)
xcrun devicectl device info details --device <UDID>

# Android (USB debugging enabled)
adb devices
adb shell am instrument -w com.rive.test/.TestRunner
```

---

## Device Maintenance

| Task | Frequency | Owner |
|---|---|---|
| OS version audit | Monthly | DevOps |
| Battery health check | Quarterly | DevOps |
| Runner token rotation | Every 90 days | DevOps |
| New device provisioning | As needed | DevOps |
| Failing device swap | On alert | On-call |

---

## Alerting

If a runner goes offline for > 15 minutes, a PagerDuty alert fires.
Check `infra/terraform/main.tf` for the CloudWatch alarm configuration.
