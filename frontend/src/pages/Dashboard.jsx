import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, RefreshCw, ShieldAlert, ShieldCheck, Siren, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { SeverityBadge, StatusBadge } from "../components/StatusBadge";
import LoadingState, { EmptyState, ErrorState } from "../components/LoadingState";

function StatCard({ label, value, note, icon: Icon, tone, trend }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={18} /></span></div><div className="stat-value">{value}</div><div className="stat-foot">{trend && <span className={`trend ${trend === "up" ? "trend-up" : "trend-neutral"}`}>{trend === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}</span>}<span>{note}</span></div></div>;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async (refresh = false) => {
    setError("");
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [incidentRes, userRes] = await Promise.allSettled([
        api.get("/incidents"),
        api.get("/auth/me")
      ]);
      if (incidentRes.status === "rejected") throw incidentRes.reason;
      const payload = incidentRes.value.data;
      setIncidents(Array.isArray(payload) ? payload : payload.incidents || []);
      if (userRes.status === "fulfilled") setUser(userRes.value.data.user || userRes.value.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not connect to the TraceX API.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => ({
    total: incidents.length,
    open: incidents.filter(i => i.status === "OPEN").length,
    investigating: incidents.filter(i => i.status === "INVESTIGATING").length,
    critical: incidents.filter(i => ["HIGH", "CRITICAL"].includes(i.severity)).length
  }), [incidents]);

  const recent = incidents.slice(0, 6);
  const severityCounts = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(level => ({ level, count: incidents.filter(i => i.severity === level).length }));

  if (loading) return <LoadingState label="Loading your security workspace..." />;

  return <div className="page-stack">
    <section className="page-heading">
      <div><div className="eyebrow"><span className="pulse-dot" /> SECURITY OVERVIEW</div><h1>Good to see you{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1><p>Here's what's happening across your security environment.</p></div>
      <button className="button button-secondary" onClick={() => loadData(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing" : "Refresh data"}</button>
    </section>

    {error && <ErrorState message={error} onRetry={() => loadData()} />}

    <section className="stats-grid">
      <StatCard label="Total incidents" value={stats.total} note="Recorded in TraceX" icon={ShieldAlert} tone="icon-blue" />
      <StatCard label="Open incidents" value={stats.open} note="Awaiting investigation" icon={Siren} tone="icon-red" />
      <StatCard label="Under investigation" value={stats.investigating} note="Analyst attention" icon={Activity} tone="icon-amber" />
      <StatCard label="High priority" value={stats.critical} note="High + critical severity" icon={Zap} tone="icon-purple" />
    </section>

    <section className="dashboard-grid">
      <div className="panel recent-panel">
        <div className="panel-header"><div><h2>Recent incidents</h2><p>Latest alerts detected by the system</p></div><button className="text-action" onClick={() => navigate("/incidents")}>View all <ArrowRight size={14} /></button></div>
        {incidents.length === 0 ? <EmptyState title="No incidents yet" message="Once suspicious activity is detected, incidents will appear here." /> : <div className="table-wrap"><table><thead><tr><th>Incident</th><th>Severity</th><th>Status</th><th>Detected</th><th /></tr></thead><tbody>{recent.map(incident => <tr key={incident._id} className="clickable-row" onClick={() => navigate(`/incidents/${incident._id}`)}><td><div className="incident-cell"><span className="incident-type-icon"><ShieldAlert size={15} /></span><div><strong>{incident.type}</strong><small>{incident.sourceIP}</small></div></div></td><td><SeverityBadge severity={incident.severity} /></td><td><StatusBadge status={incident.status} /></td><td className="muted-cell">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "—"}</td><td><ArrowRight size={15} className="row-arrow" /></td></tr>)}</tbody></table></div>}
        <div className="panel-footer"><span>Showing {Math.min(recent.length, 6)} of {incidents.length} incidents</span><button className="text-action" onClick={() => navigate("/incidents")}>Open incident queue <ArrowRight size={13} /></button></div>
      </div>

      <div className="right-stack">
        <div className="panel severity-panel">
          <div className="panel-header"><div><h2>Severity breakdown</h2><p>Incident distribution</p></div><span className="subtle-icon"><Activity size={16} /></span></div>
          <div className="severity-list">{severityCounts.map(item => <div className="severity-row" key={item.level}><div className="severity-row-label"><span className={`severity-dot dot-${item.level.toLowerCase()}`} />{item.level}<strong>{item.count}</strong></div><div className="meter"><span className={`meter-${item.level.toLowerCase()}`} style={{ width: `${incidents.length ? item.count / incidents.length * 100 : 0}%` }} /></div></div>)}</div>
        </div>
        <div className="panel health-panel"><div className="health-icon"><ShieldCheck size={20} /></div><div><h3>Collection status</h3><p>API events are logged by the backend middleware.</p><div className="health-status"><span className="pulse-dot" /> Backend-connected view</div></div></div>
        <div className="tip-card"><div className="tip-top"><Clock3 size={16} /><span>ANALYST WORKFLOW</span></div><h3>Follow the evidence.</h3><p>Open an incident to inspect its event timeline and relationship graph.</p><button onClick={() => navigate("/incidents")}>Start investigating <ArrowRight size={14} /></button></div>
      </div>
    </section>
  </div>;
}
