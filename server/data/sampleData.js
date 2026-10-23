const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000);

export const sampleIncidents = [
  {
    id: "INC-0412",
    title: "Riverside Colony, Ward 7: water rising in residential lanes",
    category: "Flood",
    severity: "Critical",
    score: 94,
    status: "Active",
    summary: "River level crossed the danger mark. Ground-floor homes are flooding and an elderly-care home sits inside the predicted flood zone.",
    atRisk: 420,
    eta: "11 min",
    confidence: 91,
    reportCount: 7,
    createdAt: minutesAgo(18),
    location: { lat: 19.076, lng: 72.878 },
    mapPosition: { x: 27, y: 54 },
    factors: [
      { name: "People at risk", points: 36, description: "Dense residential area; about 420 people inside the predicted zone." },
      { name: "Time criticality", points: 24, description: "Water rising roughly 8 cm per 10 min. Lanes may be impassable within 25 min." },
      { name: "Vulnerable groups", points: 18, description: "Care home and a primary school mentioned in 3 reports." },
      { name: "Report corroboration", points: 16, description: "7 independent reports plus a river-gauge reading." }
    ],
    duplicateReports: [
      { id: "REP-7832", match: 92, text: "Paani ghar ke andar aa gaya, bachche chat par hain.", source: "SMS", age: "18 min ago", location: { lat: 19.0762, lng: 72.8784 } },
      { id: "REP-7834", match: 96, text: "Water entering homes near the old temple, elderly people stuck.", source: "Helpline call", age: "13 min ago", location: { lat: 19.0758, lng: 72.8778 } },
      { id: "REP-7835", match: 95, text: "Riverside colony lane 3 completely under water.", source: "Social post", age: "12 min ago", location: { lat: 19.0763, lng: 72.8779 } }
    ],
    response: {
      units: [
        { name: "Boat rescue team x2", code: "R1" },
        { name: "Medical unit x1", code: "H1" },
        { name: "Relief camp prepared", code: "Govt school, Sector 4" }
      ],
      steps: [
        "Leave R1 via Canal Road heading west.",
        "Avoid Mill Lane: flooded, reported by 2 field teams.",
        "Launch boats at the Ward 7 embankment, then enter on foot."
      ],
      alternate: "Via Mill Lane is blocked. Re-check the river gauge before the second trip.",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=19.076,72.878"
    }
  },
  {
    id: "INC-0415",
    title: "Industrial Area Phase 2: warehouse fire with chemical storage",
    category: "Fire",
    severity: "Critical",
    score: 88,
    status: "Active",
    summary: "A large warehouse fire is spreading toward a chemical storage unit. Nearby workers are evacuating; wind is carrying smoke toward the east.",
    atRisk: 185,
    eta: "8 min",
    confidence: 87,
    reportCount: 4,
    createdAt: minutesAgo(9),
    location: { lat: 19.093, lng: 72.912 },
    mapPosition: { x: 68, y: 31 },
    factors: [
      { name: "People at risk", points: 31, description: "Workers and neighboring businesses are within the current evacuation area." },
      { name: "Hazard escalation", points: 27, description: "Chemical storage is exposed to heat and could intensify the fire." },
      { name: "Smoke exposure", points: 17, description: "Wind direction may carry smoke toward occupied streets." },
      { name: "Report corroboration", points: 13, description: "4 independent calls report visible flames and smoke." }
    ],
    duplicateReports: [],
    response: {
      units: [
        { name: "Fire engine x2", code: "F2" },
        { name: "Hazmat unit x1", code: "H2" },
        { name: "Police cordon x1", code: "P4" }
      ],
      steps: [
        "Approach via Service Road from the north entrance.",
        "Establish a 300 m exclusion zone around the east wall.",
        "Keep crews upwind; confirm chemical inventory before entry."
      ],
      alternate: "South access road is restricted by industrial traffic.",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=19.093,72.912"
    }
  },
  {
    id: "INC-0418",
    title: "Highway Junction: multi-vehicle collision, lane blocked",
    category: "Accident",
    severity: "High",
    score: 71,
    status: "Active",
    summary: "A multi-vehicle collision is blocking two lanes near the junction. Multiple people are reported injured; traffic is backing up in both directions.",
    atRisk: 12,
    eta: "7 min",
    confidence: 84,
    reportCount: 3,
    createdAt: minutesAgo(14),
    location: { lat: 19.065, lng: 72.902 },
    mapPosition: { x: 81, y: 67 },
    factors: [
      { name: "Injury reports", points: 28, description: "Callers report multiple injured people needing assessment." },
      { name: "Access obstruction", points: 19, description: "Two lanes are blocked and emergency access is narrowing." },
      { name: "Traffic exposure", points: 14, description: "Slow-moving traffic is approaching the scene from both directions." },
      { name: "Report corroboration", points: 10, description: "3 reports agree on the location and blocked lanes." }
    ],
    duplicateReports: [],
    response: {
      units: [
        { name: "Ambulance x2", code: "A2" },
        { name: "Traffic unit x1", code: "T1" },
        { name: "Tow truck x1", code: "TOW" }
      ],
      steps: [
        "Approach from the east service road.",
        "Close the southbound slip lane and protect the scene.",
        "Triage patients before requesting additional transport."
      ],
      alternate: "Use the east service road if the main junction is blocked.",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=19.065,72.902"
    }
  },
  {
    id: "INC-0421",
    title: "Relief camp: patient needs urgent dialysis access",
    category: "Medical",
    severity: "Medium",
    score: 58,
    status: "Active",
    summary: "A patient at the north relief camp needs time-sensitive dialysis. The usual clinic is temporarily inaccessible due to flooding.",
    atRisk: 1,
    eta: "15 min",
    confidence: 89,
    reportCount: 1,
    createdAt: minutesAgo(22),
    location: { lat: 19.082, lng: 72.861 },
    mapPosition: { x: 46, y: 78 },
    factors: [
      { name: "Time-sensitive care", points: 23, description: "Delayed dialysis can quickly become a medical emergency." },
      { name: "Access constraints", points: 15, description: "Flooding has temporarily blocked the patient's usual clinic." },
      { name: "Patient vulnerability", points: 12, description: "A clinician has confirmed that transport is required." },
      { name: "Report corroboration", points: 8, description: "A report from the relief camp confirms the request." }
    ],
    duplicateReports: [],
    response: {
      units: [
        { name: "Medical unit x1", code: "M2" },
        { name: "Transport ambulance x1", code: "A1" },
        { name: "Dialysis clinic notified", code: "CITY" }
      ],
      steps: [
        "Contact the receiving clinic and confirm dialysis availability.",
        "Take the elevated route via North Bridge.",
        "Transport with the attending camp clinician."
      ],
      alternate: "Coordinate with the city clinic if North Bridge becomes inaccessible.",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=19.082,72.861"
    }
  },
  {
    id: "INC-0423",
    title: "Old Mill underpass: vehicles stranded in waterlogging",
    category: "Rescue",
    severity: "Low",
    score: 42,
    status: "Active",
    summary: "Two vehicles are stuck in standing water at the underpass. Occupants are on higher ground and have confirmed they are safe.",
    atRisk: 6,
    eta: "18 min",
    confidence: 78,
    reportCount: 2,
    createdAt: minutesAgo(41),
    location: { lat: 19.057, lng: 72.884 },
    mapPosition: { x: 15, y: 30 },
    factors: [
      { name: "People at risk", points: 16, description: "Occupants are stranded but currently confirmed safe." },
      { name: "Access obstruction", points: 12, description: "Waterlogging has closed the underpass to traffic." },
      { name: "Weather conditions", points: 9, description: "Ongoing rain may raise the water level further." },
      { name: "Report corroboration", points: 5, description: "2 reports identify the same underpass." }
    ],
    duplicateReports: [],
    response: {
      units: [
        { name: "Road rescue crew x1", code: "R2" },
        { name: "Traffic unit x1", code: "T3" },
        { name: "Recovery vehicle x1", code: "RV" }
      ],
      steps: [
        "Close both approaches and divert through Old Mill Road.",
        "Confirm occupants remain above the water line.",
        "Recover vehicles once the water level is declared safe."
      ],
      alternate: "Use Old Mill Road to bypass the underpass.",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=19.057,72.884"
    }
  },
  {
    id: "INC-0425",
    title: "Residential block: gas smell reported on 2nd floor",
    category: "Hazard",
    severity: "Low",
    score: 27,
    status: "Active",
    summary: "A resident has reported a possible gas smell on the second floor. No symptoms or fire are reported; source is not yet confirmed.",
    atRisk: 24,
    eta: "13 min",
    confidence: 72,
    reportCount: 1,
    createdAt: minutesAgo(6),
    location: { lat: 19.089, lng: 72.853 },
    mapPosition: { x: 59, y: 50 },
    factors: [
      { name: "Occupancy", points: 10, description: "Residents remain inside the building pending assessment." },
      { name: "Hazard uncertainty", points: 8, description: "The reported odor has not yet been confirmed by responders." },
      { name: "Preventive action", points: 6, description: "A precautionary check can reduce risk before conditions change." },
      { name: "Report corroboration", points: 3, description: "One report so far; no independent confirmation." }
    ],
    duplicateReports: [],
    response: {
      units: [
        { name: "Fire safety team x1", code: "F1" },
        { name: "Utility technician x1", code: "UT" },
        { name: "Building warden notified", code: "BLDG" }
      ],
      steps: [
        "Stage outside the building and notify the utility technician.",
        "Ask occupants not to operate switches or ignition sources.",
        "Ventilate and clear the floor only when responders confirm safe."
      ],
      alternate: "Request the utility emergency crew if the source is confirmed.",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=19.089,72.853"
    }
  }
];

export const resourceTypes = [
  { name: "Rescue boats", available: 2, total: 4, unit: "ready" },
  { name: "Fire engines", available: 3, total: 5, unit: "ready" },
  { name: "Ambulances", available: 4, total: 6, unit: "ready" },
  { name: "Medical / hazmat units", available: 2, total: 3, unit: "ready" }
];
