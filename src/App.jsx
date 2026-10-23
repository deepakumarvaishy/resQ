import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Cross,
  Droplets,
  ExternalLink,
  Flame,
  LocateFixed,
  MapPin,
  Menu,
  Radio,
  ShieldAlert,
  Siren,
  Sparkles,
  X
} from "lucide-react";

const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const iconByCategory = {
  Flood: Droplets,
  Fire: Flame,
  Accident: AlertTriangle,
  Medical: Cross,
  Rescue: ShieldAlert,
  Hazard: Radio
};
const fallbackPosition = [
  { left: 27, top: 54 },
  { left: 68, top: 31 },
  { left: 81, top: 67 },
  { left: 46, top: 78 },
  { left: 15, top: 30 },
  { left: 59, top: 50 }
];

function formatAge(createdAt) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  return minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min ago`;
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("All");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideRoute, setOverrideRoute] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisRationale, setAnalysisRationale] = useState("");
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error(`Dashboard request failed (${response.status})`);
      const data = await response.json();
      setDashboard(data);
      setSelectedId((current) => data.incidents.some((item) => item.id === current) ? current : data.incidents[0]?.id ?? "");
    } catch (requestError) {
      setError(requestError.message || "Could not connect to the ResQ API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 45000);
    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  const incidents = dashboard?.incidents ?? [];
  const activeIncidents = useMemo(
    () => incidents.filter((incident) => incident.status !== "Resolved")
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.score - a.score),
    [incidents]
  );
  const visibleIncidents = filter === "All"
    ? activeIncidents
    : activeIncidents.filter((incident) => incident.severity === filter);
  const selected = incidents.find((incident) => incident.id === selectedId) ?? activeIncidents[0];
  const duplicates = selected
    ? (dashboard?.duplicates ?? []).filter((report) => report.incidentId === selected.id)
    : [];
  const counts = useMemo(() => ({
    critical: activeIncidents.filter((item) => item.severity === "Critical").length,
    high: activeIncidents.filter((item) => item.severity === "High").length,
    medium: activeIncidents.filter((item) => item.severity === "Medium").length,
    low: activeIncidents.filter((item) => item.severity === "Low").length
  }), [activeIncidents]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setRouteInfo(null);
    setAnalysisRationale("");
  }, [selectedId]);

  async function explainSelected() {
    if (!selected) return;
    setAnalysisBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/incidents/${selected.id}/analyze`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Analysis failed (${response.status})`);
      setDashboard((current) => ({
        ...current,
        incidents: current.incidents.map((incident) => incident.id === selected.id
          ? { ...incident, factors: result.factors }
          : incident)
      }));
      setAnalysisRationale(result.rationale);
    } catch (requestError) {
      setError(requestError.message || "Incident analysis could not be refreshed.");
    } finally {
      setAnalysisBusy(false);
    }
  }

  async function checkRoute() {
    if (!selected) return;
    setRouteBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/incidents/${selected.id}/route`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Route request failed (${response.status})`);
      setRouteInfo(result);
    } catch (requestError) {
      setError(requestError.message || "The route could not be checked.");
    } finally {
      setRouteBusy(false);
    }
  }

  async function runAction(path, body, successMessage) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Action failed (${response.status})`);
      setDashboard(result.dashboard);
      setNotice(successMessage);
      setOverrideOpen(false);
    } catch (requestError) {
      setError(requestError.message || "The requested action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const mapPins = activeIncidents.map((incident, index) => ({
    ...incident,
    position: fallbackPosition[index % fallbackPosition.length]
  }));
  const routeEnd = selected
    ? { x: (selected.mapPosition?.x ?? 50) * 10, y: (selected.mapPosition?.y ?? 50) * 4.8 }
    : null;
  const routePath = routeEnd
    ? `M360 115 C360 185 ${routeEnd.x + 80} ${routeEnd.y - 100} ${routeEnd.x} ${routeEnd.y}`
    : "";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="ResQ AI home">
          <span className="brand-mark"><Siren size={19} strokeWidth={2.4} /></span>
          <span className="brand-copy"><strong>ResQ <b>AI</b></strong><small>Emergency response, coordinated.</small></span>
        </a>
        <button className="mobile-queue-toggle" onClick={() => setMobileQueueOpen((open) => !open)} aria-label="Toggle incident queue">
          <Menu size={19} />
        </button>
        <div className="topbar-right">
          <div className="top-stat"><strong>{activeIncidents.length}</strong><span>Active incidents</span></div>
          <div className="top-stat"><strong>{dashboard?.reportsReceived ?? 18} <i>→</i> {dashboard?.reportsMerged ?? 6}</strong><span>Reports, merged by AI</span></div>
          <div className="top-stat"><strong>{dashboard?.resources?.dispatched ?? 0}</strong><span>Teams dispatched</span></div>
          <div className="live-chip"><span className="live-dot" />{dashboard?.mode === "mongodb" ? "MongoDB connected" : "Demo · sample data"}</div>
        </div>
      </header>

      {error && <div className="error-banner" role="alert"><AlertTriangle size={15} />{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={15} /></button></div>}
      {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}

      <section className="dashboard-grid">
        <aside className={`queue-panel panel ${mobileQueueOpen ? "queue-panel-open" : ""}`}>
          <div className="panel-heading queue-heading">
            <div><h2>AI priority queue</h2><span>Ranked by urgency score</span></div>
            <button className="mobile-close" onClick={() => setMobileQueueOpen(false)} aria-label="Close queue"><X size={17} /></button>
          </div>
          <div className="queue-filters" aria-label="Filter incidents by severity">
            {["All", "Critical", "High", "Medium", "Low"].map((level) => (
              <button key={level} className={`filter-chip ${filter === level ? "filter-chip-active" : ""}`} onClick={() => setFilter(level)}>
                {level === "All" ? "All" : `${level} ${counts[level.toLowerCase()] ?? 0}`}
              </button>
            ))}
          </div>
          {loading ? <div className="empty-state">Loading incident feed…</div> : (
            <div className="queue-list">
              {visibleIncidents.map((incident) => {
                const CategoryIcon = iconByCategory[incident.category] ?? Siren;
                return (
                  <button key={incident.id} className={`incident-card ${selected?.id === incident.id ? "incident-card-selected" : ""}`} onClick={() => { setSelectedId(incident.id); setMobileQueueOpen(false); }}>
                    <span className={`incident-score score-${incident.severity.toLowerCase()}`}>{incident.score}</span>
                    <span className="incident-card-content">
                      <span className="incident-tags"><span className={`severity-text text-${incident.severity.toLowerCase()}`}>{incident.severity}</span><span className="tag-divider">·</span><span>{incident.id}</span><CategoryIcon size={12} /></span>
                      <strong>{incident.title}</strong>
                      <span className="incident-meta">{incident.reportCount} reports merged <span>·</span> first report {formatAge(incident.createdAt)}</span>
                    </span>
                  </button>
                );
              })}
              {visibleIncidents.length === 0 && <div className="empty-state">No {filter.toLowerCase()} incidents in the queue.</div>}
            </div>
          )}
          <div className="queue-footer"><Activity size={14} /> Monitoring {activeIncidents.length} active incidents</div>
        </aside>

        <section className="map-column">
          <div className="panel map-panel">
            <div className="panel-heading map-heading">
              <div><h2>Situation map</h2><span className="map-subtitle"><LocateFixed size={12} /> Riverside district, Sector 4</span></div>
              <div className="map-legend">
                {["Critical", "High", "Medium", "Low", "Rescue base"].map((level) => (
                  <span key={level}><i className={level === "Rescue base" ? "legend-base" : `legend-${level.toLowerCase()}`} />{level}</span>
                ))}
              </div>
            </div>
            <div className="map-canvas" aria-label="Map showing incident locations and rescue routes">
              <div className="map-block block-a" /><div className="map-block block-b" /><div className="map-block block-c" />
              <div className="map-block block-d" /><div className="map-block block-e" /><div className="map-block block-f" />
              <div className="map-block block-g" /><div className="map-block block-h" /><div className="map-block block-i" />
              <svg className="map-roads" viewBox="0 0 1000 480" preserveAspectRatio="none" aria-hidden="true">
                <path className="road-wide" d="M-20 250 C130 210 170 280 280 245 S470 210 565 248 S760 210 840 223 S940 200 1020 214" />
                <path className="road-edge" d="M-20 250 C130 210 170 280 280 245 S470 210 565 248 S760 210 840 223 S940 200 1020 214" />
                {routePath && <path className="route-line" d={routePath} />}
                <path className="minor-road" d="M0 126 H1000 M0 354 H1000 M130 0 V480 M410 0 V480 M700 0 V480 M880 0 V480" />
              </svg>
              <div className="river-label">RIVERSIDE CANAL</div>
              <div className="map-label label-clinic"><Cross size={13} /> St. Riverside</div>
              <div className="map-label label-fire"><Flame size={13} /> Fire station</div>
              <div className="map-label label-base"><MapPin size={13} /> R1 Rescue base</div>
              <div className="route-caption"><span /> ROUTE · {selected?.category.toUpperCase() ?? "INCIDENT"}</div>
              {mapPins.map((incident) => (
                <button key={incident.id} className={`map-pin pin-${incident.severity.toLowerCase()} ${selected?.id === incident.id ? "map-pin-selected" : ""}`} style={{ left: `${incident.mapPosition?.x ?? incident.position.left}%`, top: `${incident.mapPosition?.y ?? incident.position.top}%` }} onClick={() => setSelectedId(incident.id)} title={`${incident.severity}: ${incident.title}`}>
                  {incident.score}
                </button>
              ))}
              <div className="map-scale"><span /> 500 m</div>
            </div>
          </div>

          <div className="resource-grid">
            {(dashboard?.resourceTypes ?? []).map((resource) => (
              <div className="resource-card panel" key={resource.name}>
                <div className="resource-label"><span>{resource.name}</span><span className="resource-status">{resource.available} free of {resource.total}</span></div>
                <div className="resource-count"><strong>{resource.available}</strong><span>{resource.unit ?? "ready"}</span><ChevronDown size={13} /></div>
                <div className="resource-track"><span style={{ width: `${resource.total ? resource.available / resource.total * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="map-bottom-note"><span className="live-dot" /> Unit positions and incident reports refresh automatically <span>·</span> Updated just now</div>
        </section>

        <aside className="insights-column">
          {selected ? (
            <>
              <section className="panel incident-detail">
                <div className="detail-topline"><span className={`status-badge badge-${selected.severity.toLowerCase()}`}>{selected.severity}</span><span>{selected.id}</span><span className="tag-divider">·</span><span>{selected.category}</span><span className="detail-live"><span className="live-dot" /> LIVE</span></div>
                <h1>{selected.title}</h1>
                <p className="detail-summary">{selected.summary}</p>
                <div className="detail-stats">
                  <div><span>At risk (est.)</span><strong>~{selected.atRisk.toLocaleString()}</strong></div>
                  <div><span>Team ETA</span><strong>{selected.eta}</strong></div>
                  <div><span>AI confidence</span><strong>{selected.confidence}%</strong></div>
                </div>
              </section>

              <section className="panel score-panel">
                <div className="panel-heading compact-heading"><div><h2>Why this score? <span className={`score-inline text-${selected.severity.toLowerCase()}`}>{selected.score}/100</span></h2><span>Each factor shows how many points it adds.</span></div><Sparkles size={14} className="sparkle" /></div>
                <div className="factors">
                  {selected.factors.map((factor) => (
                    <div className="factor-row" key={factor.name}>
                      <div className="factor-label"><strong>{factor.name}</strong><span>+{factor.points}</span></div>
                      <div className="factor-description">{factor.description}</div>
                      <div className="factor-track"><span style={{ width: `${Math.min(100, factor.points * 4)}%` }} /></div>
                    </div>
                  ))}
                </div>
                {analysisRationale && <p className="analysis-rationale">{analysisRationale}</p>}
                <div className="analysis-footer"><Sparkles size={12} /> {dashboard?.services?.llm === "configured" ? "AI-assisted analysis" : "Local AI demo analysis"} <button onClick={explainSelected} disabled={analysisBusy}>{analysisBusy ? "Explaining…" : "Explain"}</button></div>
              </section>

              <section className="panel duplicates-panel">
                <div className="panel-heading compact-heading"><div><h2>Duplicate detection</h2><span>{selected.reportCount} reports matched on location, time and wording.</span></div><span className="duplicate-count">{duplicates.length ? `${duplicates.length}%` : "—"}</span></div>
                <div className="duplicate-list">
                  {duplicates.length > 0 ? duplicates.map((report) => (
                    <div className="duplicate-item" key={report.id}>
                      <span className="match-percent">{report.match}%</span>
                      <span><strong>{report.text}</strong><small>{report.source} · {report.age}</small></span>
                    </div>
                  )) : <div className="no-duplicates">No other active reports match this incident yet.</div>}
                </div>
              </section>

              <section className="panel response-panel">
                <div className="response-title"><h2>Recommended response</h2><span className="recommendation-tag"><Sparkles size={11} /> AI PLAN</span></div>
                <div className="response-units">
                  {selected.response.units.map((unit) => <div key={unit.name}><span>{unit.name}</span><strong>{unit.code}</strong></div>)}
                </div>
                <div className="route-heading"><span>Route <i>(shown dashed on map)</i></span><span className="route-links"><button onClick={checkRoute} disabled={routeBusy}>{routeBusy ? "Checking…" : "Check route"}</button><a href={selected.response.mapsUrl} target="_blank" rel="noreferrer">Open map <ExternalLink size={11} /></a></span></div>
                {routeInfo && <div className="route-service-note">{routeInfo.provider === "google-routes" ? `Maps API · ${(routeInfo.distanceMeters / 1000).toFixed(1)} km · ${routeInfo.duration}` : "Sample route · add a Maps API key for live directions."}</div>}
                <ol className="route-steps">
                  {selected.response.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                {selected.response.alternate && <div className="alternate-route"><ArrowUpRight size={12} /> Alternate: {selected.response.alternate}</div>}
                {selected.status === "Dispatched" ? (
                  <div className="dispatched-state"><Check size={15} /> Units dispatched · {selected.response.dispatchedAt ? new Date(selected.response.dispatchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "En route"}</div>
                ) : (
                  <div className="response-actions">
                    <button className="approve-button" onClick={() => runAction(`/api/incidents/${selected.id}/dispatch`, {}, "Response plan approved — units dispatched.")} disabled={busy}><Check size={15} />Approve &amp; dispatch</button>
                    <button className="override-button" onClick={() => { setOverrideRoute(selected.response.steps.join("\n")); setOverrideOpen(true); }} disabled={busy}>Override plan</button>
                  </div>
                )}
                <div className="response-foot"><Clock3 size={12} /> Demo only · does not contact responders</div>
              </section>
            </>
          ) : <div className="panel empty-selection"><Siren size={22} /><strong>No active incident selected</strong><span>Select an item from the priority queue.</span></div>}
        </aside>
      </section>

      <footer className="app-footer"><span><span className="live-dot" /> RESQ RESPONSE DASHBOARD</span><span>Demo only — verify reports and routes before operational use</span><span>{new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} <span className="footer-divider">·</span> {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></footer>

      {overrideOpen && selected && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOverrideOpen(false); }}>
          <section className="override-modal" role="dialog" aria-modal="true" aria-labelledby="override-title">
            <div className="modal-heading"><span><span className="modal-icon"><ArrowDownRight size={17} /></span><span><h2 id="override-title">Override response plan</h2><small>{selected.id} · {selected.title}</small></span></span><button onClick={() => setOverrideOpen(false)} aria-label="Close dialog"><X size={18} /></button></div>
            <label htmlFor="override-route">Dispatch route instructions</label>
            <textarea id="override-route" value={overrideRoute} onChange={(event) => setOverrideRoute(event.target.value)} rows={5} maxLength={800} />
            <div className="modal-help">Your custom plan will be saved for this incident. Dispatch remains a separate action.</div>
            <div className="modal-actions"><button className="override-button" onClick={() => setOverrideOpen(false)}>Cancel</button><button className="approve-button" onClick={() => runAction(`/api/incidents/${selected.id}/override`, { steps: overrideRoute.split("\n").map((line) => line.trim()).filter(Boolean) }, "Custom response plan saved.")} disabled={busy || !overrideRoute.trim()}><Check size={14} />Save response plan</button></div>
          </section>
        </div>
      )}
      {loading && <div className="screen-reader-status" role="status">Loading live incident data.</div>}
    </main>
  );
}

export default App;
