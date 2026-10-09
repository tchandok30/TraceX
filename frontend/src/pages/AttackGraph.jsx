
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Network,
  RefreshCw,
  ShieldAlert,
  GitBranch,
  X,
  Search,
  ChevronRight,
} from "lucide-react";

import api from "../services/api";
import LoadingState, {
  EmptyState,
  ErrorState,
} from "../components/LoadingState";

const COLORS = {
  INCIDENT: "#fb7185",
  IP: "#fbbf24",
  EVENT: "#60a5fa",
  API: "#a78bfa",
  USER: "#34d399",
  SESSION: "#22d3ee",
  RESOURCE: "#fb923c",
};

const COLUMN_INFO = [
  { type: "IP", title: "SOURCE", subtitle: "Origin of activity" },
  { type: "INCIDENT", title: "INCIDENT", subtitle: "Detected threat" },
  { type: "EVENT", title: "EVENTS", subtitle: "Recorded requests" },
  { type: "API", title: "ENTITIES", subtitle: "Related endpoints & identities" },
];

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
    color: "#e2e8f0",
  },
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  eyebrow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: "#60a5fa",
    marginBottom: 10,
  },
  h1: {
    fontSize: "clamp(26px, 4vw, 34px)",
    fontWeight: 800,
    letterSpacing: -1,
    margin: "0 0 8px",
    color: "#f8fafc",
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.7,
    color: "#94a3b8",
    maxWidth: 650,
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "11px 15px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "#172235",
    color: "#e2e8f0",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  panel: {
    border: "1px solid #263449",
    borderRadius: 16,
    background: "linear-gradient(145deg, #111c2d, #0c1422)",
    overflow: "hidden",
    minWidth: 0,
  },
  panelHeader: {
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    borderBottom: "1px solid #263449",
  },
  panelTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 750,
    color: "#f1f5f9",
  },
  panelSubtitle: {
    margin: "6px 0 0",
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  pill: {
    padding: "6px 9px",
    borderRadius: 7,
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.7,
    whiteSpace: "nowrap",
  },
  select: {
    width: "100%",
    maxWidth: 650,
    minWidth: 0,
    padding: "12px 14px",
    background: "#0b1320",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#e2e8f0",
    fontSize: 13,
    outline: "none",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: 12,
  },
  stat: {
    padding: "17px 18px",
    borderRadius: 13,
    background: "#111c2d",
    border: "1px solid #263449",
  },
  statLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 650,
  },
  statValue: {
    marginTop: 12,
    fontSize: 29,
    fontWeight: 800,
    color: "#f8fafc",
  },
  statHint: {
    marginTop: 5,
    color: "#64748b",
    fontSize: 11,
  },
  canvas: {
    padding: 18,
    overflowX: "auto",
    backgroundColor: "#0a111e",
    backgroundImage:
      "radial-gradient(circle at 1px 1px, #263449 1px, transparent 0)",
    backgroundSize: "22px 22px",
  },
  legend: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    padding: "14px 20px",
    borderBottom: "1px solid #263449",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 10,
    color: "#a7b5c9",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  nodeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 10,
    padding: 18,
  },
  nodeCard: {
    textAlign: "left",
    padding: 13,
    background: "#101b2b",
    border: "1px solid #2b3a50",
    borderRadius: 11,
    color: "#e2e8f0",
    cursor: "pointer",
    minWidth: 0,
  },
  detail: {
    padding: 20,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 7,
  },
  detailValue: {
    fontSize: 13,
    color: "#e2e8f0",
    overflowWrap: "anywhere",
  },
  relationshipRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
    alignItems: "center",
    gap: 12,
    padding: "13px 18px",
    borderBottom: "1px solid #202e41",
  },
};

