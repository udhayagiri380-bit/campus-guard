/**
 * ============================================================================
 * KSR INSTITUTIONS EMERGENCY CONTROL CENTER (ECC)
 * Campus Emergency Response Command & Operations Engine
 * K.S. Rangasamy Educational Institutions, Tiruchengode, Tamil Nadu
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================
  // 1. TACTICAL AUDIO SYNTHESIS ENGINE (Web Audio API)
  // ==========================================
  class TacticalAudioEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.activeSirenOsc = null;
      this.activeSirenGain = null;
      this.sirenInterval = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stopSiren();
      }
      return this.isMuted;
    }

    playBeep(freq = 880, duration = 0.08, type = 'sine', volume = 0.15) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playChime(type = 'success') {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = type === 'success' ? [523.25, 659.25, 783.99] : [440, 554.37, 659.25];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    }

    playRadioSquelch() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      // Bandpass filtered white noise to simulate high-gain VHF tactical radio squelch
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 2.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();

      setTimeout(() => {
        this.playBeep(920, 0.05, 'triangle', 0.1);
      }, 190);
    }

    startKlaxonSiren(durationSeconds = 6) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      this.stopSiren();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      let toggle = false;
      const startTime = this.ctx.currentTime;
      osc.frequency.setValueAtTime(450, startTime);

      this.sirenInterval = setInterval(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const targetFreq = toggle ? 780 : 440;
        osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.25);
        toggle = !toggle;
      }, 350);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.activeSirenOsc = osc;
      this.activeSirenGain = gain;

      setTimeout(() => {
        this.stopSiren();
      }, durationSeconds * 1000);
    }

    stopSiren() {
      if (this.sirenInterval) {
        clearInterval(this.sirenInterval);
        this.sirenInterval = null;
      }
      if (this.activeSirenGain && this.ctx) {
        this.activeSirenGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      }
      if (this.activeSirenOsc) {
        try {
          this.activeSirenOsc.stop(this.ctx.currentTime + 0.12);
        } catch (e) {
          // ignore
        }
        this.activeSirenOsc = null;
      }
    }

    playFireAlarm(durationSeconds = 4) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      this.stopSiren();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      let toggle = false;
      const startTime = this.ctx.currentTime;
      osc.frequency.setValueAtTime(800, startTime);

      this.sirenInterval = setInterval(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const targetFreq = toggle ? 1280 : 800;
        osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.18);
        toggle = !toggle;
      }, 200);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      this.activeSirenOsc = osc;
      this.activeSirenGain = gain;

      setTimeout(() => {
        this.stopSiren();
      }, durationSeconds * 1000);
    }

    playMedicalSiren(durationSeconds = 4) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      this.stopSiren();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      let toggle = false;
      const startTime = this.ctx.currentTime;
      osc.frequency.setValueAtTime(660, startTime);

      this.sirenInterval = setInterval(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(toggle ? 495 : 660, now);
        toggle = !toggle;
      }, 380);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      this.activeSirenOsc = osc;
      this.activeSirenGain = gain;

      setTimeout(() => {
        this.stopSiren();
      }, durationSeconds * 1000);
    }

    playDispatchChirp() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1100, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1550, now + 0.06);
      gain2.gain.setValueAtTime(0.18, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.12);
    }

    playEvacWarningPulse() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [0, 0.14, 0.28].forEach(delay => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, now + delay);
        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    }

    playSuccessTriad() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.14, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    }
  }

  // ==========================================
  // 2. DATA STATE INITIALIZATION (KSR CAMPUS)
  // ==========================================
  const audio = new TacticalAudioEngine();

  const state = {
    threatLevel: 'amber', // green, amber, red, black
    isLockdown: false,
    selectedIncidentId: 842,
    activeIncidentsViewMode: 'active', // 'active' or 'history'
    activeIncidents: [
      {
        id: 842,
        title: 'Hazardous Chemical Containment Valve Anomaly',
        category: 'chemical',
        priority: 'critical',
        bldId: 'bld-ksrcas',
        locationName: 'KSRCAS BioTech Wing (Lab 3B)',
        assignedUnit: 'KSR Fire Tender 01, QRT Alpha',
        timeAgo: '4m ago',
        elapsedSeconds: 258,
        stage: 3, // 1: Reported, 2: Dispatched, 3: On-Scene, 4: Contained, 5: Resolved
        status: 'Active - Cordoning',
        notes: 'VOC sensors triggered in BioTech Lab 3B. Acid vapor release. 150m isolation perimeter established. Students safely mustered to M1 Athletic Ground.',
        coords: { x: 490, y: 220 }
      },
      {
        id: 843,
        title: 'Cardiac Emergency / Student Heat Exhaustion',
        category: 'medical',
        priority: 'critical',
        bldId: 'bld-sports',
        locationName: 'Athletic Stadium / Callbox #14',
        assignedUnit: 'KSR Health Centre Ambulance 01',
        timeAgo: '8m ago',
        elapsedSeconds: 480,
        stage: 2, // Dispatched
        status: 'En Route (ETA 2m)',
        notes: 'Athlete collapsed near track bleachers. Bystander CPR in progress. Public AED cabinet #09 unlatched. Paramedics rolling.',
        coords: { x: 680, y: 580 }
      },
      {
        id: 844,
        title: 'Auxiliary Fire Gate Perimeter Door Ajar Alert',
        category: 'security',
        priority: 'high',
        bldId: 'bld-hostels',
        locationName: 'Bharathi Hostel (East Wing Gate)',
        assignedUnit: 'KSR Bike Patrol Squad 03',
        timeAgo: '14m ago',
        elapsedSeconds: 840,
        stage: 2, // Dispatched
        status: 'Investigating',
        notes: 'Auxiliary perimeter door propped open without smart RFID clearance. CCTV feed CAM-02 flagged unknown subject near gate.',
        coords: { x: 845, y: 495 }
      }
    ],
    incidentHistory: [
      {
        id: 841,
        title: 'Electrical Short Circuit & Sparking in Robotics Lab',
        category: 'fire',
        priority: 'high',
        bldId: 'bld-ksrce',
        locationName: 'KSRCE Engineering Block (Lab 204)',
        assignedUnit: 'Disaster Electrical Squad',
        date: 'Today, 18:20',
        duration: '03m 45s',
        outcome: 'Breaker replaced, no fire spread. Lab cleared.',
        status: 'Resolved'
      },
      {
        id: 840,
        title: 'Sports Day Ankle Sprain & Dehydration at Cricket Oval',
        category: 'medical',
        priority: 'medium',
        bldId: 'bld-sports',
        locationName: 'Athletics Stadium (East Pavillion)',
        assignedUnit: 'KSR Health Centre Ambulance 01',
        date: 'Today, 15:40',
        duration: '02m 10s',
        outcome: 'First-aid applied on-scene, student stabilized.',
        status: 'Resolved'
      },
      {
        id: 839,
        title: 'Stray Canine Intrusion Near Highway Gate 1 Checkpoint',
        category: 'security',
        priority: 'low',
        bldId: 'bld-gate1',
        locationName: 'Gate 1 Highway Checkpost',
        assignedUnit: 'KSR Bike Patrol Squad 03',
        date: 'Today, 11:15',
        duration: '04m 20s',
        outcome: 'Canine safely escorted off campus grounds.',
        status: 'Resolved'
      },
      {
        id: 838,
        title: 'False Smoke Detector Trigger in Digital Library',
        category: 'facility',
        priority: 'low',
        bldId: 'bld-library',
        locationName: 'Central Digital Library (3rd Floor)',
        assignedUnit: 'KSR QRT Alpha',
        date: 'Yesterday, 19:10',
        duration: '01m 55s',
        outcome: 'Dust accumulation in optical chamber. Reset.',
        status: 'False Alarm'
      },
      {
        id: 837,
        title: 'Phase Voltage Drop in Kalvi Arangam Auditorium',
        category: 'facility',
        priority: 'medium',
        bldId: 'bld-auditorium',
        locationName: 'Kalvi Arangam A/C Mega Auditorium',
        assignedUnit: 'Disaster Electrical Squad',
        date: 'Yesterday, 16:30',
        duration: '06m 12s',
        outcome: 'Automatic transfer switch flipped to backup diesel.',
        status: 'Resolved'
      },
      {
        id: 836,
        title: 'Acute Asthma Attack in Bharathi Boys Hostel',
        category: 'medical',
        priority: 'high',
        bldId: 'bld-hostels',
        locationName: 'Bharathi Hostel Block C',
        assignedUnit: 'KSR Health Centre Ambulance 01',
        date: 'Yesterday, 02:15',
        duration: '03m 30s',
        outcome: 'Nebulization therapy given at KSR Health Clinic.',
        status: 'Resolved'
      },
      {
        id: 835,
        title: 'Precautionary Chemical Storage Inspection in Chemistry Annex',
        category: 'chemical',
        priority: 'medium',
        bldId: 'bld-ksrct',
        locationName: 'KSRCT Chemistry Department Store',
        assignedUnit: 'KSR Fire Tender 01',
        date: '27 Sep, 14:00',
        duration: '05m 18s',
        outcome: 'Secondary containment pans inspected and verified clean.',
        status: 'Resolved'
      },
      {
        id: 834,
        title: 'Water Pressure Drop in Food Court Cafeteria',
        category: 'facility',
        priority: 'low',
        bldId: 'bld-foodcourt',
        locationName: 'Central Food Court Main Kitchen',
        assignedUnit: 'Campus Maintenance Team',
        date: '26 Sep, 12:45',
        duration: '08m 40s',
        outcome: 'Auxiliary booster pump engaged. Flow normalized.',
        status: 'Resolved'
      },
      {
        id: 833,
        title: 'Unauthorized Low-Altitude Drone Sighted Near Hostels',
        category: 'security',
        priority: 'medium',
        bldId: 'bld-hostels',
        locationName: 'Tagore Hostel Quad',
        assignedUnit: 'KSR SkyGuard UAV, QRT Alpha',
        date: '25 Sep, 21:05',
        duration: '04m 05s',
        outcome: 'Hobbyist student grounded UAV. Incident logged.',
        status: 'Resolved'
      },
      {
        id: 832,
        title: 'Minor Acid Splash in Dental Materials Lab',
        category: 'medical',
        priority: 'high',
        bldId: 'bld-dental',
        locationName: 'KSR Dental College & Hospital (Lab 4)',
        assignedUnit: 'KSR Health Centre Ambulance 01',
        date: '24 Sep, 11:30',
        duration: '02m 45s',
        outcome: 'Emergency eye-wash station used, treated at Dental clinic.',
        status: 'Resolved'
      },
      {
        id: 831,
        title: 'Elevator Safety Door Interlock Trip in Admin Tower',
        category: 'facility',
        priority: 'medium',
        bldId: 'bld-admin',
        locationName: 'Centenary Admin Tower (Elevator #2)',
        assignedUnit: 'Disaster Electrical Squad',
        date: '23 Sep, 10:15',
        duration: '05m 10s',
        outcome: 'Manual car release operated. 3 passengers exited safely.',
        status: 'Resolved'
      },
      {
        id: 830,
        title: 'Monsoon Tree Branch Obstruction on North Ring Road',
        category: 'weather',
        priority: 'medium',
        bldId: 'bld-gate1',
        locationName: 'North Ring Road near Gate 1',
        assignedUnit: 'Campus Safety Grounds Crew',
        date: '22 Sep, 17:40',
        duration: '11m 20s',
        outcome: 'Branch cleared with chainsaw. Traffic reopened.',
        status: 'Resolved'
      },
      {
        id: 829,
        title: 'Student Fainting Spell during Outdoor Symposium',
        category: 'medical',
        priority: 'medium',
        bldId: 'bld-auditorium',
        locationName: 'Kalvi Arangam Plaza',
        assignedUnit: 'KSR Health Centre Ambulance 01',
        date: '20 Sep, 10:50',
        duration: '02m 00s',
        outcome: 'Hydration administered. Vital signs normal.',
        status: 'Resolved'
      },
      {
        id: 828,
        title: 'Annual Campus-Wide Fire Drill across KSRCT & KSRCE',
        category: 'fire',
        priority: 'low',
        bldId: 'bld-ksrct',
        locationName: 'All Academic Blocks',
        assignedUnit: 'Full Response Fleet & Warden Staff',
        date: '18 Sep, 11:00',
        duration: '04m 30s',
        outcome: 'Complete building evacuation drill passed in 4m 30s.',
        status: 'Drill Completed'
      }
    ],
    units: [
      { id: 'u1', name: 'KSR QRT Alpha (Patrol Cruiser)', type: 'police', status: 'ON SCENE', zone: 'KSRCAS Quad', elementId: 'unit-patrol-01', x: 470, y: 310, homeX: 470, homeY: 310, targetX: null, targetY: null, targetName: '', speed: 4.5, interventionTimer: 0 },
      { id: 'u2', name: 'KSR Fire Tender 01 (Water Bowser)', type: 'hazmat', status: 'CORDONING', zone: 'KSRCAS BioTech Wing', elementId: 'unit-hazmat-01', x: 420, y: 150, homeX: 420, homeY: 150, targetX: null, targetY: null, targetName: '', speed: 3.5, interventionTimer: 0 },
      { id: 'u3', name: 'KSR Health Ambulance 01 (ICU)', type: 'medical', status: 'EN ROUTE', zone: 'Stadium Ring Road', elementId: 'unit-ems-02', x: 640, y: 600, homeX: 640, homeY: 600, targetX: null, targetY: null, targetName: '', speed: 5.0, interventionTimer: 0 },
      { id: 'u4', name: 'KSR SkyGuard UAV (Patrol Drone)', type: 'drone', status: 'AIRBORNE 45M', zone: 'Campus Central Airspace', elementId: 'unit-drone-01', x: 600, y: 240, homeX: 600, homeY: 240, targetX: null, targetY: null },
      { id: 'u5', name: 'KSR Bike Patrol Squad 03', type: 'police', status: 'AVAILABLE', zone: 'Gate 1 Highway Checkpoint', elementId: 'unit-bike-03', x: 290, y: 310, homeX: 290, homeY: 310, targetX: null, targetY: null, targetName: '', speed: 6.0, interventionTimer: 0 },
      { id: 'u6', name: 'Disaster Electrical Squad', type: 'hazmat', status: 'STANDBY', zone: '110kV Substation 2', elementId: 'unit-elec-01', x: 350, y: 470, homeX: 350, homeY: 470, targetX: null, targetY: null, targetName: '', speed: 4.0, interventionTimer: 0 }
    ],
    cadLogs: [
      { id: 1, time: '21:08:12', source: 'DISPATCH', text: 'KSR Fire Tender 01 & QRT Alpha on scene at KSRCAS BioTech Wing. 150m perimeter tape deployed.', type: 'critical' },
      { id: 2, time: '21:05:04', source: 'EAS SYS', text: 'Emergency SMS blast transmitted to KSRCAS Sector (2,840 recipients). Muster area M1 active.', type: 'broadcast' },
      { id: 3, time: '21:01:30', source: 'CALLBOX #14', text: 'Emergency alert pushed at Athletic Stadium. Heat exhaustion victim. Ambulance 01 dispatched.', type: 'critical' },
      { id: 4, time: '20:54:15', source: 'GATE SENSOR', text: 'Bharathi Hostel auxiliary fire gate door unlatched. Bike Squad 03 sent for verification.', type: 'dispatch' },
      { id: 5, time: '20:45:00', source: 'SYS HEALTH', text: 'KSR Command Center IoT Mesh: 64/64 node gateways operational at 14ms latency.', type: 'normal' }
    ],
    mapTransform: { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 },
    droneAngle: 0
  };

  // Real-Time Simulation Master State
  const simState = {
    isRunning: true,
    speed: 1,
    autoEvents: true,
    lastAutoEventTick: 0,
    activeEvacuation: {
      isActive: false,
      buildingId: null,
      buildingName: '',
      totalOccupants: 0,
      evacuatedCount: 0,
      ratePerSec: 18,
      musterTarget: 'muster1',
      musterTargetName: 'Muster 1 (Athletic Stadium)',
      targetMusterBase: 620
    }
  };

  // Broadcast preset templates tailored for KSR
  const broadcastTemplates = {
    shelter: {
      text: "KSR EMERGENCY ALERT: Active security precaution ordered on campus. All students and faculty SHELTER IN PLACE immediately. Secure classroom and hostel doors. Await official All Clear from KSR Security Directorate.",
      zone: "all",
      siren: "whoop"
    },
    hazmat: {
      text: "KSR EMERGENCY ALERT: Hazardous chemical vapor release near KSRCAS BioTech Wing (3rd Floor). Immediately EVACUATE the building and 150m perimeter. Move to Assembly Area M1 (Athletic Stadium).",
      zone: "ksrcas",
      siren: "wail"
    },
    weather: {
      text: "SEVERE MONSOON WEATHER WARNING: Destructive thunderstorm with severe lightning approaching Tiruchengode. Cease outdoor activities and seek interior ground-floor shelter immediately.",
      zone: "all",
      siren: "wail"
    },
    allclear: {
      text: "ALL CLEAR: The emergency incident affecting the campus has been neutralized by KSR emergency response teams. Normal campus operations and academic access may resume safely.",
      zone: "all",
      siren: "chime"
    }
  };

  // Building details dictionary for KSR Educational Institutions
  const buildingDetails = {
    ksrcas: {
      name: "KSRCAS Arts & Science College (BioTech Wing)",
      subtitle: "3-Story Life Sciences & Chemical Laboratories",
      occupancy: "540 / 900",
      doorsLocked: "16 / 16 Secured (Hazard Cordon)",
      hvacStatus: "Emergency Purge Isolation Active",
      fireStatus: "Standby (Zone 3 Cordoned)"
    },
    library: {
      name: "Central Digital Library & Research Center",
      subtitle: "Central Knowledge Hub with 100,000+ Volumes & Digital Labs",
      occupancy: "840 / 1200",
      doorsLocked: "All Exterior Portals Monitored",
      hvacStatus: "Circulating Normal (100%)",
      fireStatus: "Normal"
    },
    foodcourt: {
      name: "Central Food Court & Amenities Mall",
      subtitle: "Multi-Cuisine Dining, Bakery & Student Store",
      occupancy: "620 / 800",
      doorsLocked: "Unrestricted Public Access",
      hvacStatus: "Normal Exhaust Active",
      fireStatus: "Normal"
    },
    ksrct: {
      name: "KSRCT Main Technical Complex (Mech, CSE, IT, EEE)",
      subtitle: "Flagship Engineering Institution (Autonomous, NAAC A++)",
      occupancy: "1,240 / 1800",
      doorsLocked: "Biometric Card Key Access",
      hvacStatus: "Normal Airflow (Cleanrooms Active)",
      fireStatus: "Normal"
    },
    dental: {
      name: "KSR Dental College & Research Hospital",
      subtitle: "24/7 Emergency Trauma Bay, Dental Clinics & Ambulatory Care",
      occupancy: "140 / 250",
      doorsLocked: "Ambulance Bay Open / Clinic Monitored",
      hvacStatus: "Hospital HEPA Filtration Active",
      fireStatus: "Normal"
    },
    hostels: {
      name: "KSR Hostels Cluster (Bharathi, Tagore & Teresa Towers)",
      subtitle: "Residential Hostels with 3,000+ Resident Students",
      occupancy: "1,850 / 2200",
      doorsLocked: "Auxiliary Gate 2 Alert (Patrol Checking)",
      hvacStatus: "Natural Airflow",
      fireStatus: "Normal"
    },
    sports: {
      name: "Athletics Stadium, Olympic Track & Cricket Oval",
      subtitle: "400m Synthetic Track, Pavilion, Cricket Turf & Courts",
      occupancy: "420 / 3000",
      doorsLocked: "Public Gates Monitored",
      hvacStatus: "Outdoor Natural",
      fireStatus: "Normal"
    },
    admin: {
      name: "Dr. K.S. Rangasamy Centenary Admin & Command Center",
      subtitle: "Chief Directorate, Security Operations Room & Registrar",
      occupancy: "85 / 120",
      doorsLocked: "Restricted Biometric Access",
      hvacStatus: "Positive Pressure Air",
      fireStatus: "Normal"
    },
    gate1: {
      name: "Main Highway Entrance Gate 1 & Security Toll",
      subtitle: "Tiruchengode-Erode Highway Access & Automatic Boom Barrier",
      occupancy: "Security Squad on Duty",
      doorsLocked: "Boom Barrier & ANPR Active",
      hvacStatus: "Kiosk HVAC Normal",
      fireStatus: "Normal"
    },
    ksrce: {
      name: "KSRCE Engineering & Research Annex",
      subtitle: "Civil, Mechanical & Robotics Centers of Excellence",
      occupancy: "680 / 950",
      doorsLocked: "Card Key Monitored",
      hvacStatus: "Normal Airflow",
      fireStatus: "Normal"
    },
    auditorium: {
      name: "Dr. K.S. Rangasamy Kalvi Arangam A/C Mega Auditorium",
      subtitle: "State-of-the-Art 2,400 Capacity Air-Conditioned Hall",
      occupancy: "2,400 Capacity",
      doorsLocked: "All Emergency Exits Armed",
      hvacStatus: "Chilled Water Plant Standby",
      fireStatus: "Normal"
    }
  };

  // Stage names dictionary
  const stageNames = {
    1: 'Reported',
    2: 'Dispatched',
    3: 'On Scene',
    4: 'Contained',
    5: 'Resolved'
  };

  // ==========================================
  // 3. UI RENDERING MANAGERS
  // ==========================================

  // Live Clock Updater (IST UTC+05:30)
  function updateLiveClock() {
    const el = document.getElementById('liveClockDisplay');
    if (!el) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hours}:${minutes}:${seconds} IST (UTC+05:30)`;
  }

  // Render Incident Cards (Active View)
  function renderIncidents(filter = 'all') {
    const container = document.getElementById('incidentListContainer');
    if (!container) return;

    let items = state.activeIncidents;
    if (filter === 'critical') {
      items = items.filter(i => i.priority === 'critical');
    } else if (filter === 'medical') {
      items = items.filter(i => i.category === 'medical');
    } else if (filter === 'security') {
      items = items.filter(i => i.category === 'security');
    }

    const countBadge = document.getElementById('activeIncidentCount');
    if (countBadge) countBadge.textContent = state.activeIncidents.length;

    const mobBadge = document.getElementById('mobileBadgeIncidents');
    if (mobBadge) mobBadge.textContent = state.activeIncidents.length;

    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-family: var(--font-mono); font-size: 11px;">
          <i class="fa-solid fa-circle-check" style="font-size: 26px; color: var(--threat-green); margin-bottom: 8px; display: block;"></i>
          NO ACTIVE INCIDENTS IN THIS SECTOR
        </div>`;
      return;
    }

    items.forEach(inc => {
      const isSelected = inc.id === state.selectedIncidentId;
      const card = document.createElement('div');
      card.className = `incident-card ${isSelected ? 'selected' : ''}`;
      card.dataset.id = inc.id;

      const elapsedMin = Math.floor(inc.elapsedSeconds / 60);
      const elapsedSec = inc.elapsedSeconds % 60;
      const elapsedStr = `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}`;

      card.innerHTML = `
        <div class="incident-card-top">
          <span class="inc-priority-tag ${inc.priority}">${inc.priority.toUpperCase()}</span>
          <span class="inc-time"><i class="fa-regular fa-clock"></i> T+ ${elapsedStr}</span>
        </div>
        <div class="incident-title">${inc.title}</div>
        <div class="incident-meta-row">
          <span class="inc-location"><i class="fa-solid fa-location-dot"></i> ${inc.locationName}</span>
          <span class="inc-units-tag">${stageNames[inc.stage] || inc.status}</span>
        </div>
        <div class="incident-actions-quick">
          <button class="inc-quick-btn locate-btn" title="Focus On Campus Map"><i class="fa-solid fa-crosshairs"></i> LOCATE</button>
          <button class="inc-quick-btn advance-btn" title="Advance Stage"><i class="fa-solid fa-forward-step"></i> ${inc.stage < 4 ? 'ADVANCE' : 'CONTAIN'}</button>
          <button class="inc-quick-btn resolve-btn resolve" title="Mark Incident Resolved"><i class="fa-solid fa-check"></i> RESOLVE</button>
        </div>
      `;

      // Event handlers
      card.addEventListener('click', (e) => {
        if (e.target.closest('.resolve-btn')) {
          e.stopPropagation();
          resolveIncident(inc.id);
          return;
        }
        if (e.target.closest('.advance-btn')) {
          e.stopPropagation();
          advanceIncidentStage(inc.id);
          return;
        }
        selectIncident(inc.id);
      });

      container.appendChild(card);
    });
  }

  // Render Incident History View
  function renderIncidentHistory(searchTerm = '') {
    const container = document.getElementById('historyListContainer');
    if (!container) return;

    let items = state.incidentHistory;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter(h => 
        h.title.toLowerCase().includes(q) ||
        h.locationName.toLowerCase().includes(q) ||
        h.assignedUnit.toLowerCase().includes(q) ||
        h.outcome.toLowerCase().includes(q)
      );
    }

    const historyCountBadge = document.getElementById('historyIncidentCount');
    if (historyCountBadge) historyCountBadge.textContent = state.incidentHistory.length;

    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-family: var(--font-mono); font-size: 11px;">
          NO HISTORICAL RECORDS FOUND
        </div>`;
      return;
    }

    items.forEach(hist => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-card-top">
          <span class="hist-id">#${hist.id} • ${hist.category.toUpperCase()}</span>
          <span class="hist-date"><i class="fa-regular fa-calendar-check"></i> ${hist.date}</span>
        </div>
        <div class="hist-title">${hist.title}</div>
        <div class="hist-meta-row">
          <span><i class="fa-solid fa-location-dot"></i> ${hist.locationName}</span>
          <span class="hist-duration"><i class="fa-solid fa-stopwatch"></i> ${hist.duration}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        openHistoryDetailModal(hist);
      });

      container.appendChild(card);
    });
  }

  // ⏱️ Render Response Tracking & SLA Chronometer Panel
  function updateResponseTrackingUI() {
    const inc = state.activeIncidents.find(i => i.id === state.selectedIncidentId) || state.activeIncidents[0];
    if (!inc) {
      document.getElementById('trackingIncId').textContent = 'NO ACTIVE INCIDENT';
      document.getElementById('trackingIncTitle').textContent = 'All Campus Sectors Operating Normal';
      document.getElementById('trackingIncLocation').textContent = 'Condition Green Baseline';
      document.getElementById('liveChronometerDisplay').textContent = '00:00';
      document.getElementById('slaProgressBar').style.width = '0%';
      document.getElementById('trackingStatusTag').className = 'live-pill green';
      document.getElementById('trackingStatusTag').innerHTML = '<i class="fa-solid fa-circle"></i> STANDBY';
      return;
    }

    // Update Incident Info
    document.getElementById('trackingIncId').textContent = `INCIDENT #${inc.id} [${inc.priority.toUpperCase()}]`;
    document.getElementById('trackingIncTitle').textContent = inc.title;
    document.getElementById('trackingIncLocation').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${inc.locationName}`;

    // Chronometer digits
    const min = Math.floor(inc.elapsedSeconds / 60);
    const sec = inc.elapsedSeconds % 60;
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const chronoDisplay = document.getElementById('liveChronometerDisplay');
    if (chronoDisplay) chronoDisplay.textContent = timeStr;

    // SLA Target Benchmark: 5:00 min (300 seconds)
    const maxSLASeconds = 300;
    const pct = Math.min(Math.round((inc.elapsedSeconds / maxSLASeconds) * 100), 100);
    const slaBar = document.getElementById('slaProgressBar');
    const slaBadge = document.getElementById('slaTargetBadge');

    if (slaBar) slaBar.style.width = `${pct}%`;

    if (inc.elapsedSeconds < 180) {
      if (slaBadge) {
        slaBadge.className = 'chrono-sla-tag on-track';
        slaBadge.textContent = 'SLA TARGET: ON TRACK (< 03:00)';
      }
    } else if (inc.elapsedSeconds <= 300) {
      if (slaBadge) {
        slaBadge.className = 'chrono-sla-tag warning';
        slaBadge.textContent = 'SLA TARGET: APPROACHING (05:00)';
      }
    } else {
      if (slaBadge) {
        slaBadge.className = 'chrono-sla-tag breached';
        slaBadge.textContent = 'SLA TARGET: BREACHED (> 05:00)';
      }
    }

    // 5-Stage Lifecycle Progression Indicator
    const steps = document.querySelectorAll('#pipelineStepsContainer .pipeline-step');
    const connectors = document.querySelectorAll('#pipelineStepsContainer .pipeline-connector');

    steps.forEach((stepEl, idx) => {
      const stepNum = idx + 1;
      stepEl.classList.remove('completed', 'current');

      const circle = stepEl.querySelector('.step-circle');

      if (stepNum < inc.stage) {
        stepEl.classList.add('completed');
        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else if (stepNum === inc.stage) {
        stepEl.classList.add('current');
        circle.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
      } else {
        circle.textContent = stepNum;
      }
    });

    connectors.forEach((connEl, idx) => {
      const stepBefore = idx + 1;
      connEl.classList.toggle('active', stepBefore < inc.stage);
    });
  }

  // Select an Incident
  function selectIncident(id) {
    state.selectedIncidentId = id;
    const inc = state.activeIncidents.find(i => i.id === id);
    if (!inc) return;

    renderIncidents(document.querySelector('.filter-tab.active')?.dataset.filter || 'all');
    updateResponseTrackingUI();
    audio.playBeep(640, 0.06, 'triangle', 0.1);

    centerMapOn(inc.coords.x, inc.coords.y, 1.4);
    showToast(`Focused: ${inc.title}`, 'info');
  }

  // 🔄 Advance Lifecycle Stage of an Incident
  function advanceIncidentStage(id) {
    const inc = state.activeIncidents.find(i => i.id === id);
    if (!inc) return;

    if (inc.stage < 4) {
      inc.stage += 1;
      inc.status = `${stageNames[inc.stage]} (${inc.assignedUnit.split(',')[0]})`;
      audio.playChime('success');
      addCadLog('CAD DISPATCH', `STAGE ADVANCE: Incident #${inc.id} at ${inc.locationName} is now [${stageNames[inc.stage].toUpperCase()}].`, 'dispatch');
      showToast(`Incident #${inc.id} Advanced to: ${stageNames[inc.stage].toUpperCase()}`, 'success');
    } else if (inc.stage === 4) {
      // 4 to 5 is resolve
      resolveIncident(inc.id);
      return;
    }

    renderIncidents();
    updateResponseTrackingUI();
  }

  // 🔄 Resolve an Incident
  function resolveIncident(id) {
    const idx = state.activeIncidents.findIndex(i => i.id === id);
    if (idx === -1) return;
    const inc = state.activeIncidents[idx];

    // Calculate final SLA duration string
    const min = Math.floor(inc.elapsedSeconds / 60);
    const sec = inc.elapsedSeconds % 60;
    const durationStr = `${String(min).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;

    // Move to Incident History
    const historyRecord = {
      id: inc.id,
      title: inc.title,
      category: inc.category,
      priority: inc.priority,
      bldId: inc.bldId,
      locationName: inc.locationName,
      assignedUnit: inc.assignedUnit,
      date: 'Just now',
      duration: durationStr,
      outcome: `Resolved by ${inc.assignedUnit}. All clear verified by KSR Command Center.`,
      status: 'Resolved'
    };

    state.incidentHistory.unshift(historyRecord);
    state.activeIncidents.splice(idx, 1);

    audio.playChime('success');
    addCadLog('DISPATCH', `INCIDENT RESOLVED: #${inc.id} ${inc.title} at ${inc.locationName}. Total Response SLA: ${durationStr}. Units returned to patrol.`, 'normal');
    showToast(`Resolved Incident #${id}: ${inc.title} (${durationStr})`, 'success');

    // Update 24H Resolved count display
    const countDisplay = document.getElementById('resolvedCountDisplay');
    if (countDisplay) {
      const cur = parseInt(countDisplay.textContent) || 14;
      countDisplay.textContent = `${cur + 1} RESOLVED`;
    }

    // If chemical incident was resolved, clear hazard circle & restore threat to normal/amber
    if (inc.bldId === 'bld-ksrcas') {
      const dangerPerimeter = document.getElementById('dangerPerimeterGroup');
      if (dangerPerimeter) dangerPerimeter.style.display = 'none';
      const bldNode = document.getElementById('bld-ksrcas');
      if (bldNode) bldNode.classList.remove('has-hazard');
      document.getElementById('globalAlertBanner').classList.add('hidden');
      if (state.activeIncidents.length === 0) {
        setThreatCondition('green');
      } else {
        setThreatCondition('amber');
      }
    }

    // Set next selected incident if available
    if (state.activeIncidents.length > 0) {
      state.selectedIncidentId = state.activeIncidents[0].id;
    } else {
      state.selectedIncidentId = null;
    }

    renderIncidents();
    renderIncidentHistory();
    updateResponseTrackingUI();
  }

  // Open Historical Incident Inspection Modal
  function openHistoryDetailModal(hist) {
    const modal = document.getElementById('historyDetailModal');
    if (!modal) return;

    document.getElementById('histDetailTitle').textContent = `Incident #${hist.id}: ${hist.title}`;
    document.getElementById('histDetailSubtitle').textContent = `${hist.locationName} • Resolved in ${hist.duration}`;

    const body = document.getElementById('histDetailBody');
    body.innerHTML = `
      <div class="bld-stats-matrix">
        <div class="bld-stat-card">
          <span class="lbl">INCIDENT ID</span>
          <span class="val">#${hist.id}</span>
        </div>
        <div class="bld-stat-card">
          <span class="lbl">CATEGORY</span>
          <span class="val" style="color: var(--accent-cyan);">${hist.category.toUpperCase()}</span>
        </div>
        <div class="bld-stat-card">
          <span class="lbl">RESPONSE TURNAROUND</span>
          <span class="val green"><i class="fa-solid fa-stopwatch"></i> ${hist.duration}</span>
        </div>
        <div class="bld-stat-card">
          <span class="lbl">RESPONDER FLEET</span>
          <span class="val" style="font-size: 11px;">${hist.assignedUnit}</span>
        </div>
      </div>

      <div class="form-group mt-3">
        <label class="form-label">LOCATION & FACILITY ZONE</label>
        <p style="color: #cbd5e1; font-size: 11.5px;"><i class="fa-solid fa-building"></i> ${hist.locationName}</p>
      </div>

      <div class="form-group mt-2">
        <label class="form-label">INCIDENT AFTER-ACTION SUMMARY & RESOLUTION NOTES</label>
        <div style="background: rgba(10, 16, 30, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; font-size: 11.5px; color: #e2e8f0; line-height: 1.4;">
          ${hist.outcome}
        </div>
      </div>
    `;

    openModal('historyDetailModal');
  }

  // Render Responder Units Roster
  function renderUnits() {
    const list = document.getElementById('unitRosterList');
    if (!list) return;

    document.getElementById('unitsOnlineCount').textContent = `${state.units.length} UNITS`;
    list.innerHTML = '';

    state.units.forEach(u => {
      const row = document.createElement('div');
      row.className = 'unit-row';

      let statusClass = 'available';
      if (u.status.includes('ON SCENE') || u.status.includes('CORDONING') || u.status.includes('SUPPRESSING') || u.status.includes('STABILIZING')) {
        statusClass = 'on-scene';
      } else if (u.status.includes('EN ROUTE') || u.status.includes('AIRBORNE') || u.status.includes('DISPATCHED')) {
        statusClass = 'en-route';
      }

      let iconClass = 'fa-car-side';
      if (u.type === 'hazmat') iconClass = 'fa-fire-extinguisher';
      else if (u.type === 'medical') iconClass = 'fa-truck-medical';
      else if (u.type === 'drone') iconClass = 'fa-satellite-dish';
      else if (u.id === 'u5') iconClass = 'fa-motorcycle';

      row.innerHTML = `
        <div class="unit-left">
          <div class="unit-avatar-icon ${u.type}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div class="unit-details">
            <span class="u-name">${u.name}</span>
            <span class="u-zone"><i class="fa-solid fa-location-arrow"></i> ${u.zone}</span>
          </div>
        </div>
        <span class="unit-status-pill ${statusClass}">${u.status}</span>
      `;

      row.addEventListener('click', () => {
        if (u.x && u.y) {
          centerMapOn(u.x, u.y, 1.5);
          audio.playBeep(700, 0.05, 'sine', 0.12);
          showToast(`Tracking: ${u.name} [${u.status}]`, 'info');
        } else {
          showToast(`${u.name} is stationed at ${u.zone}`, 'info');
        }
      });

      list.appendChild(row);
    });
  }

  // CAD Log Stream & Appending
  function renderCadLogs() {
    const container = document.getElementById('cadStreamContainer');
    if (!container) return;

    container.innerHTML = '';
    state.cadLogs.slice(0, 40).forEach(log => {
      const entry = document.createElement('div');
      entry.className = `cad-entry ${log.type || 'normal'}`;
      entry.innerHTML = `
        <span class="cad-time">${log.time}</span>
        <span class="cad-source">[${log.source}]:</span>
        <span class="cad-text">${log.text}</span>
      `;
      container.appendChild(entry);
    });
  }

  function addCadLog(source, text, type = 'normal') {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    state.cadLogs.unshift({
      id: Date.now(),
      time: timeStr,
      source: source.toUpperCase(),
      text,
      type
    });
    renderCadLogs();
  }

  // Toast Notification System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'danger') icon = 'fa-triangle-exclamation';
    else if (type === 'success') icon = 'fa-circle-check';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(60px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  }

  // ==========================================
  // 4. MAP INTERACTION, ZOOM, PAN & LAYERS
  // ==========================================
  const mapWrapper = document.getElementById('svgMapWrapper');
  const svgMap = document.getElementById('campusSvgMap');

  function updateMapTransform() {
    if (!mapWrapper) return;
    mapWrapper.style.transform = `translate(${state.mapTransform.x}px, ${state.mapTransform.y}px) scale(${state.mapTransform.scale})`;
  }

  function centerMapOn(x, y, scale = 1.3) {
    const viewBoxW = 1200;
    const viewBoxH = 800;

    const offsetX = (viewBoxW / 2 - x) * 0.7;
    const offsetY = (viewBoxH / 2 - y) * 0.7;

    state.mapTransform.scale = scale;
    state.mapTransform.x = offsetX;
    state.mapTransform.y = offsetY;
    updateMapTransform();
  }

  function resetMapView() {
    state.mapTransform.scale = 1;
    state.mapTransform.x = 0;
    state.mapTransform.y = 0;
    updateMapTransform();
    audio.playBeep(520, 0.05);
  }

  function setupMapControls() {
    document.getElementById('mapZoomInBtn')?.addEventListener('click', () => {
      state.mapTransform.scale = Math.min(state.mapTransform.scale + 0.25, 2.8);
      updateMapTransform();
      audio.playBeep(650, 0.04);
    });

    document.getElementById('mapZoomOutBtn')?.addEventListener('click', () => {
      state.mapTransform.scale = Math.max(state.mapTransform.scale - 0.25, 0.7);
      updateMapTransform();
      audio.playBeep(450, 0.04);
    });

    document.getElementById('mapResetViewBtn')?.addEventListener('click', resetMapView);

    document.getElementById('centerOnHazardBtn')?.addEventListener('click', () => {
      centerMapOn(490, 220, 1.6);
      audio.playBeep(780, 0.08, 'sawtooth');
      showToast('Centered on Primary Hazard: KSRCAS BioTech Wing (Lab 3B)', 'danger');
    });

    // Toggle Tactical Grid
    let gridVisible = true;
    document.getElementById('mapGridToggleBtn')?.addEventListener('click', () => {
      gridVisible = !gridVisible;
      const gridPattern = document.getElementById('tacticalGrid');
      if (gridPattern) {
        gridPattern.style.display = gridVisible ? 'block' : 'none';
      }
      showToast(gridVisible ? 'Tactical Grid: ON' : 'Tactical Grid: OFF', 'info');
      audio.playBeep(600, 0.04);
    });

    // Pan / Dragging logic on Map Wrapper
    mapWrapper?.addEventListener('mousedown', (e) => {
      if (e.target.closest('.building-node') || e.target.closest('.responder-marker') || e.target.closest('.cctv-marker')) {
        return;
      }
      state.mapTransform.isDragging = true;
      state.mapTransform.startX = e.clientX - state.mapTransform.x;
      state.mapTransform.startY = e.clientY - state.mapTransform.y;
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.mapTransform.isDragging) return;
      state.mapTransform.x = e.clientX - state.mapTransform.startX;
      state.mapTransform.y = e.clientY - state.mapTransform.startY;
      updateMapTransform();
    });

    window.addEventListener('mouseup', () => {
      state.mapTransform.isDragging = false;
    });

    // Wheel Zoom
    mapWrapper?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newScale = Math.min(Math.max(state.mapTransform.scale + delta, 0.6), 3.0);
      state.mapTransform.scale = newScale;
      updateMapTransform();
    }, { passive: false });

    // Layer Toggles
    const layerToggles = [
      { id: 'layerIncidents', selector: '#dangerPerimeterGroup' },
      { id: 'layerResponders', selector: '#respondersGroup' },
      { id: 'layerCallboxes', selector: '#callboxesGroup' },
      { id: 'layerEvacRoutes', selector: '#evacuationRoutesGroup' },
      { id: 'layerCCTV', selector: '#cctvConesGroup' }
    ];

    layerToggles.forEach(l => {
      const checkbox = document.getElementById(l.id);
      checkbox?.addEventListener('change', (e) => {
        const group = document.querySelector(l.selector);
        if (group) {
          group.style.display = e.target.checked ? 'inline' : 'none';
        }
        e.target.closest('.layer-pill')?.classList.toggle('inactive', !e.target.checked);
        audio.playBeep(e.target.checked ? 750 : 380, 0.04);
      });
    });

    // Interactive Building Click & Tooltips
    const buildings = document.querySelectorAll('.building-node');
    const tooltipGroup = document.getElementById('mapTooltipGroup');

    buildings.forEach(bld => {
      const id = bld.dataset.id;
      const name = bld.dataset.name || "KSR Building";
      const occ = bld.dataset.occ || "N/A";
      const status = bld.dataset.status || "NORMAL";

      bld.addEventListener('click', () => {
        openBuildingModal(id);
      });

      bld.addEventListener('mouseenter', (e) => {
        if (!tooltipGroup) return;
        const bbox = bld.getBBox();
        tooltipGroup.setAttribute('transform', `translate(${bbox.x + bbox.width / 2 - 110}, ${bbox.y - 80})`);
        tooltipGroup.querySelector('.tooltip-title').textContent = name;
        tooltipGroup.querySelector('.tooltip-detail').textContent = `Status: ${status}`;
        tooltipGroup.querySelector('.tooltip-detail-sub').textContent = `Occupancy: ${occ}`;
        tooltipGroup.style.display = 'block';
      });

      bld.addEventListener('mouseleave', () => {
        if (tooltipGroup) tooltipGroup.style.display = 'none';
      });
    });

    // CCTV Cones Click
    document.querySelectorAll('.cctv-marker').forEach(cam => {
      cam.addEventListener('click', (e) => {
        e.stopPropagation();
        const camId = cam.dataset.cam;
        const camName = cam.dataset.name;
        audio.playBeep(840, 0.05);
        showToast(`Focusing camera feed: ${camName}`, 'info');
        document.querySelectorAll('.cctv-monitor').forEach(m => m.classList.remove('active-mon'));
        if (camId === 'cam-1') document.getElementById('monChemLab')?.classList.add('active-mon');
        else if (camId === 'cam-2') document.getElementById('monEastDorm')?.classList.add('active-mon');
        else if (camId === 'cam-3') document.getElementById('monDroneEye')?.classList.add('active-mon');
      });
    });
  }

  // ==========================================
  // 5. THREAT LEVEL & PERIMETER LOCKDOWN
  // ==========================================
  function setThreatCondition(level) {
    state.threatLevel = level;
    const badge = document.getElementById('threatLevelBadge');
    const text = document.getElementById('threatLevelText');
    const strobe = document.getElementById('criticalFlashOverlay');

    badge.className = `threat-level-badge level-${level}`;

    document.querySelectorAll('.defcon-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === level);
    });

    if (level === 'green') {
      text.textContent = 'CONDITION GREEN (NORMAL)';
      strobe.classList.remove('active-strobe');
    } else if (level === 'amber') {
      text.textContent = 'CONDITION AMBER (ELEVATED)';
      strobe.classList.remove('active-strobe');
    } else if (level === 'red') {
      text.textContent = 'CONDITION RED (CRITICAL THREAT)';
      strobe.classList.add('active-strobe');
      audio.startKlaxonSiren(4);
    } else if (level === 'black') {
      text.textContent = 'CONDITION BLACK (TOTAL LOCKDOWN)';
      strobe.classList.add('active-strobe');
      audio.startKlaxonSiren(6);
    }

    addCadLog('SYS COMM', `THREAT CONDITION RECLASSIFIED TO: ${text.textContent}`, level === 'green' ? 'normal' : 'critical');
  }

  function setupThreatControls() {
    document.querySelectorAll('.defcon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = btn.dataset.level;
        setThreatCondition(lvl);
        audio.playBeep(lvl === 'red' ? 950 : 580, 0.08);
      });
    });
  }

  // ==========================================
  // 6. MODAL DIALOGS ENGINE & REPORT EMERGENCY
  // ==========================================
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('show');
    audio.playBeep(580, 0.05);
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('show');
    audio.playBeep(420, 0.04);
  }

  function setupModals() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.dataset.close);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('show');
        }
      });
    });

    // Broadcast Modal Triggers
    document.getElementById('openBroadcastModalBtn')?.addEventListener('click', () => openModal('broadcastModal'));
    document.getElementById('bannerQuickBroadcastBtn')?.addEventListener('click', () => openModal('broadcastModal'));

    // New Incident / Report Emergency Modal Triggers
    document.getElementById('openNewIncidentModalBtn')?.addEventListener('click', () => openModal('newIncidentModal'));
    document.getElementById('headerReportEmergencyBtn')?.addEventListener('click', () => openModal('newIncidentModal'));
    document.getElementById('dispatchUnitModalBtn')?.addEventListener('click', () => openModal('newIncidentModal'));
    document.getElementById('mobileSosBtn')?.addEventListener('click', () => openModal('newIncidentModal'));

    // Lockdown Modal Trigger
    document.getElementById('triggerLockdownModalBtn')?.addEventListener('click', () => openModal('lockdownModal'));

    // Shortcuts modal
    document.getElementById('shortcutGuideBtn')?.addEventListener('click', () => openModal('shortcutsModal'));

    // Evacuate Zone Button
    document.getElementById('evacuateZoneModalBtn')?.addEventListener('click', () => {
      openModal('broadcastModal');
      applyBroadcastTemplate('hazmat');
    });

    // Dismiss banner
    document.getElementById('dismissBannerBtn')?.addEventListener('click', () => {
      document.getElementById('globalAlertBanner').classList.add('hidden');
    });

    document.getElementById('bannerInspectBtn')?.addEventListener('click', () => {
      centerMapOn(490, 220, 1.6);
      audio.playBeep(650, 0.06);
    });

    // Advance Stage from Tracking panel
    document.getElementById('advanceStageBtn')?.addEventListener('click', () => {
      if (state.selectedIncidentId) {
        advanceIncidentStage(state.selectedIncidentId);
      }
    });

    // Quick resolve from Tracking panel
    document.getElementById('quickResolveBtn')?.addEventListener('click', () => {
      if (state.selectedIncidentId) {
        resolveIncident(state.selectedIncidentId);
      }
    });

    // Preset Broadcast Templates
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tplKey = btn.dataset.tpl;
        applyBroadcastTemplate(tplKey);
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        audio.playBeep(720, 0.04);
      });
    });

    // Broadcast message character count
    const broadcastInput = document.getElementById('broadcastMsgText');
    const charCount = document.getElementById('charCount');
    broadcastInput?.addEventListener('input', () => {
      if (charCount) charCount.textContent = broadcastInput.value.length;
    });

    document.getElementById('executeBroadcastBtn')?.addEventListener('click', executeMassBroadcast);
    document.getElementById('saveNewIncidentBtn')?.addEventListener('click', executeCreateIncident);
    document.getElementById('confirmLockdownActionBtn')?.addEventListener('click', executeCampusLockdown);

    // Active vs History Tab Switcher
    document.getElementById('tabActiveIncidents')?.addEventListener('click', () => {
      state.activeIncidentsViewMode = 'active';
      document.getElementById('tabActiveIncidents')?.classList.add('active');
      document.getElementById('tabIncidentHistory')?.classList.remove('active');
      document.getElementById('activeIncidentsView').style.display = 'block';
      document.getElementById('incidentHistoryView').style.display = 'none';
      document.getElementById('incidentFilterGroup').style.display = 'flex';
      audio.playBeep(600, 0.03);
    });

    document.getElementById('tabIncidentHistory')?.addEventListener('click', () => {
      state.activeIncidentsViewMode = 'history';
      document.getElementById('tabIncidentHistory')?.classList.add('active');
      document.getElementById('tabActiveIncidents')?.classList.remove('active');
      document.getElementById('activeIncidentsView').style.display = 'none';
      document.getElementById('incidentHistoryView').style.display = 'block';
      document.getElementById('incidentFilterGroup').style.display = 'none';
      renderIncidentHistory();
      audio.playBeep(650, 0.03);
    });

    // History Search Input
    document.getElementById('historySearchInput')?.addEventListener('input', (e) => {
      renderIncidentHistory(e.target.value.trim());
    });

    // Export History Report
    document.getElementById('exportHistoryReportBtn')?.addEventListener('click', () => {
      exportIncidentHistory();
    });

    // Incident Filter Tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderIncidents(tab.dataset.filter);
        audio.playBeep(620, 0.03);
      });
    });

    // Quick chips in Report Emergency Modal
    document.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.text;
        const notesArea = document.getElementById('newIncNotes');
        if (notesArea) {
          notesArea.value = text;
        }
        audio.playBeep(700, 0.04);
      });
    });

    // Remote building overrides in inspection modal
    document.getElementById('btnHvacPurge')?.addEventListener('click', () => {
      if (!currentInspectBldKey) return;
      const bld = buildingDetails[currentInspectBldKey];
      const hvacEl = document.getElementById('inspectBldHvac');
      if (hvacEl) {
        hvacEl.textContent = 'PURGE ACTIVE (MAX AIRFLOW)';
        hvacEl.className = 'val green';
      }
      audio.playBeep(720, 0.08);
      addCadLog('FACILITY CAD', `HVAC EMERGENCY PURGE ENGAGED: ${bld?.name || currentInspectBldKey}`, 'dispatch');
      showToast(`HVAC Emergency Purge triggered for ${bld?.name || 'Building'}`, 'info');
    });

    document.getElementById('btnToggleBldLock')?.addEventListener('click', () => {
      if (!currentInspectBldKey) return;
      const bld = buildingDetails[currentInspectBldKey];
      const doorEl = document.getElementById('inspectBldDoors');
      const isLocked = doorEl?.textContent.includes('LOCKED') || doorEl?.textContent.includes('Secured');
      if (doorEl) {
        doorEl.textContent = isLocked ? 'ALL EXTERIOR DOORS UNLOCKED' : 'ALL DOORS MAGNETIC LOCKED';
        doorEl.className = isLocked ? 'val warning' : 'val green';
      }
      audio.playBeep(isLocked ? 400 : 750, 0.08);
      addCadLog('ACCESS CAD', `PORTAL OVERRIDE: ${bld?.name || currentInspectBldKey} doors ${isLocked ? 'UNLOCKED' : 'LOCKED'}`, 'dispatch');
      showToast(`${bld?.name || 'Building'} portals: ${isLocked ? 'UNLOCKED' : 'LOCKED'}`, 'info');
    });

    document.getElementById('btnEvacuateBld')?.addEventListener('click', () => {
      if (!currentInspectBldKey) return;
      const bld = buildingDetails[currentInspectBldKey];
      audio.startKlaxonSiren(4);
      addCadLog('FIRE CAD', `LOCAL EVACUATION STROBE ACTIVATED: ${bld?.name || currentInspectBldKey}`, 'critical');
      showToast(`Evacuation Alarm & Strobes sounding at ${bld?.name || 'Building'}!`, 'danger');
    });

    document.getElementById('btnDispatchToBld')?.addEventListener('click', () => {
      if (!currentInspectBldKey) return;
      const bld = buildingDetails[currentInspectBldKey];
      closeModal('buildingInspectModal');
      audio.playRadioSquelch();
      addCadLog('CAD DISPATCH', `PATROL DISPATCHED: KSR QRT Alpha routing to ${bld?.name || currentInspectBldKey}`, 'dispatch');
      showToast(`Dispatched KSR QRT Alpha to ${bld?.name || 'Building'}`, 'success');
      
      // Center map on target building
      if (currentInspectBldKey === 'ksrcas') centerMapOn(490, 220, 1.5);
      else if (currentInspectBldKey === 'sports') centerMapOn(680, 580, 1.5);
      else if (currentInspectBldKey === 'hostels') centerMapOn(845, 495, 1.5);
      else if (currentInspectBldKey === 'ksrct') centerMapOn(700, 220, 1.5);
      else if (currentInspectBldKey === 'library') centerMapOn(600, 380, 1.5);
      else if (currentInspectBldKey === 'dental') centerMapOn(905, 260, 1.5);
      else if (currentInspectBldKey === 'admin') centerMapOn(260, 435, 1.5);
      else if (currentInspectBldKey === 'gate1') centerMapOn(275, 260, 1.5);
      else if (currentInspectBldKey === 'foodcourt') centerMapOn(425, 390, 1.5);
      else if (currentInspectBldKey === 'ksrce') centerMapOn(670, 495, 1.5);
      else if (currentInspectBldKey === 'auditorium') centerMapOn(255, 555, 1.5);
    });

    // IoT Sensor Mesh refresh button
    document.getElementById('refreshSensorsBtn')?.addEventListener('click', () => {
      const btn = document.getElementById('refreshSensorsBtn');
      const icon = btn?.querySelector('i');
      if (icon) {
        icon.classList.add('fa-spin');
        setTimeout(() => icon.classList.remove('fa-spin'), 1200);
      }
      audio.playChime('success');
      showToast('KSR IoT Mesh Network Sync: 64/64 nodes verified active (12ms latency)', 'success');
    });
  }

  function applyBroadcastTemplate(key) {
    const tpl = broadcastTemplates[key];
    if (!tpl) return;
    const txtArea = document.getElementById('broadcastMsgText');
    const zoneSelect = document.getElementById('broadcastZoneSelect');
    const sirenSelect = document.getElementById('broadcastSirenSound');
    const charCount = document.getElementById('charCount');

    if (txtArea) txtArea.value = tpl.text;
    if (zoneSelect) zoneSelect.value = tpl.zone;
    if (sirenSelect) sirenSelect.value = tpl.siren;
    if (charCount) charCount.textContent = tpl.text.length;
  }

  // Execute Mass Broadcast Flow
  function executeMassBroadcast() {
    const text = document.getElementById('broadcastMsgText')?.value || '';
    const zone = document.getElementById('broadcastZoneSelect')?.value || 'all';
    const siren = document.getElementById('broadcastSirenSound')?.value || 'wail';
    const transBox = document.getElementById('transmissionStatusBox');
    const transBar = document.getElementById('transBar');
    const transPct = document.getElementById('transPct');
    const transSub = document.getElementById('transSub');
    const btn = document.getElementById('executeBroadcastBtn');

    if (!transBox || !transBar || !btn) return;

    transBox.style.display = 'block';
    btn.disabled = true;
    audio.playRadioSquelch();

    let pct = 0;
    const interval = setInterval(() => {
      pct += 15;
      if (pct > 100) pct = 100;

      transBar.style.width = `${pct}%`;
      transPct.textContent = `${pct}%`;

      if (pct === 30) {
        transSub.textContent = 'Telecom SMS Gateways: 18,500 student endpoints queued...';
      } else if (pct === 60) {
        transSub.textContent = 'Classroom Digital Signage & Hostel Wardens HUD Updated...';
      } else if (pct === 90) {
        transSub.textContent = 'Campus Outdoor Siren Klaxons Activated...';
      } else if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          btn.disabled = false;
          transBox.style.display = 'none';
          closeModal('broadcastModal');

          // Update Global Banner
          const banner = document.getElementById('globalAlertBanner');
          banner.classList.remove('hidden');
          document.getElementById('bannerTitle').textContent = `KSR EAS BROADCAST [${zone.toUpperCase()}]:`;
          document.getElementById('bannerBody').textContent = text;

          if (siren === 'wail' || siren === 'whoop') {
            audio.startKlaxonSiren(5);
          } else if (siren === 'chime') {
            audio.playChime('success');
          }

          addCadLog('EAS COMMAND', `TRANSMITTED TO 18,500 RECIPIENTS (${zone}): "${text.slice(0, 50)}..."`, 'broadcast');
          showToast('Emergency Mass Broadcast transmitted with 100% KSR network delivery!', 'success');
        }, 500);
      }
    }, 180);
  }

  // Variable to track active building for overrides
  let currentInspectBldKey = null;

  // ➕ Create & Dispatch Emergency Incident
  function executeCreateIncident() {
    const callerName = document.getElementById('newIncCallerName')?.value.trim() || 'Anonymous Reporter';
    const callerPhone = document.getElementById('newIncCallerPhone')?.value.trim() || '+91 94433 00000';
    const role = document.getElementById('newIncReporterRole')?.value || 'Student';
    const title = document.getElementById('newIncTitle')?.value.trim();
    const category = document.getElementById('newIncCategory')?.value || 'security';
    const priority = document.getElementById('newIncPriority')?.value || 'high';
    const bldId = document.getElementById('newIncLocation')?.value || 'bld-ksrct';
    const assignee = document.getElementById('newIncAssignee')?.value || 'KSR QRT Alpha';
    const notes = document.getElementById('newIncNotes')?.value.trim() || '';

    if (!title) {
      showToast('Please enter an incident title or nature of emergency', 'danger');
      audio.playBeep(400, 0.1);
      return;
    }

    const bldKey = bldId.replace('bld-', '');
    const bldInfo = buildingDetails[bldKey] || { name: 'KSR Campus Zone' };

    const newId = Math.floor(850 + Math.random() * 140);
    const newInc = {
      id: newId,
      title,
      category,
      priority,
      bldId,
      locationName: bldInfo.name,
      assignedUnit: assignee,
      callerName: `${callerName} (${role}, ${callerPhone})`,
      timeAgo: 'Just now',
      elapsedSeconds: 0,
      stage: 1, // 1: Reported
      status: `Reported -> Dispatched (${assignee})`,
      notes,
      coords: { x: 600, y: 380 }
    };

    state.activeIncidents.unshift(newInc);
    state.selectedIncidentId = newInc.id;

    // Log to CAD
    addCadLog('911 CAD', `NEW EMERGENCY #${newInc.id}: [${priority.toUpperCase()}] ${title} at ${bldInfo.name}. Reporter: ${callerName}. Assigned: ${assignee}`, priority === 'critical' ? 'critical' : 'dispatch');

    audio.playRadioSquelch();
    if (priority === 'critical') {
      setThreatCondition('red');
    }
    showToast(`Dispatched Emergency #${newInc.id}: ${title}`, 'success');

    closeModal('newIncidentModal');
    renderIncidents();
    updateResponseTrackingUI();

    // Recenter map on location
    if (bldKey === 'ksrcas') centerMapOn(490, 220, 1.4);
    else if (bldKey === 'sports') centerMapOn(680, 580, 1.4);
    else if (bldKey === 'hostels') centerMapOn(845, 495, 1.4);
    else if (bldKey === 'ksrct') centerMapOn(700, 220, 1.4);
    else if (bldKey === 'dental') centerMapOn(905, 260, 1.4);
    else if (bldKey === 'library') centerMapOn(600, 380, 1.4);
  }

  // Execute Full Perimeter Lockdown
  function executeCampusLockdown() {
    const code = document.getElementById('lockdownPasscode')?.value.trim();
    if (code !== '9911') {
      showToast('INVALID COMMAND PIN! Enter default PIN: 9911', 'danger');
      audio.playBeep(320, 0.2, 'sawtooth');
      return;
    }

    state.isLockdown = true;
    closeModal('lockdownModal');
    setThreatCondition('black');

    const portalTags = document.querySelectorAll('.metric-tag.locked');
    portalTags.forEach(tag => {
      tag.innerHTML = '<i class="fa-solid fa-lock"></i> 148 SECURED';
    });

    addCadLog('DEFENSE SEC', 'TOTAL KSR CAMPUS LOCKDOWN INITIATED. ALL 148 DOORS & HIGHWAY GATES ENGAGED.', 'critical');
    showToast('KSR CAMPUS-WIDE EMERGENCY LOCKDOWN ENGAGED!', 'danger');
  }

  // Building Inspection Modal
  function openBuildingModal(bldKey) {
    currentInspectBldKey = bldKey;
    const info = buildingDetails[bldKey];
    if (!info) return;

    document.getElementById('inspectBldName').textContent = info.name;
    document.getElementById('inspectBldSubtitle').textContent = info.subtitle;
    document.getElementById('inspectBldOcc').textContent = info.occupancy;
    document.getElementById('inspectBldDoors').textContent = info.doorsLocked;
    document.getElementById('inspectBldFire').textContent = info.fireStatus;
    document.getElementById('inspectBldHvac').textContent = info.hvacStatus;

    openModal('buildingInspectModal');
  }

  // Export After-Action Report (JSON / CSV)
  function exportIncidentHistory() {
    const report = {
      institution: "K.S. Rangasamy Educational Institutions",
      directorate: "Campus Emergency Control Center (ECC)",
      timestamp: new Date().toISOString(),
      threatCondition: state.threatLevel,
      activeIncidents: state.activeIncidents,
      historicalLog: state.incidentHistory,
      assignedFleet: state.units,
      cadStream: state.cadLogs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KSR_ECC_AfterAction_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    audio.playChime('success');
    showToast('Exported KSR ECC After-Action Incident Report (JSON)', 'success');
  }

  // ==========================================
  // 7. SIMULATION CRISIS DRILLS & MOCK INCIDENT ENGINE
  // ==========================================
  function setupCrisisDrills() {
    const drillBtn = document.getElementById('drillTriggerBtn');
    const drillMenu = document.getElementById('drillMenu');

    drillBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      drillMenu?.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      drillMenu?.classList.remove('show');
    });

    document.querySelectorAll('.drill-item[data-drill]').forEach(item => {
      item.addEventListener('click', () => {
        const drill = item.dataset.drill;
        triggerDrill(drill);
        drillMenu?.classList.remove('show');
      });
    });
  }

  function triggerDrill(type) {
    if (type === 'fire_block_b') {
      triggerMockFireBlockB();
    } else if (type === 'medical_library') {
      triggerMockMedLibrary();
    } else if (type === 'substation') {
      triggerMockSubstation();
    } else if (type === 'hazmat') {
      setThreatCondition('red');
      const bldNode = document.getElementById('bld-ksrcas');
      if (bldNode) bldNode.classList.add('has-hazard');
      document.getElementById('dangerPerimeterGroup').style.display = 'inline';
      centerMapOn(490, 220, 1.5);
      dispatchUnitTo('u2', 450, 200, 'KSRCAS BioTech Wing', 'HAZMAT CONTAINMENT');
      dispatchUnitTo('u1', 480, 250, 'KSRCAS Quad', 'PERIMETER CORDON');
      startZoneEvacuation('bld-ksrcas');
      addCadLog('DRILL SIM', 'SCENARIO ACTIVATED: Chemical vapor anomaly in KSRCAS BioTech Wing. Evacuation to M1 Athletic Ground.', 'critical');
      showLiveEmergencyAlert({
        title: 'Chemical Vapor Leak (Lab 3B)',
        desc: 'Acid gas anomaly in KSRCAS BioTech Wing. 150m cordon established. Building evacuation to Athletic Stadium.',
        location: 'KSRCAS BioTech Wing (3rd Floor)',
        severity: 'CODE RED • CRITICAL',
        code: '#EMG-842',
        units: 'Fire Tender 01, QRT Alpha',
        coords: { x: 490, y: 220 },
        bldId: 'bld-ksrcas',
        type: 'hazmat'
      });
      showToast('Drill Activated: BioTech HAZMAT Incident (KSRCAS)', 'danger');
    } else if (type === 'lockdown') {
      openModal('lockdownModal');
      dispatchUnitTo('u5', 275, 260, 'Gate 1 Checkpoint', 'SECURITY LOCKDOWN');
      showToast('Drill: Enter Command PIN 9911 to engage perimeter lockdown', 'info');
    } else if (type === 'tornado') {
      setThreatCondition('amber');
      applyBroadcastTemplate('weather');
      openModal('broadcastModal');
      addCadLog('DRILL SIM', 'SCENARIO ACTIVATED: Severe monsoon storm Doppler alert in Tiruchengode.', 'broadcast');
      showToast('Drill Activated: Severe Monsoon Weather Warning', 'info');
    } else if (type === 'medical') {
      selectIncident(843);
      showToast('Drill Activated: Cardiac / Heat Trauma Focus (Athletics Stadium)', 'info');
    } else if (type === 'reset') {
      resetSimulationBaseline();
    }
  }

  // Live Emergency Alert Popup Overlay Function
  function showLiveEmergencyAlert({ title, desc, location, severity, code, units, coords, bldId, type }) {
    const popup = document.getElementById('liveAlertPopup');
    if (!popup) return;

    document.getElementById('popupTitle').textContent = title;
    document.getElementById('popupDesc').textContent = desc;
    document.getElementById('popupLocation').textContent = location;
    document.getElementById('popupUnits').textContent = units;
    document.getElementById('popupSeverityTag').textContent = severity || 'CRITICAL ALERT';
    document.getElementById('popupCode').textContent = code || `#EMG-${Math.floor(100 + Math.random() * 900)}`;

    popup.className = 'live-emergency-popup';
    if (type === 'medical') popup.classList.add('medical-theme');
    else if (type === 'warning' || type === 'security') popup.classList.add('warning-theme');

    popup.style.display = 'flex';

    // Play appropriate tactical sound cue
    if (type === 'fire') {
      audio.playFireAlarm(4);
    } else if (type === 'medical') {
      audio.playMedicalSiren(4);
    } else if (type === 'hazmat') {
      audio.startKlaxonSiren(4);
    } else {
      audio.playDispatchChirp();
    }

    const trackBtn = document.getElementById('popupActionTrack');
    const evacBtn = document.getElementById('popupActionEvac');
    const dismissBtn = document.getElementById('popupActionDismiss');
    const closeBtn = document.getElementById('popupCloseBtn');

    function closePopup() {
      popup.style.animation = 'slideInDown 0.25s reverse ease forwards';
      setTimeout(() => {
        popup.style.display = 'none';
        popup.style.animation = '';
      }, 250);
    }

    if (trackBtn) {
      trackBtn.onclick = () => {
        if (coords) centerMapOn(coords.x, coords.y, 1.5);
        closePopup();
      };
    }

    if (evacBtn) {
      evacBtn.onclick = () => {
        if (bldId) startZoneEvacuation(bldId);
        closePopup();
      };
    }

    if (dismissBtn) dismissBtn.onclick = closePopup;
    if (closeBtn) closeBtn.onclick = closePopup;
  }

  // 🔥 Trigger Mock Incident: Fire in Block B (KSRCE Engineering)
  function triggerMockFireBlockB() {
    setThreatCondition('red');

    const incId = 901;
    let inc = state.activeIncidents.find(i => i.id === incId);
    if (!inc) {
      inc = {
        id: incId,
        title: 'Major Structural Fire Alarm - Block B Robotics Lab 204',
        category: 'fire',
        priority: 'critical',
        bldId: 'bld-ksrce',
        locationName: 'KSRCE Engineering Block B (Lab 204)',
        assignedUnit: 'KSR Fire Tender 01, QRT Alpha',
        timeAgo: 'Just now',
        elapsedSeconds: 0,
        stage: 2, // Dispatched
        status: 'Dispatched - En Route',
        notes: 'Thermal sensors & optical smoke detector triggered in Block B 2nd floor robotics annex. Fire suppression water deluge engaged. Immediate evacuation in progress.',
        coords: { x: 670, y: 495 }
      };
      state.activeIncidents.unshift(inc);
    }

    state.selectedIncidentId = incId;
    renderIncidents();
    updateResponseTrackingUI();

    const bldNode = document.getElementById('bld-ksrce');
    if (bldNode) {
      bldNode.classList.add('has-hazard', 'has-fire');
    }

    centerMapOn(670, 495, 1.5);

    // Dispatch responders with live trajectories!
    dispatchUnitTo('u2', 660, 475, 'KSRCE Block B', 'FIRE SUPPRESSION');
    dispatchUnitTo('u1', 680, 515, 'KSRCE Block B', 'PERIMETER CORDON');

    // Start moving evacuation of Block B (680 people) to Stadium
    startZoneEvacuation('bld-ksrce');

    // CAD Log
    addCadLog('FIRE CAD', 'CODE RED FIRE ALARM: Structural smoke & thermal alert in Block B (Lab 204). Fire Tender 01 & QRT Alpha rolling.', 'critical');

    // Update Global Banner
    const banner = document.getElementById('globalAlertBanner');
    if (banner) {
      banner.classList.remove('hidden');
      document.getElementById('bannerTitle').textContent = 'ACTIVE ALERT #901 [FIRE]:';
      document.getElementById('bannerBody').textContent = 'Confirmed structural fire in KSRCE Block B Robotics Annex. Evacuation in progress to Athletic Stadium. Responders on scene.';
    }

    // Show Live Alert Popup with Audio
    showLiveEmergencyAlert({
      title: 'Structural Fire in Block B (Lab 204)',
      desc: 'Multiple smoke & thermal sensors active. Fire suppression deluge active. Evacuation of 680 students underway to Athletic Stadium.',
      location: 'Block B (KSRCE Engineering Block)',
      severity: 'CODE RED • CRITICAL',
      code: '#EMG-901',
      units: 'Fire Tender 01, QRT Alpha',
      coords: { x: 670, y: 495 },
      bldId: 'bld-ksrce',
      type: 'fire'
    });

    showToast('Mock Scenario Activated: Fire in Block B (KSRCE)', 'danger');
  }

  // 🏥 Trigger Mock Incident: Medical Emergency in Library
  function triggerMockMedLibrary() {
    setThreatCondition('amber');

    const incId = 902;
    let inc = state.activeIncidents.find(i => i.id === incId);
    if (!inc) {
      inc = {
        id: incId,
        title: 'Acute Heat Exhaustion / Cardiac Event in Central Library',
        category: 'medical',
        priority: 'critical',
        bldId: 'bld-library',
        locationName: 'Central Digital Library (2nd Fl Reading Room)',
        assignedUnit: 'KSR Health Centre Ambulance 01',
        timeAgo: 'Just now',
        elapsedSeconds: 0,
        stage: 2, // Dispatched
        status: 'En Route (ETA 45s)',
        notes: 'Student collapsed unconscious with severe heat stroke in central reading room. Bystander CPR & AED cabinet 02 unlatched. Ambulance rolling.',
        coords: { x: 600, y: 380 }
      };
      state.activeIncidents.unshift(inc);
    }

    state.selectedIncidentId = incId;
    renderIncidents();
    updateResponseTrackingUI();

    const bldNode = document.getElementById('bld-library');
    if (bldNode) {
      bldNode.classList.add('has-medical');
    }

    centerMapOn(600, 380, 1.5);

    // Dispatch Ambulance 01 to Library
    dispatchUnitTo('u3', 600, 400, 'Central Digital Library', 'CARDIAC TRAUMA');

    // CAD Log
    addCadLog('EMS CAD', 'CODE BLUE: Acute medical trauma in Central Library 2nd Fl. Ambulance 01 dispatched with ICU paramedics.', 'critical');

    // Update Global Banner
    const banner = document.getElementById('globalAlertBanner');
    if (banner) {
      banner.classList.remove('hidden');
      document.getElementById('bannerTitle').textContent = 'ACTIVE ALERT #902 [MEDICAL]:';
      document.getElementById('bannerBody').textContent = 'Acute medical trauma in Central Digital Library 2nd Floor. Ambulance 01 dispatched with paramedics.';
    }

    // Show Live Alert Popup with Audio
    showLiveEmergencyAlert({
      title: 'Medical Emergency in Central Library',
      desc: 'Student collapsed in 2nd floor reading hall. Bystander first-aid in progress. Ambulance 01 dispatched with paramedics.',
      location: 'Central Digital Library (2nd Floor)',
      severity: 'CODE BLUE • HIGH',
      code: '#EMG-902',
      units: 'Health Ambulance 01',
      coords: { x: 600, y: 380 },
      bldId: 'bld-library',
      type: 'medical'
    });

    showToast('Mock Scenario Activated: Medical Emergency in Library', 'info');
  }

  // ⚡ Trigger Mock Substation Arc Flash
  function triggerMockSubstation() {
    setThreatCondition('amber');
    dispatchUnitTo('u6', 340, 480, '110kV Substation 2', 'GRID ARC SUPPRESSION');
    addCadLog('ELECTRICAL CAD', '110kV SUBSTATION 2 TRIP: Arc flash sensor triggered. TNEB grid disconnected. Backup diesel active.', 'critical');
    showLiveEmergencyAlert({
      title: '110kV Substation Transformer Arc',
      desc: 'High voltage arc fault detected. Campus automatic transfer switches transferred to backup diesel gen-sets.',
      location: '110kV Primary Substation 2',
      severity: 'GRID ALERT • HIGH',
      code: '#EMG-774',
      units: 'Disaster Electrical Squad',
      coords: { x: 340, y: 480 },
      type: 'warning'
    });
    showToast('Mock Scenario: 110kV Substation Transformer Fault', 'warning');
  }

  // Dispatch Unit Function
  function dispatchUnitTo(unitId, targetX, targetY, targetName, missionType) {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return;

    unit.targetX = targetX;
    unit.targetY = targetY;
    unit.targetName = targetName;
    unit.status = 'DISPATCHED (ETA: 45s)';
    unit.missionState = missionType;
    unit.zone = `Routing -> ${targetName}`;

    audio.playDispatchChirp();
    renderUnits();
  }

  // Dynamic Trajectory Engine for Field Responders
  function updateRespondersDynamicMovement() {
    let hasChanges = false;

    state.units.forEach(unit => {
      if (unit.targetX !== null && unit.targetY !== null) {
        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 12) {
          const step = Math.min(dist, unit.speed * simState.speed * 2.2);
          unit.x += (dx / dist) * step;
          unit.y += (dy / dist) * step;
          const eta = Math.max(1, Math.round(dist / (unit.speed * 4 * simState.speed)));
          unit.status = `EN ROUTE (ETA: ${eta}s)`;

          const el = document.getElementById(unit.elementId);
          if (el) el.setAttribute('transform', `translate(${Math.round(unit.x)}, ${Math.round(unit.y)})`);
          hasChanges = true;
        } else {
          // Reached target
          if (unit.targetName === 'BASE' || unit.targetName === 'PATROL') {
            unit.status = 'AVAILABLE';
            unit.targetX = null;
            unit.targetY = null;
            unit.zone = 'Stationed / Ready';
          } else {
            unit.status = 'ON SCENE';
            unit.zone = unit.targetName;
            unit.targetX = null;
            unit.targetY = null;
            unit.interventionTimer = 22;

            audio.playRadioSquelch();
            addCadLog('UNIT CAD', `ON SCENE: ${unit.name} arrived at ${unit.targetName}. Commencing tactical intervention.`, 'dispatch');
            showToast(`${unit.name} is ON SCENE at ${unit.targetName}`, 'success');
          }
          hasChanges = true;
        }
      } else if (unit.status === 'ON SCENE' && unit.interventionTimer > 0) {
        unit.interventionTimer -= 1 * simState.speed;
        if (unit.interventionTimer <= 10 && unit.interventionTimer > 0) {
          if (unit.type === 'medical') unit.status = 'STABILIZING PATIENT';
          else if (unit.type === 'hazmat') unit.status = 'SUPPRESSING FLAMES';
          else unit.status = 'CORDONING PERIMETER';
          hasChanges = true;
        } else if (unit.interventionTimer <= 0) {
          unit.status = 'INCIDENT CONTAINED';
          addCadLog('UNIT CAD', `MISSION SECURED: ${unit.name} completed intervention at ${unit.zone}. Returning to base.`, 'normal');
          audio.playChime('success');
          setTimeout(() => {
            unit.targetX = unit.homeX;
            unit.targetY = unit.homeY;
            unit.targetName = 'BASE';
          }, 3000);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      renderUnits();
    }
  }

  // Zone Evacuation Controllers
  function startZoneEvacuation(buildingId) {
    const bldKey = buildingId.replace('bld-', '');
    const details = buildingDetails[bldKey] || { name: 'Academic Zone', occupancy: '680 / 800' };
    const total = parseInt(details.occupancy.replace(/,/g, '')) || 680;

    simState.activeEvacuation = {
      isActive: true,
      buildingId: buildingId,
      buildingName: details.name,
      totalOccupants: total,
      evacuatedCount: 0,
      ratePerSec: 22,
      musterTarget: 'muster1',
      musterTargetName: 'Muster 1 (Athletic Stadium)',
      targetMusterBase: 620
    };

    const banner = document.getElementById('activeEvacBanner');
    if (banner) {
      banner.style.display = 'block';
      document.getElementById('evacActiveZoneName').textContent = details.name.toUpperCase();
      document.getElementById('evacPercentDisplay').textContent = '0%';
      document.getElementById('evacDynamicProgressBar').style.width = '0%';
      document.getElementById('evacAccountedText').textContent = `0 / ${total}`;
    }

    const evacRoutes = document.getElementById('evacuationRoutesGroup');
    if (evacRoutes) {
      evacRoutes.classList.add('evac-route-flow');
    }

    const bldNode = document.getElementById(buildingId);
    if (bldNode) bldNode.classList.add('has-hazard');

    audio.playEvacWarningPulse();
    addCadLog('EVAC CAD', `ZONE EVACUATION ACTIVATED: Order issued for ${details.name}. Personnel moving to Athletic Stadium.`, 'broadcast');
    showToast(`Evacuation in Progress: ${details.name}`, 'warning');
  }

  function haltZoneEvacuation() {
    simState.activeEvacuation.isActive = false;
    const banner = document.getElementById('activeEvacBanner');
    if (banner) banner.style.display = 'none';

    const evacRoutes = document.getElementById('evacuationRoutesGroup');
    if (evacRoutes) evacRoutes.classList.remove('evac-route-flow');

    addCadLog('EVAC CAD', 'Evacuation flow halted by Command Operator.', 'normal');
    showToast('Active Evacuation Halted', 'info');
  }

  // Evacuation Dynamic Flow Loop
  function updateEvacuationDynamicFlow() {
    if (!simState.activeEvacuation.isActive) return;

    const evac = simState.activeEvacuation;
    const step = evac.ratePerSec * simState.speed * 0.4;
    evac.evacuatedCount += step;

    if (evac.evacuatedCount >= evac.totalOccupants) {
      evac.evacuatedCount = evac.totalOccupants;
      evac.isActive = false;
      audio.playSuccessTriad();
      addCadLog('EVAC CAD', `ALL CLEAR: Evacuation of ${evac.buildingName} 100% complete. Total ${evac.totalOccupants} occupants safely assembled at ${evac.musterTargetName}.`, 'broadcast');
      showToast(`${evac.buildingName} EVACUATION 100% COMPLETE - All Clear!`, 'success');
      const evacPct = document.getElementById('evacPercentDisplay');
      if (evacPct) evacPct.textContent = '100% (ALL CLEAR)';
    }

    const pct = Math.min(100, Math.round((evac.evacuatedCount / evac.totalOccupants) * 100));

    const pBar = document.getElementById('evacDynamicProgressBar');
    const pPct = document.getElementById('evacPercentDisplay');
    const pAcc = document.getElementById('evacAccountedText');
    const pGlob = document.getElementById('globalEvacPill');

    if (pBar) pBar.style.width = `${pct}%`;
    if (pPct) pPct.textContent = `${pct}%`;
    if (pAcc) pAcc.textContent = `${Math.round(evac.evacuatedCount)} / ${evac.totalOccupants}`;
    if (pGlob) pGlob.textContent = `${Math.min(99, 85 + Math.round(pct * 0.14))}% ACCOUNTED`;

    // Dynamic muster bar 1 update
    const newCount = Math.min(1200, Math.round(evac.targetMusterBase + (evac.evacuatedCount * 0.8)));
    const m1Stat = document.getElementById('muster1Stat');
    const m1Bar = document.getElementById('muster1Bar');
    if (m1Stat) m1Stat.textContent = `${newCount} / 1200 SAFE`;
    if (m1Bar) m1Bar.style.width = `${Math.round((newCount / 1200) * 100)}%`;

    // Dynamic animated evacuee particles on map
    const particlesGroup = document.getElementById('evacParticlesGroup');
    if (particlesGroup) {
      if (Math.random() < 0.6) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', 660 + (Math.random() * 20 - 10));
        dot.setAttribute('cy', 495 + (Math.random() * 20 - 10));
        dot.setAttribute('r', '3');
        dot.setAttribute('class', 'evac-particle');
        particlesGroup.appendChild(dot);

        // Animate towards stadium (435, 610)
        let t = 0;
        const anim = setInterval(() => {
          t += 0.05 * simState.speed;
          if (t >= 1) {
            clearInterval(anim);
            dot.remove();
          } else {
            const curX = 660 + (435 - 660) * t;
            const curY = 495 + (610 - 495) * t;
            dot.setAttribute('cx', curX);
            dot.setAttribute('cy', curY);
          }
        }, 50);
      }
    }
  }

  // Restore Dashboard to Condition Green Baseline
  function resetSimulationBaseline() {
    haltZoneEvacuation();
    setThreatCondition('green');

    document.querySelectorAll('.building-node').forEach(node => {
      node.classList.remove('has-hazard', 'has-fire', 'has-medical', 'has-warning');
    });

    state.units.forEach(u => {
      u.x = u.homeX;
      u.y = u.homeY;
      u.targetX = null;
      u.targetY = null;
      u.targetName = '';
      u.interventionTimer = 0;
      u.status = u.type === 'drone' ? 'AIRBORNE 45M' : 'AVAILABLE';
      u.zone = u.type === 'drone' ? 'Campus Central Airspace' : 'Station Base';

      const el = document.getElementById(u.elementId);
      if (el) el.setAttribute('transform', `translate(${u.x}, ${u.y})`);
    });
    renderUnits();

    const popup = document.getElementById('liveAlertPopup');
    if (popup) popup.style.display = 'none';

    const perimeter = document.getElementById('dangerPerimeterGroup');
    if (perimeter) perimeter.style.display = 'none';

    const banner = document.getElementById('globalAlertBanner');
    if (banner) banner.classList.add('hidden');

    document.getElementById('muster1Stat').textContent = '620 / 1200 SAFE';
    document.getElementById('muster1Bar').style.width = '52%';
    document.getElementById('muster2Stat').textContent = '890 / 1100 SAFE';
    document.getElementById('muster2Bar').style.width = '81%';
    document.getElementById('muster3Stat').textContent = '410 / 500 (HIGH CAP)';
    document.getElementById('muster3Bar').style.width = '82%';
    document.getElementById('globalEvacPill').textContent = '96% ACCOUNTED';

    const particles = document.getElementById('evacParticlesGroup');
    if (particles) particles.innerHTML = '';

    resetMapView();
    audio.playChime('success');
    addCadLog('SYS RESTORE', 'Simulation drills reset. Threat matrix returned to baseline Condition Green.', 'normal');
    showToast('Dashboard reset to Baseline Condition Green', 'success');
  }

  // Setup Simulation Cockpit Modal & Interactive Engine
  function setupSimulationCockpit() {
    document.getElementById('simCockpitBtn')?.addEventListener('click', () => {
      openModal('simCockpitModal');
      audio.init();
    });
    document.getElementById('openCockpitFromMenu')?.addEventListener('click', () => {
      openModal('simCockpitModal');
      document.getElementById('drillMenu')?.classList.remove('show');
      audio.init();
    });

    document.getElementById('btnSimResume')?.addEventListener('click', () => {
      simState.isRunning = true;
      updateSimStatusUI();
      audio.playChime('success');
      showToast('Simulation Engine Running', 'success');
    });

    document.getElementById('btnSimPause')?.addEventListener('click', () => {
      simState.isRunning = false;
      updateSimStatusUI();
      audio.playBeep(450, 0.06);
      showToast('Simulation Engine Paused', 'warning');
    });

    document.getElementById('btnSimReset')?.addEventListener('click', () => {
      resetSimulationBaseline();
      closeModal('simCockpitModal');
    });

    document.querySelectorAll('.sim-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseInt(btn.dataset.speed) || 1;
        simState.speed = speed;
        document.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateSimStatusUI();
        audio.playBeep(700, 0.04);
        showToast(`Simulation Speed: ${speed}X`, 'info');
      });
    });

    const chkAuto = document.getElementById('chkAutoEvents');
    if (chkAuto) {
      chkAuto.addEventListener('change', (e) => {
        simState.autoEvents = e.target.checked;
        showToast(`Autonomous Simulation Scenarios: ${simState.autoEvents ? 'ACTIVE' : 'PAUSED'}`, 'info');
      });
    }

    // Mock scenario card triggers
    document.getElementById('triggerMockFireBlockB')?.addEventListener('click', () => {
      closeModal('simCockpitModal');
      triggerMockFireBlockB();
    });

    document.getElementById('triggerMockMedLibrary')?.addEventListener('click', () => {
      closeModal('simCockpitModal');
      triggerMockMedLibrary();
    });

    document.getElementById('triggerMockHazmat')?.addEventListener('click', () => {
      closeModal('simCockpitModal');
      triggerDrill('hazmat');
    });

    document.getElementById('triggerMockLockdown')?.addEventListener('click', () => {
      closeModal('simCockpitModal');
      triggerDrill('lockdown');
    });

    document.getElementById('triggerMockSubstation')?.addEventListener('click', () => {
      closeModal('simCockpitModal');
      triggerMockSubstation();
    });

    document.getElementById('btnSimTriggerEvac')?.addEventListener('click', () => {
      const select = document.getElementById('simEvacTargetSelect');
      const bldId = select ? select.value : 'bld-ksrce';
      startZoneEvacuation(bldId);
      closeModal('simCockpitModal');
    });

    document.getElementById('btnSimHaltEvac')?.addEventListener('click', () => {
      haltZoneEvacuation();
    });

    document.getElementById('modalAudioToggleBtn')?.addEventListener('click', toggleTacticalAudio);

    document.querySelectorAll('.sound-test-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.init();
        const sound = btn.dataset.sound;
        if (sound === 'fire') audio.playFireAlarm(3);
        else if (sound === 'medical') audio.playMedicalSiren(3);
        else if (sound === 'klaxon') audio.startKlaxonSiren(3);
        else if (sound === 'squelch') audio.playRadioSquelch();
        else if (sound === 'dispatch') audio.playDispatchChirp();
        else if (sound === 'evac') audio.playEvacWarningPulse();
        else if (sound === 'chime') audio.playSuccessTriad();
      });
    });
  }

  function updateSimStatusUI() {
    const headerStatus = document.getElementById('simHeaderStatus');
    const modalPill = document.getElementById('modalSimStatusPill');

    const statusText = simState.isRunning ? `RUNNING (${simState.speed}X)` : 'PAUSED';

    if (headerStatus) {
      headerStatus.textContent = simState.isRunning ? `${simState.speed}X RUN` : 'PAUSED';
      headerStatus.className = `sim-pill-status ${simState.isRunning ? '' : 'paused'}`;
    }
    if (modalPill) {
      modalPill.textContent = statusText;
      modalPill.className = `sim-pill-status ${simState.isRunning ? '' : 'paused'}`;
    }
  }

  // ==========================================
  // 8. REAL-TIME BACKGROUND SIMULATION (TICKER)
  // ==========================================
  function startSimulationLoop() {
    // 1. Live IST Clock (1s tick)
    setInterval(updateLiveClock, 1000);

    // 2. Response Chronometer Ticker (1s tick for all active incidents)
    setInterval(() => {
      if (!simState.isRunning) return;
      state.activeIncidents.forEach(inc => {
        inc.elapsedSeconds += 1 * simState.speed;
      });
      updateResponseTrackingUI();
    }, 1000);

    // 3. SkyGuard UAV circular reconnaissance patrol
    setInterval(() => {
      if (!simState.isRunning) return;
      state.droneAngle += 0.04 * simState.speed;
      const radiusX = 140;
      const radiusY = 90;
      const centerX = 600;
      const centerY = 340;

      const newX = Math.round(centerX + Math.cos(state.droneAngle) * radiusX);
      const newY = Math.round(centerY + Math.sin(state.droneAngle) * radiusY);

      const droneMarker = document.getElementById('unit-drone-01');
      if (droneMarker) {
        droneMarker.setAttribute('transform', `translate(${newX}, ${newY})`);
      }
    }, 200);

    // 4. Units Real-Time Dynamic Movement & Status Transitions
    setInterval(() => {
      if (!simState.isRunning) return;
      updateRespondersDynamicMovement();
    }, 250);

    // 5. Active Evacuation Flow Progress & Muster Accumulation
    setInterval(() => {
      if (!simState.isRunning) return;
      updateEvacuationDynamicFlow();
    }, 400);

    // 6. Periodic KSR Radio Comms Chatter Simulation
    const mockRadioChatter = [
      "QRT Alpha to Dispatch: KSRCAS BioTech perimeter isolated. Evacuation to M1 Stadium running orderly.",
      "KSR SkyGuard UAV: Aerial feed clear over Bharathi Hostel. Gate 2 checked by Bike Squad 03.",
      "Health Ambulance 01: On scene at Callbox 14. Paramedics administering emergency vitals.",
      "Substation Tech: 110kV feed stable. Backup diesel generators tested and operational.",
      "Highway Checkpoint: Gate 1 boom barrier verified. ANPR scanning incoming university buses.",
      "Central Library Security: Reading hall floor 2 clear. Student vital signs stabilized.",
      "Disaster Unit 1: Water pressure normal on hydrants H-04 and H-07."
    ];

    setInterval(() => {
      if (!simState.isRunning) return;
      if (Math.random() < 0.35) {
        const chatter = mockRadioChatter[Math.floor(Math.random() * mockRadioChatter.length)];
        addCadLog('KSR MESH', chatter, 'normal');
      }
    }, 20000);

    // 7. Autonomous Scenario / Emergency Alert Injection
    setInterval(() => {
      if (!simState.isRunning || !simState.autoEvents) return;
      const roll = Math.random();
      if (roll < 0.15 && state.activeIncidents.length < 4) {
        // Minor dynamic callbox alarm or sensor anomaly
        const sensorNotes = [
          { bld: 'bld-foodcourt', title: 'Kitchen Heat Sensor Flare in Food Court', cat: 'facility', loc: 'Food Court Central Kitchen' },
          { bld: 'bld-hostels', title: 'RFID Unlatched Event in Tagore Hostel Block', cat: 'security', loc: 'Tagore Hostel Quad' }
        ];
        const pick = sensorNotes[Math.floor(Math.random() * sensorNotes.length)];
        addCadLog('MESH ALERT', `Automated IoT Trigger: ${pick.title}`, 'dispatch');
        audio.playDispatchChirp();
      }
    }, 30000);
  }

  // Setup CCTV Modes
  function setupCctvModes() {
    const modes = ['cctvNormalMode', 'cctvThermalMode', 'cctvNightMode'];
    modes.forEach(id => {
      const btn = document.getElementById(id);
      btn?.addEventListener('click', () => {
        modes.forEach(m => document.getElementById(m)?.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;

        const screens = document.querySelectorAll('.cctv-screen-render');
        screens.forEach(screen => {
          screen.classList.remove('thermal-mode', 'night-mode');
          if (mode === 'thermal') screen.classList.add('thermal-mode');
          else if (mode === 'night') screen.classList.add('night-mode');
        });

        audio.playBeep(880, 0.05);
        showToast(`CCTV Optical Sensor Filter: ${mode.toUpperCase()}`, 'info');
      });
    });
  }

  // Mobile Bottom Navigation Dock Handlers
  function setupMobileNavigation() {
    const navButtons = document.querySelectorAll('.mobile-nav-btn[data-tab]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply body class for CSS switching
        document.body.classList.remove(
          'mobile-tab-map', 
          'mobile-tab-alerts', 
          'mobile-tab-tracking', 
          'mobile-tab-teams', 
          'mobile-tab-history'
        );
        document.body.classList.add(`mobile-tab-${tab}`);

        if (tab === 'history') {
          // Switch to history view inside left sidebar
          document.getElementById('tabIncidentHistory')?.click();
        } else if (tab === 'alerts') {
          document.getElementById('tabActiveIncidents')?.click();
        }

        audio.playBeep(700, 0.04);
      });
    });
  }

  // Keyboard Shortcuts Setup
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') document.activeElement.blur();
        return;
      }

      const key = e.key.toUpperCase();
      if (key === 'B') {
        openModal('broadcastModal');
      } else if (key === 'L') {
        openModal('lockdownModal');
      } else if (key === 'N' || key === 'R') {
        openModal('newIncidentModal');
      } else if (key === 'M') {
        toggleTacticalAudio();
      } else if (e.code === 'Space') {
        e.preventDefault();
        centerMapOn(490, 220, 1.6);
        audio.playBeep(700, 0.05);
      } else if (key === '1') {
        setThreatCondition('green');
      } else if (key === '2') {
        setThreatCondition('amber');
      } else if (key === '3') {
        setThreatCondition('red');
      } else if (key === '4') {
        setThreatCondition('black');
      } else if (key === 's') {
        const modal = document.getElementById('simCockpitModal');
        if (modal?.classList.contains('show')) closeModal('simCockpitModal');
        else openModal('simCockpitModal');
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.show').forEach(m => m.classList.remove('show'));
      }
    });
  }

  // Audio Toggle Button (Syncs Header and Cockpit Buttons)
  function toggleTacticalAudio() {
    const isMuted = audio.toggleMute();
    const btn = document.getElementById('toggleAudioBtn');
    const icon = document.getElementById('audioIcon');
    const txt = document.getElementById('audioStatusText');

    const modalBtn = document.getElementById('modalAudioToggleBtn');
    const modalIcon = document.getElementById('modalAudioIcon');
    const modalTxt = document.getElementById('modalAudioStatusText');

    if (isMuted) {
      btn?.classList.add('muted');
      icon?.classList.replace('fa-volume-high', 'fa-volume-xmark');
      if (txt) txt.textContent = 'MUTED';

      modalBtn?.classList.add('muted');
      modalIcon?.classList.replace('fa-volume-high', 'fa-volume-xmark');
      if (modalTxt) modalTxt.textContent = 'MUTED';

      showToast('Tactical Audio & Sirens MUTED', 'info');
    } else {
      btn?.classList.remove('muted');
      icon?.classList.replace('fa-volume-xmark', 'fa-volume-high');
      if (txt) txt.textContent = 'AUDIO ON';

      modalBtn?.classList.remove('muted');
      modalIcon?.classList.replace('fa-volume-xmark', 'fa-volume-high');
      if (modalTxt) modalTxt.textContent = 'AUDIO ON';

      audio.playBeep(880, 0.06);
      showToast('Tactical Audio & Sirens ACTIVE', 'success');
    }
  }

  // Manual CAD entry form
  function setupCadInput() {
    const input = document.getElementById('manualLogInput');
    const btn = document.getElementById('postLogBtn');

    function submitLog() {
      const val = input?.value.trim();
      if (!val) return;
      addCadLog('OPERATOR', val, 'dispatch');
      input.value = '';
      audio.playBeep(750, 0.04);
    }

    btn?.addEventListener('click', submitLog);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitLog();
    });

    document.getElementById('playRadioChatterBtn')?.addEventListener('click', () => {
      audio.playRadioSquelch();
      showToast('KSR Security Radio Repeater: 460.125 MHz [SIGNAL 5/5]', 'info');
    });

    document.getElementById('exportLogBtn')?.addEventListener('click', () => {
      exportIncidentHistory();
    });
  }

  // Fullscreen Toggle
  function setupFullscreen() {
    const btn = document.getElementById('fullscreenBtn');
    btn?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // ==========================================
  // 9. APP INITIALIZATION
  // ==========================================
  function init() {
    updateLiveClock();
    renderIncidents();
    renderIncidentHistory();
    updateResponseTrackingUI();
    renderUnits();
    renderCadLogs();
    setupMapControls();
    setupThreatControls();
    setupModals();
    setupCrisisDrills();
    setupSimulationCockpit();
    setupCctvModes();
    setupCadInput();
    setupMobileNavigation();
    setupKeyboardShortcuts();
    setupFullscreen();
    startSimulationLoop();

    if (window.innerWidth <= 1024) {
      document.body.classList.add('mobile-tab-map');
    }

    document.getElementById('toggleAudioBtn')?.addEventListener('click', toggleTacticalAudio);

    // Initial Welcome Greeting Toast
    setTimeout(() => {
      showToast('KSR Institutions Emergency Control Center Ready. Press [S] for Simulation Cockpit, [R] to Report Emergency.', 'info');
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
