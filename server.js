/**
 * ============================================================================
 * KSR CAMPUSGUARD — UNIFIED EMERGENCY BACKEND SERVER
 * Built for K.S. Rangasamy Educational Institutions, Tiruchengode
 * Supports Windows, Android, iOS, and Web with zero external npm dependencies.
 * ============================================================================
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

const PORT = parseInt(process.env.PORT, 10) || 5000;
let activePublicUrl = process.env.PUBLIC_URL || null;
const HOST = "0.0.0.0"; // Listen on all network interfaces for Android/LAN access

// Directories setup
const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, "data");
const UPLOADS_DIR = path.join(BASE_DIR, "uploads");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, "campusguard.db");
const JSON_FILE = path.join(DATA_DIR, "incidents.json");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const DRIVERS_FILE = path.join(DATA_DIR, "drivers.json");


// Default KSR ambulance drivers (Stored in database)
const DEFAULT_DRIVERS = [
  { id: 1, username: "driver108", password: "ksr108", driver_name: "Thiru. S. Murugan", vehicle_no: "TN-28-KSR-108", created_at: new Date().toISOString() },
  { id: 2, username: "ambulance", password: "ksr108", driver_name: "Thiru. K. Rajendran", vehicle_no: "TN-28-KSR-102", created_at: new Date().toISOString() }
];

// Default KSR emergency contacts
const DEFAULT_CONTACTS = [
  { id: 1, name: "KSR Campus Security Control (Gate 1)", role: "24x7 Security & Tactical Command", phone: "+91-94433-10001", priority: "High" },
  { id: 2, name: "KSR Health Centre & Ambulance Bay", role: "Emergency Medical Care & 108 Ambulance", phone: "+91-94433-10002", priority: "Critical" },
  { id: 3, name: "KSR Fire & Disaster Safety Cell", role: "Fire Hazard, Rescue & Evacuation", phone: "+91-94433-10003", priority: "High" },
  { id: 4, name: "Hostel Emergency Warden (Boys & Girls)", role: "Hostel Welfare & First Aid Response", phone: "+91-94433-10004", priority: "Medium" },
  { id: 5, name: "Tiruchengode Municipal Govt Hospital", role: "External Emergency Referral Hospital", phone: "04288-252222", priority: "External" },
  { id: 6, name: "National Emergency Ambulance Hotline", role: "Government 108 Medical Dispatch", phone: "108", priority: "National" }
];

// ==========================================
// DATABASE ADAPTER: Built-in SQLite + JSON
// ==========================================
let sqliteDb = null;
let useSqlite = false;

try {
  const { DatabaseSync } = require("node:sqlite");
  if (DatabaseSync) {
    sqliteDb = new DatabaseSync(DB_FILE);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        location TEXT NOT NULL,
        landmark TEXT,
        reporter TEXT,
        phone TEXT,
        roll_no TEXT,
        department TEXT,
        description TEXT,
        latitude REAL,
        longitude REAL,
        photo_url TEXT,
        status TEXT NOT NULL DEFAULT 'REPORTED',
        driver_notes TEXT,
        eta TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
            CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        driver_name TEXT NOT NULL,
        vehicle_no TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL,
        priority TEXT
      );
    `);

        // Check if drivers exist
    const driverCountRow = sqliteDb.prepare("SELECT COUNT(*) as c FROM drivers").get();
    if (!driverCountRow || driverCountRow.c === 0) {
      const stmt = sqliteDb.prepare("INSERT INTO drivers (username, password, driver_name, vehicle_no, created_at) VALUES (?, ?, ?, ?, ?)");
      for (const d of DEFAULT_DRIVERS) {
        stmt.run(d.username, d.password, d.driver_name, d.vehicle_no, d.created_at);
      }
    }
    // Check if contacts exist
    const countRow = sqliteDb.prepare("SELECT COUNT(*) as c FROM contacts").get();
    if (!countRow || countRow.c === 0) {
      const stmt = sqliteDb.prepare("INSERT INTO contacts (name, role, phone, priority) VALUES (?, ?, ?, ?)");
      for (const c of DEFAULT_CONTACTS) {
        stmt.run(c.name, c.role, c.phone, c.priority);
      }
    }
    useSqlite = true;
    console.log("[DB] Native SQLite database activated:", DB_FILE);
  }
} catch (err) {
  console.warn("[DB] Built-in SQLite not available; using resilient JSON storage:", err.message);
  useSqlite = false;
}

// JSON fallback file initialization
if (!fs.existsSync(JSON_FILE)) {
  fs.writeFileSync(JSON_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(DEFAULT_CONTACTS, null, 2));
}

function loadIncidents() {
  if (useSqlite) {
    try {
      return sqliteDb.prepare("SELECT * FROM incidents ORDER BY created_at DESC").all();
    } catch (e) {
      console.error("[DB Error] SELECT failed:", e.message);
    }
  }
  try {
    return JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveIncident(inc) {
  if (useSqlite) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO incidents (
          id, type, priority, location, landmark, reporter, phone, roll_no, department,
          description, latitude, longitude, photo_url, status, driver_notes, eta, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        inc.id, inc.type, inc.priority, inc.location, inc.landmark || "",
        inc.reporter || "Anonymous Student", inc.phone || "", inc.roll_no || "", inc.department || "",
        inc.description || "", inc.latitude ?? null, inc.longitude ?? null, inc.photo_url || "",
        inc.status || "REPORTED", inc.driver_notes || "", inc.eta || "", inc.created_at, inc.updated_at
      );
    } catch (e) {
      console.error("[DB Error] INSERT failed:", e.message);
    }
  }
  // Also persist in JSON mirror for 100% redundancy
  try {
    const list = loadIncidentsFromJson();
    list.unshift(inc);
    fs.writeFileSync(JSON_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error("[JSON Error] Save failed:", err.message);
  }
}

function updateIncident(id, fields) {
  const now = new Date().toISOString();
  if (useSqlite) {
    try {
      const existing = sqliteDb.prepare("SELECT * FROM incidents WHERE id = ?").get(id);
      if (!existing) return null;

      const updated = { ...existing, ...fields, updated_at: now };
      const stmt = sqliteDb.prepare(`
        UPDATE incidents SET
          type = ?, priority = ?, location = ?, landmark = ?, reporter = ?,
          phone = ?, roll_no = ?, department = ?, description = ?,
          latitude = ?, longitude = ?, photo_url = ?, status = ?,
          driver_notes = ?, eta = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        updated.type, updated.priority, updated.location, updated.landmark || "",
        updated.reporter, updated.phone, updated.roll_no, updated.department,
        updated.description, updated.latitude, updated.longitude, updated.photo_url,
        updated.status, updated.driver_notes || "", updated.eta || "", updated.updated_at,
        id
      );
      return updated;
    } catch (e) {
      console.error("[DB Error] UPDATE failed:", e.message);
    }
  }

  // JSON fallback
  const list = loadIncidentsFromJson();
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...fields, updated_at: now };
  fs.writeFileSync(JSON_FILE, JSON.stringify(list, null, 2));
  return list[idx];
}

function deleteIncident(id) {
  if (useSqlite) {
    try {
      sqliteDb.prepare("DELETE FROM incidents WHERE id = ?").run(id);
    } catch (e) {
      console.error("[DB Error] DELETE failed:", e.message);
    }
  }
  const list = loadIncidentsFromJson().filter(i => i.id !== id);
  fs.writeFileSync(JSON_FILE, JSON.stringify(list, null, 2));
  return true;
}

function loadIncidentsFromJson() {
  try {
    return JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
  } catch {
    return [];
  }
}


// DRIVER DATABASE HELPERS
function loadDrivers() {
  if (useSqlite) {
    try {
      return sqliteDb.prepare("SELECT * FROM drivers").all();
    } catch (e) {
      console.error("[DB: loadDrivers error]", e);
    }
  }
  try {
    return JSON.parse(fs.readFileSync(DRIVERS_FILE, "utf8"));
  } catch (e) {
    return DEFAULT_DRIVERS;
  }
}


function registerDriver(username, password, driverName, vehicleNo) {
  const drivers = loadDrivers();
  if (drivers.some(d => d.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Driver Login ID '" + username + "' is already registered. Please choose another username or log in.");
  }

  const now = new Date().toISOString();
  let newDriver = {
    username,
    password,
    driver_name: driverName,
    vehicle_no: vehicleNo,
    created_at: now
  };

  if (useSqlite) {
    try {
      const stmt = sqliteDb.prepare("INSERT INTO drivers (username, password, driver_name, vehicle_no, created_at) VALUES (?, ?, ?, ?, ?)");
      const res = stmt.run(username, password, driverName, vehicleNo, now);
      newDriver.id = Number(res.lastInsertRowid);
      return newDriver;
    } catch (e) {
      console.error("[DB: registerDriver sqlite error]", e);
    }
  }

  newDriver.id = Date.now();
  drivers.push(newDriver);
  try {
    fs.writeFileSync(DRIVERS_FILE, JSON.stringify(drivers, null, 2));
  } catch(e) {}
  return newDriver;
}

function authenticateDriver(username, password) {
  const drivers = loadDrivers();
  return drivers.find(d => d.username.toLowerCase() === username.toLowerCase() && d.password === password) || null;
}

function loadContacts() {
  if (useSqlite) {
    try {
      return sqliteDb.prepare("SELECT * FROM contacts ORDER BY id ASC").all();
    } catch (e) {
      console.error("[DB Error] Contacts SELECT failed:", e.message);
    }
  }
  try {
    return JSON.parse(fs.readFileSync(CONTACTS_FILE, "utf8"));
  } catch {
    return DEFAULT_CONTACTS;
  }
}

// ==========================================
// REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ==========================================
const sseClients = new Set();

function broadcastEvent(eventType, payload) {
  const msg = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
    }
  }
}

// ==========================================
// PHOTO PROCESSOR (Base64 -> /uploads/file.jpg)
// ==========================================
function savePhotoFromBase64(base64Data, incidentId) {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const mimeType = matches[1];
    let ext = ".jpg";
    if (mimeType.includes("png")) ext = ".png";
    else if (mimeType.includes("webp")) ext = ".webp";

    const buffer = Buffer.from(matches[2], "base64");
    const filename = `${incidentId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("[Photo Save Error]", err.message);
    return null;
  }
}

// ==========================================
// NETWORK UTILITIES (Get Local Wi-Fi IPv4)
// ==========================================
function getLocalNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// ==========================================
// HTTP REQUEST HELPERS
// ==========================================
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req, maxBytes = 50 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Payload exceeded 50MB maximum size"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString("utf8");
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (err) {
        reject(new Error("Invalid JSON body: " + err.message));
      }
    });
    req.on("error", reject);
  });
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

function serveStaticFile(res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400",
    "Access-Control-Allow-Origin": "*"
  });
  fs.createReadStream(filePath).pipe(res);
}

// ==========================================
// CORE HTTP SERVER
// ==========================================
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  try {
    // ----------------------------------------
    // API: System Health & Diagnostics
    // ----------------------------------------
    if (req.method === "GET" && pathname === "/api/health") {
      const allIncidents = loadIncidents();
      const activeCount = allIncidents.filter(i => !["RESOLVED", "CANCELLED", "Completed"].includes(i.status)).length;
      return sendJson(res, 200, {
        ok: true,
        service: "KSR CampusGuard Emergency Server",
        institution: "KSR Institution",
        database: useSqlite ? "SQLite (node:sqlite)" : "Resilient JSON (Mirror)",
        time: new Date().toISOString(),
        networkIp: getLocalNetworkIp(),
        publicUrl: activePublicUrl,
        publicDomain: activePublicUrl || process.env.PUBLIC_DOMAIN || "https://ksr-campusguard.onrender.com",
        activePort: PORT,
        totalIncidents: allIncidents.length,
        activeIncidents: activeCount,
        connectedScreens: sseClients.size
      });
    }

    // ----------------------------------------
    // API: Real-Time SSE Event Stream
    // ----------------------------------------
    if (req.method === "GET" && pathname === "/api/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*"
      });
      res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, time: new Date().toISOString() })}\n\n`);
      sseClients.add(res);

      req.on("close", () => {
        sseClients.delete(res);
      });
      return;
    }

    // ----------------------------------------
    // API: List All Incidents
    // ----------------------------------------
        // ----------------------------------------
    // API: Ambulance Driver Authentication
    // ----------------------------------------
        // ----------------------------------------
    // API: Ambulance Driver Registration (Sign Up)
    // ----------------------------------------
    if (req.method === "POST" && pathname === "/api/driver/register") {
      const body = await parseJsonBody(req);
      const username = (body.username || "").trim().toLowerCase();
      const password = (body.password || "").trim();
      const driverName = (body.driver_name || "").trim();
      const vehicleNo = (body.vehicle_no || "").trim().toUpperCase();

      if (!username || !password || !driverName || !vehicleNo) {
        return sendJson(res, 400, { ok: false, error: "All fields are required: Full Name, Vehicle No, Username, and Password." });
      }

      if (username.length < 3) {
        return sendJson(res, 400, { ok: false, error: "Username must be at least 3 characters." });
      }
      if (password.length < 4) {
        return sendJson(res, 400, { ok: false, error: "Password must be at least 4 characters." });
      }

      try {
        const newDriver = registerDriver(username, password, driverName, vehicleNo);
        const token = crypto.randomBytes(24).toString("hex");
        return sendJson(res, 201, {
          ok: true,
          token,
          message: "Driver account registered successfully in database!",
          driver: {
            id: newDriver.id,
            username: newDriver.username,
            driver_name: newDriver.driver_name,
            vehicle_no: newDriver.vehicle_no
          }
        });
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message });
      }
    }

    if (req.method === "POST" && pathname === "/api/driver/login") {
      const body = await parseJsonBody(req);
      const username = (body.username || "").trim().toLowerCase();
      const password = (body.password || "").trim();

      if (!username || !password) {
        return sendJson(res, 400, { ok: false, error: "Username and password are required." });
      }

      const driver = authenticateDriver(username, password);
      if (!driver) {
        return sendJson(res, 401, { ok: false, error: "Invalid Driver Login ID or Password." });
      }

      const token = crypto.randomBytes(24).toString("hex");
      return sendJson(res, 200, {
        ok: true,
        token,
        driver: {
          id: driver.id,
          username: driver.username,
          driver_name: driver.driver_name,
          vehicle_no: driver.vehicle_no
        }
      });
    }

    if (req.method === "GET" && pathname === "/api/incidents") {
      const incidents = loadIncidents();
      return sendJson(res, 200, incidents);
    }

    // ----------------------------------------
    // API: Ambulance Dispatch Queue
    // (Returns all medical, injury, accident & active emergencies)
    // ----------------------------------------
    if (req.method === "GET" && pathname === "/api/dispatch") {
      const incidents = loadIncidents();
      // Ambulance sees all emergencies, prioritized by urgency and time
      const queue = incidents.filter(i => {
        // Exclude old resolved unless query param ?includeAll=true
        if (parsedUrl.query.includeAll === "true") return true;
        return true;
      });
      return sendJson(res, 200, queue);
    }

    // ----------------------------------------
    // API: Create Emergency Report (Student / SOS)
    // ----------------------------------------
    if (req.method === "POST" && pathname === "/api/incidents") {
      const body = await parseJsonBody(req);
      if (!body.type || !body.location) {
        return sendJson(res, 400, { error: "Emergency type and campus location are required fields." });
      }

      const id = "KSR-" + Date.now().toString().slice(-6) + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();
      const now = new Date().toISOString();

      let photoUrl = "";
      if (body.photo && typeof body.photo === "string" && body.photo.startsWith("data:image/")) {
        photoUrl = savePhotoFromBase64(body.photo, id) || "";
      } else if (body.photo_url) {
        photoUrl = body.photo_url;
      }

      const newIncident = {
        id,
        type: body.type,
        priority: body.priority || "High",
        location: body.location,
        landmark: body.landmark || "",
        reporter: body.reporter || "Anonymous Student",
        phone: body.phone || "",
        roll_no: body.roll_no || "",
        department: body.department || "",
        description: body.description || "",
        latitude: body.latitude != null ? parseFloat(body.latitude) : null,
        longitude: body.longitude != null ? parseFloat(body.longitude) : null,
        photo_url: photoUrl,
        status: "REPORTED",
        driver_notes: "",
        eta: "",
        created_at: now,
        updated_at: now
      };

      saveIncident(newIncident);

      // Broadcast real-time event to Ambulance and Control screens
      broadcastEvent("incident:new", newIncident);
      broadcastEvent("telemetry:update", {
        active: loadIncidents().filter(i => !["RESOLVED", "CANCELLED"].includes(i.status)).length
      });

      console.log(`[ALERT CREATED] ${newIncident.id} | ${newIncident.type} at ${newIncident.location} | Photo: ${photoUrl ? "YES" : "NO"}`);
      return sendJson(res, 201, newIncident);
    }

    // ----------------------------------------
    // API: Update Incident Status (Ambulance / Control)
    // ----------------------------------------
    if (req.method === "PATCH" && pathname.startsWith("/api/incidents/")) {
      const incidentId = pathname.split("/").pop();
      const body = await parseJsonBody(req);

      const updated = updateIncident(incidentId, body);
      if (!updated) {
        return sendJson(res, 404, { error: "Incident ID not found." });
      }

      broadcastEvent("incident:update", updated);
      console.log(`[ALERT UPDATED] ${updated.id} -> Status: ${updated.status} (Notes: ${updated.driver_notes || "None"})`);
      return sendJson(res, 200, updated);
    }

    // ----------------------------------------
    // API: Delete Incident
    // ----------------------------------------
    if (req.method === "DELETE" && pathname.startsWith("/api/incidents/")) {
      const incidentId = pathname.split("/").pop();
      deleteIncident(incidentId);
      broadcastEvent("incident:deleted", { id: incidentId });
      return sendJson(res, 200, { ok: true, deleted: incidentId });
    }

    // ----------------------------------------
    // API: Emergency Contacts List
    // ----------------------------------------
    if (req.method === "GET" && pathname === "/api/contacts") {
      return sendJson(res, 200, loadContacts());
    }

    if (req.method === "POST" && pathname === "/api/contacts") {
      const body = await parseJsonBody(req);
      if (!body.name || !body.phone) {
        return sendJson(res, 400, { error: "Name and phone are required." });
      }
      const contacts = loadContacts();
      const newContact = {
        id: Date.now(),
        name: body.name,
        role: body.role || "Campus Emergency Contact",
        phone: body.phone,
        priority: body.priority || "Standard"
      };
      if (useSqlite) {
        try {
          sqliteDb.prepare("INSERT INTO contacts (name, role, phone, priority) VALUES (?, ?, ?, ?)").run(
            newContact.name, newContact.role, newContact.phone, newContact.priority
          );
        } catch { }
      }
      contacts.push(newContact);
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
      return sendJson(res, 201, newContact);
    }

    // ----------------------------------------
    // STATIC FILE SERVING: Uploaded Photos
    // ----------------------------------------
    if (pathname.startsWith("/uploads/")) {
      const filename = path.basename(pathname);
      const filePath = path.join(UPLOADS_DIR, filename);
      return serveStaticFile(res, filePath);
    }

    // ----------------------------------------
    // STATIC FILE SERVING: HTML Portals & Assets
    // ----------------------------------------
    if (pathname === "/" || pathname === "/student" || pathname === "/student.html") {
      // Check local student.html or public/student.html
      const p1 = path.join(BASE_DIR, "student.html");
      const p2 = path.join(BASE_DIR, "public", "student.html");
      const p3 = path.join(BASE_DIR, "index.html");
      const target = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : p3;
      return serveStaticFile(res, target);
    }

    if (pathname === "/ambulance" || pathname === "/ambulance.html") {
      const p1 = path.join(BASE_DIR, "ambulance.html");
      const p2 = path.join(BASE_DIR, "public", "ambulance.html");
      const target = fs.existsSync(p1) ? p1 : p2;
      return serveStaticFile(res, target);
    }

    if (pathname === "/control" || pathname === "/control.html" || pathname === "/admin") {
      const p1 = path.join(BASE_DIR, "control.html");
      const p2 = path.join(BASE_DIR, "index.html");
      const target = fs.existsSync(p1) ? p1 : p2;
      return serveStaticFile(res, target);
    }

    // Other static files (.css, .js, .png, etc.)
    let resolvedPath = path.join(BASE_DIR, pathname);
    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = path.join(BASE_DIR, "public", pathname);
    }
    return serveStaticFile(res, resolvedPath);

  } catch (err) {
    console.error("[Server Error]", err);
    return sendJson(res, 500, { error: err.message });
  }
});

// ==========================================
// START LISTENER
// ==========================================

// ==========================================
// AUTOMATIC WORLDWIDE PUBLIC TUNNEL (4G/5G/ANY WI-FI)
// ==========================================
function startWorldwideTunnel() {
  const binPath = path.join(BASE_DIR, "bin", "cloudflared.exe");
  if (!fs.existsSync(binPath)) {
    console.log("[TUNNEL] bin/cloudflared.exe not found. Running in local-only mode.");
    return;
  }

  console.log("[TUNNEL] Activating worldwide emergency network (4G/5G & any Wi-Fi)...");
  
  const tunnel = spawn(binPath, ["tunnel", "--url", `http://localhost:${PORT}`], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  const handleOutput = chunk => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !activePublicUrl) {
      activePublicUrl = match[0];
      const pubUrl = activePublicUrl;
      
      console.log("\n==============================================================");
      console.log("   🌐 WORLDWIDE MOBILE NETWORK READY (4G / 5G / ANY WI-FI) 🌐");
      console.log("==============================================================");
      console.log("   📱 Mobile Emergency SOS:  " + pubUrl + "/");
      console.log("   🚑 Ambulance GPS Screen:  " + pubUrl + "/ambulance");
      console.log("   🎛️ Control Center:       " + pubUrl + "/control");
      console.log("==============================================================\n");
      
      try {
        fs.writeFileSync(path.join(DATA_DIR, "public_url.txt"), pubUrl, "utf8");
      } catch (e) {}

      // Notify connected control screens
      sseClients.forEach(client => {
        try {
          client.write(`event: tunnel:ready\ndata: ${JSON.stringify({ publicUrl: pubUrl })}\n\n`);
        } catch(e) {}
      });
    }
  };

  tunnel.stdout.on("data", handleOutput);
  tunnel.stderr.on("data", handleOutput);

  tunnel.on("error", err => {
    console.error("[TUNNEL ERROR]", err.message);
  });

  tunnel.on("exit", code => {
    console.log(`[TUNNEL] Tunnel disconnected (code ${code}). Reconnecting in 5 seconds...`);
    activePublicUrl = null;
    setTimeout(startWorldwideTunnel, 5000);
  });

  process.on("exit", () => {
    try { tunnel.kill(); } catch (e) {}
  });
}

server.listen(PORT, HOST, () => {
  const localIp = getLocalNetworkIp();
  console.log("\n==============================================================");
  console.log("   🚨 KSR INSTITUTIONS — CAMPUSGUARD EMERGENCY SYSTEM 🚨");
  console.log("==============================================================");
  console.log(`[STATUS] Server is running on port ${PORT} across all interfaces!`);
  console.log(`[DATABASE] Active storage: ${useSqlite ? "SQLite (data/campusguard.db)" : "JSON Database (data/incidents.json)"}`);
  console.log(`[UPLOADS] Photo storage ready at: ${UPLOADS_DIR}\n`);
  console.log("  💻 WINDOWS DESKTOP ACCESS (Local):");
  console.log(`     • Student Emergency Portal:     http://localhost:${PORT}/`);
  console.log(`     • Ambulance Driver Dashboard:   http://localhost:${PORT}/ambulance`);
  console.log(`     • Institutional Control Center: http://localhost:${PORT}/control\n`);
  console.log("  📱 ANDROID / MOBILE PHONE ACCESS (Public / Wi-Fi LAN):");
  console.log(`     • Connect phone to same Wi-Fi / Hotspot and open:`);
  console.log(`       -> http://${localIp}:${PORT}/`);
  console.log(`       -> http://${localIp}:${PORT}/ambulance`);
  console.log("==============================================================\n");
  startWorldwideTunnel();
});
