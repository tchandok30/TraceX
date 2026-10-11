
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";
import {
  Activity,
  Network,
  RefreshCw,
  ShieldAlert,
  GitBranch,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import api from "../services/api";
import LoadingState, {
  EmptyState,
  ErrorState,
} from "../components/LoadingState";
import "./AttackGraph.css";

const NODE_COLORS = {
  INCIDENT: "#f87171",
  IP: "#60a5fa",
  EVENT: "#a78bfa",
  API: "#34d399",
  USER: "#fbbf24",
  SESSION: "#22d3ee",
  RESOURCE: "#fb923c",
};

const SEVERITY_COLORS = {
  CRITICAL: "#f87171",
  HIGH: "#fb923c",
  MEDIUM: "#fbbf24",
  LOW: "#34d399",
};

function getNodeLabel(node) {
  return (
    node.label ||
    node.name ||
    node.ip ||
    node.endpoint ||
    node.type ||
    node.id ||
    "Unknown node"
  );
}

function normalizeGraph(graph) {
  const rawNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const rawEdges = Array.isArray(graph?.edges) ? graph.edges : [];

  const nodes = rawNodes.map((node, index) => {
    const id = String(node.id ?? node._id ?? `node-${index}`);
    const type = String(node.type || "EVENT").toUpperCase();

    return {
      ...node,
      id,
      type,
      label: String(getNodeLabel({ ...node, id })),
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges = rawEdges
    .map((edge, index) => ({
      id: String(edge.id ?? `edge-${index}`),
      source: String(edge.source ?? edge.from ?? ""),
      target: String(edge.target ?? edge.to ?? ""),
      relationship: String(
        edge.relationship ?? edge.label ?? edge.type ?? "RELATED_TO"
      ),
    }))
    .filter(
      (edge) =>
        nodeIds.has(edge.source) &&
        nodeIds.has(edge.target) &&
        edge.source !== edge.target
    );

  return { nodes, edges };
}

function getSeverity(incident) {
  return String(incident?.severity || "UNKNOWN").toUpperCase();
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

export default function AttackGraph() {
  const graphContainerRef = useRef(null);
  const cyRef = useRef(null);

  const [incidents, setIncidents] = useState([]);
  const [incidentId, setIncidentId] = useState("");
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: [],
  });
  const [incidentDetails, setIncidentDetails] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState("");
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [error, setError] = useState("");
  const [graphError, setGraphError] = useState("");

  const loadIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    setError("");

    try {
      const response = await api.get("/incidents");

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.incidents)
          ? payload.incidents
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      setIncidents(list);

      setIncidentId((current) => {
        if (current && list.some((item) => String(item._id) === current)) {
          return current;
        }

        return list[0]?._id ? String(list[0]._id) : "";
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load incidents."
      );
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  const loadGraph = useCallback(async () => {
    if (!incidentId) {
      setGraphData({ nodes: [], edges: [] });
      setIncidentDetails(null);
      setSelectedNode(null);
      return;
    }

    setLoadingGraph(true);
    setGraphError("");
    setSelectedNode(null);

    try {
      const response = await api.get(
        `/incidents/${encodeURIComponent(incidentId)}/graph`
      );

      const payload = response.data?.data ?? response.data;

      const normalized = normalizeGraph(payload);

      setGraphData(normalized);
      setIncidentDetails(payload?.incident ?? null);
    } catch (err) {
      setGraphData({ nodes: [], edges: [] });
      setIncidentDetails(null);
      setGraphError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load the incident graph."
      );
    } finally {
      setLoadingGraph(false);
    }
  }, [incidentId]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const currentIncident = useMemo(
    () =>
      incidents.find((item) => String(item._id) === String(incidentId)) ||
      incidentDetails,
    [incidents, incidentId, incidentDetails]
  );

  const filteredNodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return graphData.nodes;

    return graphData.nodes.filter((node) =>
      [
        node.label,
        node.type,
        node.id,
        node.ip,
        node.endpoint,
        node.relationship,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [graphData.nodes, search]);

  const visibleNodeIds = useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes]
  );

  const filteredEdges = useMemo(
    () =>
      graphData.edges.filter(
        (edge) =>
          visibleNodeIds.has(edge.source) &&
          visibleNodeIds.has(edge.target)
      ),
    [graphData.edges, visibleNodeIds]
  );

  const stats = useMemo(() => {
    const counts = {};

    graphData.nodes.forEach((node) => {
      counts[node.type] = (counts[node.type] || 0) + 1;
    });

    return {
      nodes: graphData.nodes.length,
      edges: graphData.edges.length,
      ips: counts.IP || 0,
      events: counts.EVENT || 0,
    };
  }, [graphData]);

  useEffect(() => {
    const container = graphContainerRef.current;

    if (!container || loadingGraph || graphError || !incidentId) {
      return;
    }

    const elements = [
      ...graphData.nodes.map((node) => ({
        group: "nodes",
        data: {
          id: node.id,
          label:
            node.label.length > 28
              ? `${node.label.slice(0, 25)}...`
              : node.label,
          fullLabel: node.label,
          type: node.type,
          color: NODE_COLORS[node.type] || "#94a3b8",
          details: JSON.stringify(node, null, 2),
        },
      })),
      ...graphData.edges.map((edge) => ({
        group: "edges",
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.relationship.replaceAll("_", " "),
          relationship: edge.relationship,
        },
      })),
    ];

    const cy = cytoscape({
      container,
      elements,
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.25,
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 450,
        fit: true,
        padding: 55,
        nodeRepulsion: () => 8500,
        idealEdgeLength: () => 130,
        gravity: 0.25,
        numIter: 700,
      },
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "data(color)",
            color: "#e2e8f0",
            "font-size": 10,
            "font-weight": 600,
            "text-wrap": "wrap",
            "text-max-width": 125,
            width: 25,
            height: 25,
            "border-width": 2,
            "border-color": "data(color)",
            "border-opacity": 0.9,
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 9,
            "overlay-opacity": 0,
          },
        },
        {
          selector: "node[type = 'INCIDENT']",
          style: {
            width: 40,
            height: 40,
            shape: "round-rectangle",
            "border-width": 3,
          },
        },
        {
          selector: "node[type = 'IP']",
          style: { shape: "diamond" },
        },
        {
          selector: "node[type = 'API']",
          style: { shape: "round-rectangle" },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#475569",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.8,
            label: "data(label)",
            color: "#94a3b8",
            "font-size": 8,
            "text-rotation": "autorotate",
            "text-background-color": "#0a111e",
            "text-background-opacity": 0.9,
            "text-background-padding": 3,
            "overlay-opacity": 0,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#ffffff",
            "border-width": 4,
            "shadow-blur": 16,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.7,
          },
        },
        {
          selector: "edge:selected",
          style: {
            width: 3,
            "line-color": "#60a5fa",
            "target-arrow-color": "#60a5fa",
          },
        },
        {
          selector: ".dimmed",
          style: { opacity: 0.15 },
        },
        {
          selector: ".matched",
          style: {
            "border-color": "#ffffff",
            "border-width": 4,
          },
        },
      ],
    });

    cyRef.current = cy;

    cy.on("tap", "node", (event) => {
      const element = event.target;
      const node = graphData.nodes.find(
        (item) => item.id === element.id()
      );

      if (node) setSelectedNode(node);
    });

    cy.on("tap", "edge", (event) => {
      const edge = event.target.data();

      setSelectedNode({
        id: edge.id,
        type: "RELATIONSHIP",
        label: edge.relationship,
        source: edge.source,
        target: edge.target,
        relationship: edge.relationship,
      });
    });

    cy.on("tap", (event) => {
      if (event.target === cy) setSelectedNode(null);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!cy.destroyed()) cy.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      if (cyRef.current === cy) cyRef.current = null;
    };
  }, [graphData, incidentId, loadingGraph, graphError]);

  useEffect(() => {
    const cy = cyRef.current;

    if (!cy || cy.destroyed()) return;

    const query = search.trim().toLowerCase();

    cy.elements().removeClass("dimmed matched");

    if (!query) return;

    const matchingNodes = cy.nodes().filter((node) => {
      const data = node.data();

      return (
        String(data.fullLabel).toLowerCase().includes(query) ||
        String(data.type).toLowerCase().includes(query) ||
        String(data.id).toLowerCase().includes(query)
      );
    });

    if (matchingNodes.length > 0) {
      cy.elements().addClass("dimmed");
      matchingNodes.removeClass("dimmed").addClass("matched");
      matchingNodes.connectedEdges().removeClass("dimmed");
      matchingNodes.connectedEdges().connectedNodes().removeClass("dimmed");
    }
  }, [search]);

  const resetGraph = () => {
    const cy = cyRef.current;

    if (cy && !cy.destroyed()) {
      cy.elements().removeClass("dimmed matched");
      cy.layout({
        name: "cose",
        animate: true,
        padding: 55,
        nodeRepulsion: () => 8500,
        idealEdgeLength: () => 130,
        numIter: 500,
      }).run();
      cy.fit(undefined, 45);
    }

    setSearch("");
    setSelectedNode(null);
  };

  const zoomIn = () => {
    const cy = cyRef.current;
    if (cy && !cy.destroyed()) {
      cy.zoom({
        level: cy.zoom() * 1.2,
        renderedPosition: {
          x: cy.width() / 2,
          y: cy.height() / 2,
        },
      });
    }
  };

  const zoomOut = () => {
    const cy = cyRef.current;
    if (cy && !cy.destroyed()) {
      cy.zoom({
        level: cy.zoom() / 1.2,
        renderedPosition: {
          x: cy.width() / 2,
          y: cy.height() / 2,
        },
      });
    }
  };

  const focusNode = (node) => {
    setSelectedNode(node);

    const cy = cyRef.current;

    if (!cy || cy.destroyed()) return;

    const element = cy.getElementById(node.id);

    if (element.length) {
      cy.elements().removeClass("dimmed matched");
      cy.animate({
        center: { eles: element },
        zoom: Math.max(cy.zoom(), 1),
        duration: 350,
      });
      element.select();
    }
  };

  if (loadingIncidents) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="attack-graph-page">
        <ErrorState message={error} />
        <button className="ag-button" onClick={loadIncidents}>
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="attack-graph-page">
      <header className="ag-heading">
        <div>
          <div className="ag-eyebrow">
            <ShieldAlert size={15} />
            SECURITY INVESTIGATION
          </div>

          <h1 className="ag-title">Attack Graph</h1>

          <p className="ag-subtitle">
            Explore the connections between incidents, IP addresses,
            events, APIs and other entities to investigate suspicious
            activity.
          </p>
        </div>

        <button
          className="ag-button"
          onClick={() => {
            loadIncidents();
            loadGraph();
          }}
          disabled={loadingGraph}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      <section className="ag-stats">
        <div className="ag-stat">
          <div className="ag-stat-label">
            <ShieldAlert size={15} />
            Severity
          </div>
          <div
            className="ag-stat-value"
            style={{
              color:
                SEVERITY_COLORS[getSeverity(currentIncident)] || "#f8fafc",
              fontSize: 21,
            }}
          >
            {getSeverity(currentIncident)}
          </div>
          <div className="ag-stat-hint">Selected incident</div>
        </div>

        <div className="ag-stat">
          <div className="ag-stat-label">
            <Network size={15} />
            Graph nodes
          </div>
          <div className="ag-stat-value">{stats.nodes}</div>
          <div className="ag-stat-hint">Connected entities</div>
        </div>

        <div className="ag-stat">
          <div className="ag-stat-label">
            <GitBranch size={15} />
            Relationships
          </div>
          <div className="ag-stat-value">{stats.edges}</div>
          <div className="ag-stat-hint">Graph connections</div>
        </div>

        <div className="ag-stat">
          <div className="ag-stat-label">
            <Activity size={15} />
            IP addresses
          </div>
          <div className="ag-stat-value">{stats.ips}</div>
          <div className="ag-stat-hint">
            {stats.events} event nodes
          </div>
        </div>
      </section>

      <section className="ag-panel">
        <div className="ag-panel-header">
          <div>
            <h2 className="ag-panel-title">Incident selection</h2>
            <p className="ag-panel-subtitle">
              Choose an incident to load its relationship graph.
            </p>
          </div>

          <span className="ag-pill">
            {incidents.length} INCIDENT{incidents.length === 1 ? "" : "S"}
          </span>
        </div>

        <div className="ag-panel-body">
          {incidents.length === 0 ? (
            <EmptyState
              title="No incidents found"
              message="Generate demo security activity or wait for an incident to be detected."
            />
          ) : (
            <select
              className="ag-select"
              value={incidentId}
              onChange={(event) => setIncidentId(event.target.value)}
              aria-label="Select incident"
            >
              {incidents.map((incident) => (
                <option key={incident._id} value={String(incident._id)}>
                  {incident.type || "Security incident"} —{" "}
                  {getSeverity(incident)} —{" "}
                  {String(incident._id).slice(-8)}
                </option>
              ))}
            </select>
          )}

          {currentIncident && (
            <div style={{ marginTop: 16 }}>
              <div className="ag-detail-grid">
                <div>
                  <div className="ag-detail-label">Incident type</div>
                  <div className="ag-detail-value">
                    {currentIncident.type || "Unknown"}
                  </div>
                </div>

                <div>
                  <div className="ag-detail-label">Status</div>
                  <div className="ag-detail-value">
                    {currentIncident.status || "Unknown"}
                  </div>
                </div>

                <div>
                  <div className="ag-detail-label">Detected</div>
                  <div className="ag-detail-value">
                    {formatDate(
                      currentIncident.createdAt ||
                        currentIncident.timestamp
                    )}
                  </div>
                </div>
              </div>

              <div className="ag-detail-label">Incident ID</div>
              <div className="ag-detail-value" style={{ overflowWrap: "anywhere" }}>
                {currentIncident._id}
              </div>
            </div>
          )}
        </div>
      </section>

      {graphError && (
        <div className="ag-error">
          <strong>Graph loading failed:</strong> {graphError}
          <button
            className="ag-button"
            style={{ marginLeft: 12 }}
            onClick={loadGraph}
          >
            Retry
          </button>
        </div>
      )}

      <section className="ag-panel">
        <div className="ag-panel-header">
          <div>
            <h2 className="ag-panel-title">Interactive relationship map</h2>
            <p className="ag-panel-subtitle">
              Drag nodes, zoom, pan and select a node to inspect its
              details.
            </p>
          </div>

          <span className="ag-pill">CYTOSCAPE GRAPH</span>
        </div>

        <div className="ag-legend">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div className="ag-legend-item" key={type}>
              <span
                className="ag-legend-dot"
                style={{ background: color }}
              />
              {type}
            </div>
          ))}
        </div>

        <div className="ag-toolbar">
          <div className="ag-toolbar-actions">
            <button
              className="ag-button"
              onClick={zoomIn}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn size={15} />
            </button>

            <button
              className="ag-button"
              onClick={zoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut size={15} />
            </button>

            <button
              className="ag-button"
              onClick={resetGraph}
              title="Reset graph layout"
            >
              <Maximize2 size={15} />
              Reset
            </button>
          </div>

          <span className="ag-pill">
            {filteredNodes.length} NODES · {filteredEdges.length} EDGES
          </span>
        </div>

        <div className="ag-search">
          <Search size={16} color="#94a3b8" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search IP, event, API or node type..."
            aria-label="Search graph nodes"
          />
          {search && (
            <button
              className="ag-button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {loadingGraph ? (
          <div className="ag-empty">Loading incident graph...</div>
        ) : graphError ? (
          <div className="ag-empty">
            The graph could not be loaded. Use the retry button above.
          </div>
        ) : !incidentId ? (
          <div className="ag-empty">
            Select an incident to view its attack graph.
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="ag-empty">
            No graph nodes were returned for this incident.
          </div>
        ) : (
          <div className="ag-canvas">
            <div
              ref={graphContainerRef}
              className="ag-cytoscape"
              aria-label="Interactive attack relationship graph"
            />

            <div className="ag-canvas-count">
              {stats.nodes} entities · {stats.edges} relationships
            </div>
          </div>
        )}
      </section>

      <section className="ag-panel">
        <div className="ag-panel-header">
          <div>
            <h2 className="ag-panel-title">Graph entities</h2>
            <p className="ag-panel-subtitle">
              Select an entity to focus it on the graph and inspect its data.
            </p>
          </div>
          <span className="ag-pill">{filteredNodes.length} RESULTS</span>
        </div>

        {filteredNodes.length === 0 ? (
          <div className="ag-empty">No entities match your search.</div>
        ) : (
          <div className="ag-entity-grid">
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                className={`ag-entity-card ${
                  selectedNode?.id === node.id ? "is-selected" : ""
                }`}
                onClick={() => focusNode(node)}
              >
                <div
                  className="ag-entity-type"
                  style={{
                    color: NODE_COLORS[node.type] || "#94a3b8",
                  }}
                >
                  {node.type}
                </div>
                <div className="ag-entity-name">{node.label}</div>
                <div className="ag-entity-meta">
                  ID: {node.id.length > 28 ? `${node.id.slice(0, 25)}...` : node.id}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="ag-panel">
        <div className="ag-panel-header">
          <div>
            <h2 className="ag-panel-title">Relationships</h2>
            <p className="ag-panel-subtitle">
              Connections between entities in this incident.
            </p>
          </div>
          <span className="ag-pill">{filteredEdges.length} EDGES</span>
        </div>

        {filteredEdges.length === 0 ? (
          <div className="ag-empty">No relationships to display.</div>
        ) : (
          filteredEdges.slice(0, 100).map((edge) => {
            const source = graphData.nodes.find(
              (node) => node.id === edge.source
            );
            const target = graphData.nodes.find(
              (node) => node.id === edge.target
            );

            return (
              <div className="ag-relationship-row" key={edge.id}>
                <button
                  className="ag-relationship-endpoint"
                  onClick={() => source && focusNode(source)}
                  title={source?.label || edge.source}
                >
                  {source?.label || edge.source}
                </button>

                <div className="ag-relationship-label">
                  {edge.relationship.replaceAll("_", " ")}
                </div>

                <button
                  className="ag-relationship-endpoint"
                  onClick={() => target && focusNode(target)}
                  title={target?.label || edge.target}
                  style={{ textAlign: "right" }}
                >
                  {target?.label || edge.target}
                </button>
              </div>
            );
          })
        )}

        {filteredEdges.length > 100 && (
          <div className="ag-empty">
            Showing the first 100 relationships. Use search to narrow the list.
          </div>
        )}
      </section>

      {selectedNode && (
        <section className="ag-panel">
          <div className="ag-panel-header">
            <div>
              <h2 className="ag-panel-title">Selected entity details</h2>
              <p className="ag-panel-subtitle">
                {selectedNode.label || selectedNode.id}
              </p>
            </div>

            <button
              className="ag-button"
              onClick={() => {
                setSelectedNode(null);
                const cy = cyRef.current;
                if (cy && !cy.destroyed()) cy.elements().unselect();
              }}
            >
              <X size={15} />
              Close
            </button>
          </div>

          <div className="ag-detail">
            <div className="ag-detail-grid">
              <div>
                <div className="ag-detail-label">Entity type</div>
                <div
                  className="ag-detail-value"
                  style={{
                    color:
                      NODE_COLORS[selectedNode.type] || "#e2e8f0",
                  }}
                >
                  {selectedNode.type}
                </div>
              </div>

              <div>
                <div className="ag-detail-label">Entity ID</div>
                <div className="ag-detail-value">{selectedNode.id}</div>
              </div>

              <div>
                <div className="ag-detail-label">Label</div>
                <div className="ag-detail-value">
                  {selectedNode.label || "Not available"}
                </div>
              </div>
            </div>

            <div className="ag-detail-label">Raw entity data</div>
            <pre className="ag-detail-json">
              {JSON.stringify(selectedNode, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
