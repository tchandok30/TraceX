import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { ArrowLeft, Check, Clock3, Copy, ExternalLink, RefreshCw, ShieldAlert, X } from "lucide-react";
import api from "../services/api";
import { SeverityBadge, StatusBadge } from "../components/StatusBadge";
import LoadingState, { EmptyState, ErrorState } from "../components/LoadingState";

const nodeColors = {
  INCIDENT: { bg: "#3b1720", border: "#f05268" },
  IP: { bg: "#142b4a", border: "#4f9cf9" },
  EVENT: { bg: "#3c2b15", border: "#f3b64d" },
  API: { bg: "#24204b", border: "#8b83ff" },
  USER: { bg: "#123b37", border: "#34d399" },
  SESSION: { bg: "#3b2148", border: "#d78aff" },
  RESOURCE: { bg: "#3c2c1c", border: "#fb923c" }
};

export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [rawNodes, setRawNodes] = useState([]);
  const [rawEdges, setRawEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [incidentRes, timelineRes, graphRes] = await Promise.all([
        api.get(`/incidents/${id}`),
        api.get(`/incidents/${id}/timeline`),
        api.get(`/incidents/${id}/graph`)
      ]);
      const incidentData = incidentRes.data.incident || incidentRes.data;
      const timelineData = Array.isArray(timelineRes.data) ? timelineRes.data : (timelineRes.data.timeline || []);
      const graphData = graphRes.data.graph || graphRes.data;
      setIncident(incidentData);
      setStatus(incidentData.status || "OPEN");
      setTimeline(timelineData);
      setRawNodes(graphData.nodes || []);
      setRawEdges(graphData.edges || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load this incident.");
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const graphNodes = useMemo(() => {
    const grouped = {};
    rawNodes.forEach(node => {
      grouped[node.type] = grouped[node.type] || [];
      grouped[node.type].push(node);
    });
    const xPositions = { INCIDENT: 40, IP: 280, EVENT: 550, API: 850, USER: 280, SESSION: 550, RESOURCE: 850 };
    const output = [];
    Object.entries(grouped).forEach(([type, nodes]) => nodes.forEach((node, index) => {
      const column = xPositions[type] ?? 500;
      const row = index;
      const color = nodeColors[type] || nodeColors.API;
      output.push({
        id: node.id,
        position: { x: column, y: 50 + row * 125 },
        data: { label: <div className="graph-node-content"><span>{type}</span><strong>{node.label}</strong></div>, details: node.details || { title: node.label, type, id: node.id } },
        style: { background: color.bg, border: `1px solid ${color.border}`, color: "#eef4ff", borderRadius: 10, minWidth: 145, maxWidth: 235, padding: 5, boxShadow: "0 8px 25px #0003" }
      });
    }));
    return output;
  }, [rawNodes]);

  const graphEdges = useMemo(() => rawEdges.map((edge, index) => ({
    id: `edge-${index}-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    label: edge.relationship,
    animated: true,
    style: { stroke: "#52657f", strokeWidth: 1.4 },
    labelStyle: { fill: "#a9b9ce", fontSize: 10 },
    labelBgStyle: { fill: "#0b1220", fillOpacity: 0.9 }
  })), [rawEdges]);

  async function updateStatus() {
    if (!status || status === incident.status) return;
    setUpdating(true); setError("");
    try {
      const { data } = await api.patch(`/incidents/${id}/status`, { status });
      const updatedIncident = data?.incident || (data?._id ? data : null);
      setIncident(updatedIncident || { ...incident, status });
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status. Check your incidentRoutes endpoint.");
      setStatus(incident.status);
    } finally { setUpdating(false); }
  }

  async function copyIncidentId() {
    try { await navigator.clipboard.writeText(incident._id); } catch { /* clipboard may be blocked in insecure contexts */ }
  }

  if (loading) return <LoadingState label="Building investigation workspace..." />;
  if (error && !incident) return <ErrorState message={error} onRetry={load} />;
  if (!incident) return <EmptyState title="Incident not found" message="This incident may have been removed." />;

  return <div className="page-stack">
    <button className="back-link" onClick={() => navigate("/incidents")}><ArrowLeft size={15} /> Back to incidents</button>
    <section className="incident-detail-heading"><div><div className="eyebrow">INVESTIGATION WORKSPACE</div><h1>{incident.type}</h1><div className="incident-id-line"><span>INCIDENT ID</span><code>{incident._id}</code><button className="tiny-icon-button" onClick={copyIncidentId} title="Copy incident ID"><Copy size={13} /></button></div></div><div className="detail-badges"><SeverityBadge severity={incident.severity} /><StatusBadge status={incident.status} /></div></section>
    {error && <div className="inline-error"><X size={15} />{error}</div>}
    <section className="detail-stat-grid"><div className="detail-stat"><span>Source IP</span><strong className="mono-cell">{incident.sourceIP || "—"}</strong><small>Primary source observed</small></div><div className="detail-stat"><span>Linked events</span><strong>{timeline.length}</strong><small>Associated with this incident</small></div><div className="detail-stat"><span>Detected at</span><strong>{incident.createdAt ? new Date(incident.createdAt).toLocaleDateString() : "—"}</strong><small>{incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString() : ""}</small></div><div className="detail-stat"><span>Current status</span><strong><StatusBadge status={incident.status} /></strong><small>Update status below</small></div></section>

    <section className="panel status-action-panel"><div><h2>Investigation status</h2><p>Update the current incident workflow state.</p></div><div className="status-controls"><select value={status} onChange={e => setStatus(e.target.value)}><option>OPEN</option><option>INVESTIGATING</option><option>RESOLVED</option></select><button className="button button-primary button-small" disabled={updating || status === incident.status} onClick={updateStatus}>{updating ? "Saving..." : <><Check size={14} /> Save status</>}</button></div></section>

    <section className="panel description-panel"><div className="section-icon"><ShieldAlert size={17} /></div><div><h2>Incident context</h2><p>{incident.description || "No description has been recorded for this incident."}</p></div></section>

    <section className="panel">
      <div className="panel-header"><div><h2><Clock3 size={17} /> Activity timeline</h2><p>Chronological events linked to this incident</p></div><span className="count-pill">{timeline.length} events</span></div>
      {timeline.length === 0 ? <EmptyState title="No linked events" message="The incident has no events linked through incidentId yet." /> : <div className="timeline-list">{timeline.map((event, index) => <div className="timeline-item" key={event._id}><div className="timeline-track"><span className={`timeline-marker ${event.statusCode >= 400 ? "marker-error" : ""}`} />{index < timeline.length - 1 && <span className="timeline-line" />}</div><div className="timeline-event"><div className="timeline-event-head"><div className="event-title"><span className="method-pill">{event.method}</span><code>{event.endpoint}</code></div><span className={`http-pill ${event.statusCode >= 400 ? "http-error" : "http-ok"}`}>{event.statusCode}</span></div><div className="event-meta"><span>{event.ip}</span><span><Clock3 size={12} />{new Date(event.timestamp).toLocaleString()}</span></div>{event.sessionId && <div className="event-extra">Session: {event.sessionId}</div>}</div></div>)}</div>}
    </section>

    <section className="panel graph-panel">
      <div className="panel-header"><div><h2><ActivityIcon /> Investigation graph</h2><p>Explore the relationships between incident entities and API activity.</p></div><button className="button button-secondary button-small" onClick={() => { setSelectedNode(null); load(); }}><RefreshCw size={14} /> Refresh graph</button></div>
      <div className="graph-legend">{Object.entries(nodeColors).filter(([type]) => rawNodes.some(n => n.type === type)).map(([type, color]) => <span key={type}><i style={{ background: color.border }} />{type}</span>)}</div>
      <div className="graph-canvas">
        {graphNodes.length === 0 ? <EmptyState title="Graph has no nodes" message="No linked event data is available to visualize." /> : <ReactFlow nodes={graphNodes} edges={graphEdges} fitView minZoom={0.2} maxZoom={1.6} onNodeClick={(_, node) => setSelectedNode(node.data.details)} onPaneClick={() => setSelectedNode(null)}><Background color="#202b3c" gap={22} /><Controls /><MiniMap nodeColor={node => (nodeColors[rawNodes.find(n => n.id === node.id)?.type] || nodeColors.API).border} maskColor="#080d1880" /></ReactFlow>}
      </div>
      {selectedNode && <div className="node-inspector"><div className="panel-header"><div><div className="eyebrow">SELECTED ENTITY</div><h2>{selectedNode.title || "Node details"}</h2></div><button className="tiny-icon-button" onClick={() => setSelectedNode(null)}><X size={16} /></button></div><pre>{JSON.stringify(selectedNode, null, 2)}</pre></div>}
    </section>
  </div>;
}

function ActivityIcon() {
  return <span className="inline-heading-icon">⌘</span>;
}
