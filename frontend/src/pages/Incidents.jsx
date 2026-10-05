import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ArrowRight, Filter, RefreshCw, Search, ShieldAlert, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { SeverityBadge, StatusBadge } from "../components/StatusBadge";
import LoadingState, { EmptyState, ErrorState } from "../components/LoadingState";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/incidents");
      setIncidents(Array.isArray(data) ? data : data.incidents || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load incidents.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => incidents.filter(item => {
    const term = query.toLowerCase();
    const matchesQuery = !term || [item.type, item.sourceIP, item._id, item.description].some(v => String(v || "").toLowerCase().includes(term));
    return matchesQuery && (severity === "ALL" || item.severity === severity) && (status === "ALL" || item.status === status);
  }).sort((a, b) => sortOrder === "newest" ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0) : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)), [incidents, query, severity, status, sortOrder]);

  const clearFilters = () => { setQuery(""); setSeverity("ALL"); setStatus("ALL"); };

  if (loading) return <LoadingState label="Loading incident queue..." />;

  return <div className="page-stack">
    <section className="page-heading"><div><div className="eyebrow">THREAT MANAGEMENT</div><h1>Incident queue</h1><p>Search, triage and open investigations from one place.</p></div><button className="button button-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button></section>
    {error && <ErrorState message={error} onRetry={load} />}
    <section className="stats-strip"><div><span>All incidents</span><strong>{incidents.length}</strong></div><div><span>Open</span><strong className="text-red">{incidents.filter(i => i.status === "OPEN").length}</strong></div><div><span>Investigating</span><strong className="text-amber">{incidents.filter(i => i.status === "INVESTIGATING").length}</strong></div><div><span>Resolved</span><strong className="text-green">{incidents.filter(i => i.status === "RESOLVED").length}</strong></div></section>
    <section className="panel incident-list-panel">
      <div className="panel-header incident-list-heading"><div><h2><ShieldAlert size={17} /> All incidents <span className="count-pill">{filtered.length}</span></h2><p>Results reflect the filters below.</p></div><button className="button button-secondary button-small" onClick={() => setSortOrder(v => v === "newest" ? "oldest" : "newest")}><ArrowDownUp size={14} /> {sortOrder === "newest" ? "Newest first" : "Oldest first"}</button></div>
      <div className="filter-bar">
        <div className="search-box"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search type, IP, description or ID..." />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</div>
        <label className="select-wrap"><Filter size={14} /><select value={severity} onChange={e => setSeverity(e.target.value)}><option value="ALL">All severities</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label>
        <label className="select-wrap"><SlidersHorizontal size={14} /><select value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">All statuses</option><option>OPEN</option><option>INVESTIGATING</option><option>RESOLVED</option></select></label>
        {(query || severity !== "ALL" || status !== "ALL") && <button className="clear-filters" onClick={clearFilters}>Clear filters</button>}
      </div>
      {filtered.length === 0 ? <EmptyState title={incidents.length ? "No matching incidents" : "No incidents detected"} message={incidents.length ? "Try changing the search or filters." : "Detected incidents will appear here automatically."} /> : <div className="table-wrap"><table className="incidents-table"><thead><tr><th>Incident</th><th>Source IP</th><th>Severity</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>{filtered.map(item => <tr key={item._id} className="clickable-row" onClick={() => navigate(`/incidents/${item._id}`)}><td><div className="incident-cell"><span className="incident-type-icon"><ShieldAlert size={15} /></span><div><strong>{item.type}</strong><small className="id-short">{item._id}</small></div></div></td><td className="mono-cell">{item.sourceIP || "—"}</td><td><SeverityBadge severity={item.severity} /></td><td><StatusBadge status={item.status} /></td><td className="muted-cell">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</td><td><ArrowRight size={15} className="row-arrow" /></td></tr>)}</tbody></table></div>}
      <div className="panel-footer"><span>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span><span>Click an incident to investigate <ArrowRight size={12} /></span></div>
    </section>
  </div>;
}
