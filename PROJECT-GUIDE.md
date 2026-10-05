# Student Emergency Ambulance Portal & KSR Institution Ambulance Portal

## 📌 Executive Summary
**KSR CampusGuard** is a mission-critical, real-time emergency response platform purpose-built for **K.S. Rangasamy Educational Institutions (KSRCT, KSRCE, KSRCAS, K.S.R. Dental College & Hospital)** in Tiruchengode, Tamil Nadu.

It bridges the communication gap between students/staff and the campus ambulance fleet by providing instant emergency alerts, camera photo uploads of injuries/hazards, live GPS campus mapping, and real-time dispatch progress tracking.

---

## 🛠️ Problems Identified & Rectified

| Original Problem | Root Cause Identified | Engineering Fix Applied |
| :--- | :--- | :--- |
| **Ambulance page does not receive student reports** | 1. `student.html` had a JavaScript syntax error (`if(r.ok)...` without `form.onsubmit`) preventing submission.<br>2. Old server only filtered on `Medical Emergency` and dropped other calls.<br>3. Zero photo upload capability existed in the form. | 1. Built an all-new modern, mobile-responsive **Student Emergency Portal** (`student.html`).<br>2. Built real-time Server-Sent Events (SSE) stream (`/api/stream`) + auto-sync.<br>3. Ambulance page now displays all emergencies with full caller details and siren alerts. |
| **Student picture report not working** | 1. No camera/file upload input existed in the UI.<br>2. Node.js backend default JSON limit (100KB) rejected base64 images.<br>3. Server lacked photo persistence and photo URL generation. | 1. Added HTML5 camera capture (`capture="environment"`) with live preview and canvas auto-compression.<br>2. Increased body parser capacity to **50 MB**.<br>3. Server saves photos to `uploads/<id>.jpg` and links them to SQLite database.<br>4. Ambulance driver terminal includes a high-resolution lightbox zoom modal. |
| **Backend not connecting successfully** | 1. `better-sqlite3` failed without C++ compiler / python build tools.<br>2. `START-KSR-CAMPUSGUARD.bat` crashed because `where node` failed if Node.js was not in Windows system PATH.<br>3. Missing `node_modules` caused `Cannot find module 'express'`. | 1. Replaced external native modules with **Node.js built-in SQLite (`node:sqlite`)** and zero-dependency HTTP server with dual JSON fallback.<br>2. Upgraded `START-KSR-CAMPUSGUARD.bat` with a smart multi-path Node locator (finds Playwright Node, Program Files, AppData, or Electron Node).<br>3. Zero `npm install` needed — runs 100% out of the box! |
| **Cross-platform Android & Windows public use** | Server previously bound to `localhost` which is unreachable by mobile phones on campus Wi-Fi. | Server now binds to `0.0.0.0` (all network interfaces). Prints the local Wi-Fi IP address (e.g. `http://192.168.29.59:5000/`) and displays an instant scan QR code for Android phones. |

---

## 🚀 How to Run the Website

### Method 1: Windows 1-Click Launch (Easiest)
1. Double-click **`START-KSR-CAMPUSGUARD.bat`** (located in `d:\Antigravity IDE\emergency-campus-dashboard\` or `D:\htme project\`).
2. The launcher will automatically find the Node runtime, start the server on Port 5000, and open both the **Student Portal** and **Ambulance Dispatch** in your default web browser.

### Method 2: Manual Terminal Launch
```powershell
node server.js
```
*(Or use the included Node executable in AppData/Playwright)*

---

## 🌐 URLs & Access Endpoints

### 💻 Windows Desktop (Local):
- **Student Emergency SOS Portal:** [http://localhost:5000/](http://localhost:5000/)
- **Ambulance Driver Dispatch Terminal:** [http://localhost:5000/ambulance](http://localhost:5000/ambulance)
- **Institutional Control Center:** [http://localhost:5000/control](http://localhost:5000/control)

### 📱 Android / Mobile Phone Access (Public Campus Wi-Fi / Hotspot):
Connect both your Windows PC and your Android phone to the same Wi-Fi network (or mobile hotspot):
- **Mobile SOS Portal:** `http://<YOUR-LAN-IP>:5000/` (e.g. `http://192.168.29.59:5000/`)
- **Mobile Ambulance Dashboard:** `http://<YOUR-LAN-IP>:5000/ambulance`
- Or simply scan the **QR Code** displayed on the Control Center page!

---

## 🧪 Live Verification Workflow (Tested & Verified)

1. **Student Reports Emergency:**
   - Open [http://localhost:5000/](http://localhost:5000/)
   - Select Emergency Category (e.g., **Medical / Injury**, **Accident / Crash**)
   - Select Urgency Level (**Critical** / **High**)
   - Select Campus Block (**KSRCT Main Administrative Block**) & Landmark (**Room 102 First Aid**)
   - Tap **"Fetch My Exact GPS Location"** or take a photo with camera
   - Enter Student Name, Roll No., Department, and Phone Number
   - Click **"SEND EMERGENCY SOS REPORT NOW"**
   - Result: Incident ID created (e.g., `KSR-237169-9DFF`) and the **Active Incident Ticket** live tracker appears on the student's screen with Step 1 active!

2. **Ambulance Receives Call in Real Time:**
   - Open [http://localhost:5000/ambulance](http://localhost:5000/ambulance)
   - Real-time synthesized Hi-Lo **ambulance siren alerts** the driver!
   - Red flashing banner displays the incoming emergency alert.
   - The student's uploaded photo is displayed with 1-click full-screen zoom.
   - Student contact has a direct **"Call Student"** button (`tel:...`).
   - Campus GPS map displays the patient's coordinates with a **"GPS Navigation"** route button.

3. **Ambulance Dispatched & Progress Sync:**
   - Ambulance driver clicks **"Accept & Dispatch Ambulance"**.
   - Driver status switches to `ACCEPTED`.
   - **Student's phone screen instantly updates** without page reload:
     - Step 2 (**Dispatched**) activates and pulses red!
     - Assigned Card appears: `Vehicle: TN-28-KSR-108 • ETA: 3 to 5 mins` with direct **"Call Driver"** button!
   - Driver clicks **"Mark Arrived on Scene"** -> Student screen shows Step 3 (**Arrived**).
   - Driver clicks **"Patient Picked Up"** -> Student screen shows Step 4 (**In Transit** to KSR Health Centre).
   - Driver clicks **"Handover Complete / Resolved"** -> Incident moves to Completed archive.

---

## 💾 Database Architecture

- **Primary Database:** Native SQLite via Node.js built-in `node:sqlite` (`data/campusguard.db`)
- **Redundant Backup:** Mirror JSON file storage (`data/incidents.json`)
- **Photo Storage:** Binary file directory (`uploads/<incident-id>.jpg`)
- **Real-Time Push:** Server-Sent Events (SSE) `/api/stream` with fallback automatic polling every 2.5 seconds.
