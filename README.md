# 🚨 KSR CampusGuard: Real-Time Emergency Ambulance & Campus Response System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite-blue.svg)](https://www.sqlite.org)
[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero%20External-success.svg)](#)

A high-reliability, real-time emergency dispatch and campus rescue platform purpose-built for **K.S. Rangasamy Educational Institutions (KSRCT, KSRCE, KSRCAS, KSR Dental & Hospital)** in Tiruchengode, Tamil Nadu.

KSR CampusGuard connects injured or distressed students and staff instantly with on-campus ambulances and medical teams through precise satellite GPS tracking, automated landmark detection, live audio-visual siren telemetry, and dynamic dispatch lifecycle management.

---

## ⚡ Highlights & Key Features

- 🛰️ **High-Accuracy GPS Satellite Locator**: One-tap geolocation capture with dynamic accuracy indicators and interactive OpenStreetMap preview.
- 🏫 **Nearest Campus Landmark Auto-Detection**: Uses Haversine spherical geometry across 16 major KSR campus buildings to automatically identify the nearest building/wing.
- 🚑 **Live Ambulance Driver Terminal**: Audio Hi-Lo emergency siren, live distance-to-patient tracking (meters/km), patient injury photo inspection, and 1-tap Google Maps turn-by-turn navigation.
- 🔄 **Automatic Sensor & Location Lifecycle**: Location tracking sensors and watchers automatically shut down when an emergency is marked `RESOLVED`. As soon as a new incident arrives, the system automatically awakens on-time.
- 📸 **Camera & Hazard Photo Capture**: Direct in-browser camera access (`capture="environment"`) with client-side canvas compression for rapid transmission even on 2G/3G mobile networks.
- 📡 **Dual-Engine Real-Time Sync**: Server-Sent Events (SSE) `/api/stream` supplemented by 2.5s fallback polling for uninterrupted connectivity across fluctuating mobile networks.
- 💾 **Dual-Storage Resilience**: Native high-speed SQLite database (`data/campusguard.db`) with automatic JSON snapshot mirroring (`data/incidents.json`).
- ⚡ **Zero-Install Architecture**: Built entirely with Node.js standard libraries (`node:http`, `node:sqlite`, `node:fs`). Runs instantly without running `npm install`.

---

## 🖥️ System Portals

| Portal | Endpoint | Description |
| :--- | :--- | :--- |
| **Student SOS Portal** | `/` (`student.html`) | Emergency report filing, camera photo upload, live GPS tracking, and real-time dispatch status tracker. |
| **Ambulance Terminal** | `/ambulance` (`ambulance.html`) | Real-time siren dispatch terminal, driver GPS tracking, distance calculator, turn-by-turn navigation, and status controls. |
| **Institutional Control** | `/control` (`control.html`) | Live incident queue, campus network QR code, public tunnel display, and master operations. |

---

## 🚀 Quick Start Guide

### Option 1: 1-Click Windows Launcher (Recommended)
Double-click **`START-KSR-CAMPUSGUARD.bat`** in the project folder. It will:
1. Locate your local Node.js environment automatically.
2. Launch the backend server on `http://0.0.0.0:5000`.
3. Open both the Student SOS Portal and Ambulance Terminal in your default browser.

### Option 2: Worldwide Cloudflare Tunnel
Double-click **`START-WORLDWIDE-ONLINE.bat`** to generate a secure, public HTTPS link via Cloudflare Tunnel for testing on mobile devices outside local Wi-Fi.

### Option 3: Manual Command Line
```bash
# Clone the repository
git clone https://github.com/udhayagiri380-bit/campus-guard.git
cd campus-guard

# Start the server (Requires Node.js 18+)
node server.js
```

Open `http://localhost:5000` in your web browser.

---

## 📱 Mobile Access on Campus Wi-Fi

1. Ensure your PC and mobile device are connected to the same Wi-Fi network (or mobile hotspot).
2. Look at the terminal output or the Control Center for your local IP (e.g., `http://192.168.29.59:5000`).
3. Scan the QR code or enter the URL into your mobile browser.

---

## 📂 Project Structure

```
campus-guard/
├── data/
│   ├── campusguard.db        # SQLite database
│   ├── contacts.json         # Emergency contacts registry
│   └── incidents.json        # Mirror JSON backup store
├── uploads/                  # Incident injury/hazard photo storage
├── ambulance.html            # Ambulance driver dispatch & navigation portal
├── app.js                    # Core client application logic
├── control.html              # Command & institutional control center
├── index.html                # Unified incident dashboard
├── manifest.json             # PWA progressive web app manifest
├── package.json              # Node.js project configuration
├── PROJECT-GUIDE.md          # Technical documentation & testing checklist
├── README.md                 # Public documentation
├── render.yaml               # Cloud deployment blueprint
├── server.js                 # Zero-dependency real-time HTTP + SQLite backend
├── START-KSR-CAMPUSGUARD.bat # 1-click Windows local launcher
├── START-WORLDWIDE-ONLINE.bat# 1-click Worldwide online tunnel launcher
├── student.html              # Student emergency SOS reporting portal
└── styles.css                # Universal design system & dark mode theme
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
Built with ❤️ for **K.S. Rangasamy Educational Institutions**.
