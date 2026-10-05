import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Clock3, RefreshCw, Search, ShieldAlert, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingState, { EmptyState, ErrorState } from "../components/LoadingState";

function getList(payload, key) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.[key]) ? payload[key] : [];
}

export default function EventExplorer() {
  const [events, setEvents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [partialError, setPartialError] = useState(false);
  const [query, setQuery] = useState("");
  const [statusCode, setStatusCode] = useState("ALL");
  const navigate = useNavigate();

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    setPartialError(false);
    try {
      // Use the backend's existing incident and timeline endpoints; no new API route is assumed.
      const response = await api.get("/incidents");
      const list = getList(response.data, "incidents");
      setIncidents(list);
      const timelineResults = await Promise.allSettled(
        list.map(incident => api.get(`/incidents/${incident._id}/timeline`))
      );
      const unique = new Map();
      let failedTimelines = 0;
      timelineResults.forEach(result => {
        if (result.status !== "fulfilled") {
          failedTimelines += 1;
          return;
        }
        getList(result.value.data, "timeline").forEach(event => {
          if (event?._id) unique.set(event._id, event);
        });
      });
      setEvents(Array.from(unique.values()).sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0)));
      setPartialError(failedTimelines > 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load event activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => events.filter(event => {
    const term = query.trim().toLowerCase();
    const matches = !term || [event.ip, event.endpoint, event.method, event.type, event._id, event.statusCode].some(value => String(value ?? "").toLowerCase().includes(term));
    const code = Number(event.statusCode || 0);
    const responseMatches = statusCode === "ALL" || (statusCode === "ERROR" ? code >= 400 : code >= 200 && code < 400);
    return matches && responseMatches;
  }), [events, query, statusCode]);

  const incidentById = useMemo(() => new Map(incidents.map(item => [String(item._id), item])), [incidents]);

  if (loading) return <LoadingState label="Collecting incident-linked events..." />;
  if (error && events.length === 0) return <ErrorState message={error} onRetry={() => load()} />;

  return <div className="page-stack">
    <section className="page-heading">
      <div><div className="eyebrow">TELEMETRY</div><h1>Event explorer</h1><p>Inspect request activity captured in incident timelines.</p></div>
      <button className="button button-secondary" onClick={() => load(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "spin" : ""} />{refreshing ? "Refreshing..." : "Refresh events"}</button>
    </section>
    {error && <div className="inline-error"><AlertCircle size={16} />{error}</div>}
    {partialError && <div className="inline-warning"><AlertCircle size={16} />Some incident timelines could not be loaded. The events below may be incomplete.</div>}
    <section className="stats-strip"><div><span>Events in view</span><strong>{events.length}</strong></div><div><span>HTTP errors</span><strong className="text-red">{events.filter(event => Number(event.statusCode) >= 400).length}</strong></div><div><span>Source IPs</span><strong>{new Set(events.map(event => event.ip).filter(Boolean)).size}</strong></div><div><span>Incidents linked</span><strong>{incidents.length}</strong></div></section>
    <section className="panel">
      <div className="panel-header"><div><h2><Activity size={17} /> Event stream</h2><p>Events are deduplicated by event ID across incident timelines.</p></div><span className="count-pill">{filtered.length} RESULTS</span></div>
      <div className="filter-bar"><div className="search-box"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search IP, endpoint, method, status..." />{query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}</div><label className="select-wrap"><select value={statusCode} onChange={event => setStatusCode(event.target.value)}><option value="ALL">All responses</option><option value="ERROR">HTTP errors (4xx/5xx)</option><option value="SUCCESS">Successful (2xx/3xx)</option></select></label></div>
      {filtered.length === 0 ? <EmptyState title="No events in this view" message={events.length ? "Try a different search or response filter." : "Events will appear after the backend detects and links activity to an incident."} /> : <div className="event-list">{filtered.map(event => {
        const incidentId = event.incidentId && typeof event.incidentId === "object" ? event.incidentId._id : event.incidentId;
        const linkedIncident = incidentId ? incidentById.get(String(incidentId)) : null;
        const failed = Number(event.statusCode) >= 400;
        return <div className="event-row" key={event._id}>
          <div className={`event-status-icon ${failed ? "failed" : "passed"}`}>{failed ? <ShieldAlert size={16} /> : <Activity size={16} />}</div>
          <div className="event-main"><div className="event-title"><span className="method-pill">{event.method || "—"}</span><code>{event.endpoint || "Unknown endpoint"}</code></div><div className="event-meta"><span>{event.ip || "Unknown IP"}</span><span><Clock3 size={12} />{new Date(event.timestamp || event.createdAt || Date.now()).toLocaleString()}</span><span>{event.type || "API_REQUEST"}</span>{linkedIncident && <button className="event-incident-link" onClick={() => navigate(`/incidents/${linkedIncident._id}`)}>{linkedIncident.type}<ArrowUpRight size={12} /></button>}</div></div>
          <span className={`http-pill ${failed ? "http-error" : "http-ok"}`}>{event.statusCode ?? "—"}</span>
        </div>;
      })}</div>}
      <div className="panel-footer"><span>{filtered.length} event{filtered.length !== 1 ? "s" : ""} shown</span><span>Latest event first</span></div>
    </section>
  </div>;
}