function getList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function shortText(value, max = 27) {
  const text = String(value ?? "Unknown");
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function getNodeColumn(type) {
  if (type === "IP") return 0;
  if (type === "INCIDENT") return 1;
  if (type === "EVENT") return 2;
  return 3;
}

function makeLayout(nodes, width = 1120) {
  const columnX = [100, 365, 630, 955];
  const top = 100;
  const gap = 100;

  const grouped = [[], [], [], []];

  nodes.forEach((node) => {
    grouped[getNodeColumn(node.type)].push(node);
  });

  const maxCount = Math.max(1, ...grouped.map((group) => group.length));
  const height = Math.max(460, top + maxCount * gap + 35);
  const positions = {};

  grouped.forEach((group, column) => {
    group.forEach((node, index) => {
      positions[node.id] = {
        x: columnX[column],
        y: top + index * gap,
      };
    });
  });

  return { positions, height, width };
}

export default function AttackGraph() {
  const [incidents, setIncidents] = useState([]);
  const [graph, setGraph] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await api.get("/incidents");
      const list = getList(response.data, "incidents");

      setIncidents(list);

      if (!list.length) {
        setGraph(null);
        setSelectedIncidentId("");
        setSelectedNode(null);
        return;
      }

      const chosen = list.some(
        (incident) => String(incident._id) === String(selectedIncidentId)
      )
        ? selectedIncidentId
        : list[0]._id;

      setSelectedIncidentId(chosen);

      const graphResponse = await api.get(
        `/incidents/${chosen}/graph`
      );

      setGraph(graphResponse.data);
      setSelectedNode(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load attack graph."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedIncidentId]);

  const chooseIncident = useCallback(async (incidentId) => {
    setSelectedIncidentId(incidentId);
    setSelectedNode(null);
    setError("");
    setLoading(true);

    try {
      const response = await api.get(
        `/incidents/${incidentId}/graph`
      );
      setGraph(response.data);
    } catch (err) {
      setGraph(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load the selected incident graph."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nodes = useMemo(() => graph?.nodes || [], [graph]);
  const edges = useMemo(() => graph?.edges || [], [graph]);

  const filteredNodes = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return nodes;

    return nodes.filter((node) =>
      [
        node.label,
        node.type,
        node.id,
        node.details?.ip,
        node.details?.endpoint,
        node.details?.userId,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [nodes, query]);

  const layout = useMemo(
    () => makeLayout(filteredNodes),
    [filteredNodes]
  );

  const visibleIds = useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes]
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          visibleIds.has(edge.source) &&
          visibleIds.has(edge.target)
      ),
    [edges, visibleIds]
  );

  const incident = incidents.find(
    (item) => String(item._id) === String(selectedIncidentId)
  );

  if (loading && !graph) {
    return <LoadingState label="Building attack graph..." />;
  }

  if (error && !graph) {
    return (
      <ErrorState
        message={error}
        onRetry={() => loadData()}
      />
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.heading}>
        <div>
          <div style={styles.eyebrow}>
            <Network size={14} />
            TRACE X / RELATIONSHIP ANALYSIS
          </div>
          <h1 style={styles.h1}>Attack Graph</h1>
          <p style={styles.subtitle}>
            Trace incident-linked activity across source IPs, requests,
            endpoints and associated entities.
          </p>
        </div>

        <button
          style={{
            ...styles.button,
            opacity: refreshing ? 0.65 : 1,
          }}
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw size={15} />
          {refreshing ? "Refreshing..." : "Refresh graph"}
        </button>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding: 13,
            borderRadius: 10,
            background: "#451a1a",
            border: "1px solid #7f1d1d",
            color: "#fecaca",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>Investigation scope</h2>
            <p style={styles.panelSubtitle}>
              Choose an incident to load its backend-generated relationships.
            </p>
          </div>
          <span style={styles.pill}>
            {incidents.length} INCIDENTS
          </span>
        </div>

        <div style={{ padding: 18 }}>
          {incidents.length === 0 ? (
            <EmptyState
              title="No incidents available"
              message="Run the demo or wait for the detection engine to record an incident."
            />
          ) : (
            <select
              value={selectedIncidentId}
              onChange={(event) => chooseIncident(event.target.value)}
              disabled={loading}
              style={styles.select}
            >
              {incidents.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.type || "Incident"} · {item.severity || "Unknown"} ·
                  {" "}{String(item._id).slice(-7)}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {graph && (
        <>
          <section style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statLabel}>
                <Network size={15} /> Graph nodes
              </div>
              <div style={styles.statValue}>{nodes.length}</div>
              <div style={styles.statHint}>Entities in selected graph</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statLabel}>
                <GitBranch size={15} /> Relationships
              </div>
              <div style={styles.statValue}>{edges.length}</div>
              <div style={styles.statHint}>Connections from backend</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statLabel}>
                <Activity size={15} /> Timeline events
              </div>
              <div style={styles.statValue}>
                {graph.eventCount ?? 0}
              </div>
              <div style={styles.statHint}>Events linked to incident</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statLabel}>
                <ShieldAlert size={15} /> Severity
              </div>
              <div
                style={{
                  ...styles.statValue,
                  fontSize: 20,
                  color:
                    incident?.severity === "CRITICAL" ||
                    incident?.severity === "HIGH"
                      ? "#fb7185"
                      : "#fbbf24",
                }}
              >
                {incident?.severity || "UNKNOWN"}
              </div>
              <div style={styles.statHint}>
                {incident?.status || "Status unavailable"}
              </div>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>
                  <Network
                    size={16}
                    style={{ verticalAlign: "middle", marginRight: 8 }}
                  />
                  Relationship map
                </h2>
                <p style={styles.panelSubtitle}>
                  Four-column layout. Select any node to inspect its details.
                </p>
              </div>
              <span style={styles.pill}>
                {filteredNodes.length} VISIBLE NODES
              </span>
            </div>

            <div style={styles.legend}>
              {Object.entries(COLORS).map(([type, color]) => (
                <span key={type} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: color }} />
                  {type}
                </span>
              ))}
            </div>

            <div style={styles.canvas}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
                  gap: 12,
                  minWidth: 820,
                  marginBottom: 12,
                }}
              >
                {COLUMN_INFO.map((column) => (
                  <div
                    key={column.type}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 9,
                      background: "#111c2d",
                      border: "1px solid #263449",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 1.4,
                        color: COLORS[column.type],
                      }}
                    >
                      {column.title}
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        color: "#64748b",
                        fontSize: 10,
                      }}
                    >
                      {column.subtitle}
                    </div>
                  </div>
                ))}
              </div>

              {filteredNodes.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>
                  No nodes match your search.
                </div>
              ) : (
                <div style={{ minWidth: 820 }}>
                  <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    width="100%"
                    style={{ display: "block", overflow: "visible" }}
                    role="img"
                    aria-label="Incident relationship graph"
                  >
                    <defs>
                      <marker
                        id="tracex-graph-arrow"
                        markerWidth="7"
                        markerHeight="7"
                        refX="6"
                        refY="3"
                        orient="auto"
                      >
                        <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
                      </marker>
                    </defs>

                    {visibleEdges.map((edge, index) => {
                      const source = layout.positions[edge.source];
                      const target = layout.positions[edge.target];
                      if (!source || !target) return null;

                      const dx = target.x - source.x;
                      const curve = Math.max(35, Math.abs(dx) * 0.42);
                      const path = `M ${source.x} ${source.y} C ${
                        source.x + curve
                      } ${source.y}, ${target.x - curve} ${
                        target.y
                      }, ${target.x} ${target.y}`;

                      return (
                        <path
                          key={`${edge.source}-${edge.target}-${index}`}
                          d={path}
                          fill="none"
                          stroke="#52637a"
                          strokeWidth="1.5"
                          strokeOpacity="0.8"
                          markerEnd="url(#tracex-graph-arrow)"
                        >
                          <title>{edge.relationship}</title>
                        </path>
                      );
                    })}

                    {filteredNodes.map((node) => {
                      const point = layout.positions[node.id];
                      const color = COLORS[node.type] || "#94a3b8";
                      const active = selectedNode?.id === node.id;
                      const nodeWidth = 178;
                      const nodeHeight = 56;

                      return (
                        <g
                          key={node.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Inspect ${node.type}: ${node.label}`}
                          onClick={() => setSelectedNode(node)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedNode(node);
                            }
                          }}
                          style={{ cursor: "pointer", outline: "none" }}
                        >
                          <rect
                            x={point.x - nodeWidth / 2}
                            y={point.y - nodeHeight / 2}
                            width={nodeWidth}
                            height={nodeHeight}
                            rx="10"
                            fill={active ? "#20334b" : "#111c2d"}
                            stroke={color}
                            strokeWidth={active ? 2.5 : 1.3}
                          />

                          <circle
                            cx={point.x - 74}
                            cy={point.y}
                            r="4"
                            fill={color}
                          />

                          <text
                            x={point.x - 62}
                            y={point.y - 4}
                            fill="#e2e8f0"
                            fontSize="11"
                            fontWeight="650"
                          >
                            {shortText(node.label, 19)}
                          </text>

                          <text
                            x={point.x - 62}
                            y={point.y + 13}
                            fill={color}
                            fontSize="9"
                            letterSpacing="0.5"
                          >
                            {node.type}
                          </text>

                          <title>{node.label}</title>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            <div
              style={{
                padding: "12px 18px",
                borderTop: "1px solid #263449",
                color: "#64748b",
                fontSize: 11,
              }}
            >
              Relationship labels are shown in the list below to keep the map readable.
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Graph entities</h2>
                <p style={styles.panelSubtitle}>
                  Search by type, endpoint, IP or identifier.
                </p>
              </div>
              <span style={styles.pill}>{filteredNodes.length} RESULTS</span>
            </div>

            <div style={{ padding: "14px 18px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "0 12px",
                  border: "1px solid #334155",
                  borderRadius: 9,
                  background: "#0a1321",
                }}
              >
                <Search size={15} color="#64748b" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search entities..."
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    background: "transparent",
                    border: 0,
                    outline: 0,
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {filteredNodes.length === 0 ? (
              <EmptyState
                title="No matching entities"
                message="Try searching for a different IP, endpoint or node type."
              />
            ) : (
              <div style={styles.nodeGrid}>
                {filteredNodes.map((node) => {
                  const color = COLORS[node.type] || "#94a3b8";
                  const active = selectedNode?.id === node.id;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        ...styles.nodeCard,
                        borderColor: active ? color : "#2b3a50",
                        boxShadow: active ? `inset 3px 0 ${color}` : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: 1,
                            color,
                          }}
                        >
                          {node.type}
                        </span>
                        <ChevronRight size={14} color="#64748b" />
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {node.label}
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          color: "#64748b",
                          fontSize: 10,
                        }}
                      >
                        {edges.filter(
                          (edge) =>
                            edge.source === node.id ||
                            edge.target === node.id
                        ).length}{" "}
                        connected relationships
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>
                  <GitBranch
                    size={16}
                    style={{ verticalAlign: "middle", marginRight: 8 }}
                  />
                  Relationships
                </h2>
                <p style={styles.panelSubtitle}>
                  Source → relationship → target
                </p>
              </div>
              <span style={styles.pill}>{visibleEdges.length} EDGES</span>
            </div>

            {visibleEdges.length === 0 ? (
              <EmptyState
                title="No relationships to show"
                message="The current search has no connected edges."
              />
            ) : (
              visibleEdges.map((edge, index) => {
                const source = nodes.find((node) => node.id === edge.source);
                const target = nodes.find((node) => node.id === edge.target);

                return (
                  <div
                    key={`${edge.source}-${edge.target}-${index}`}
                    style={styles.relationshipRow}
                  >
                    <button
                      onClick={() => source && setSelectedNode(source)}
                      style={{
                        minWidth: 0,
                        textAlign: "left",
                        border: 0,
                        background: "transparent",
                        color: "#cbd5e1",
                        cursor: "pointer",
                        overflowWrap: "anywhere",
                        fontSize: 11,
                      }}
                    >
                      {shortText(source?.label || edge.source, 32)}
                    </button>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#60a5fa", fontSize: 10, fontWeight: 800 }}>
                        {edge.relationship}
                      </div>
                      <ChevronRight
                        size={14}
                        color="#64748b"
                        style={{ margin: "4px auto 0" }}
                      />
                    </div>

                    <button
                      onClick={() => target && setSelectedNode(target)}
                      style={{
                        minWidth: 0,
                        textAlign: "left",
                        border: 0,
                        background: "transparent",
                        color: "#cbd5e1",
                        cursor: "pointer",
                        overflowWrap: "anywhere",
                        fontSize: 11,
                      }}
                    >
                      {shortText(target?.label || edge.target, 32)}
                    </button>
                  </div>
                );
              })
            )}
          </section>

          {selectedNode && (
            <section style={styles.panel}>
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>Entity details</h2>
                  <p style={styles.panelSubtitle}>
                    {selectedNode.type} · {selectedNode.label}
                  </p>
                </div>

                <button
                  style={styles.button}
                  onClick={() => setSelectedNode(null)}
                >
                  <X size={14} />
                  Clear selection
                </button>
              </div>

              <div style={styles.detail}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 18,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <div style={styles.detailLabel}>Node type</div>
                    <div
                      style={{
                        ...styles.detailValue,
                        color: COLORS[selectedNode.type] || "#e2e8f0",
                      }}
                    >
                      {selectedNode.type}
                    </div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Relationships</div>
                    <div style={styles.detailValue}>
                      {edges.filter(
                        (edge) =>
                          edge.source === selectedNode.id ||
                          edge.target === selectedNode.id
                      ).length}
                    </div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Node ID</div>
                    <div style={styles.detailValue}>{selectedNode.id}</div>
                  </div>
                </div>

                <div style={styles.detailLabel}>Backend details</div>
                <pre
                  style={{
                    margin: 0,
                    padding: 16,
                    borderRadius: 10,
                    background: "#080f1a",
                    border: "1px solid #263449",
                    color: "#cbd5e1",
                    fontSize: 11,
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(selectedNode.details || {}, null, 2)}
                </pre>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}