import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";

import "reactflow/dist/style.css";
import api from "../services/api";

function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const token = localStorage.getItem("token");

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const incidentResponse = await api.get(
          `/incidents/${id}`,
          config
        );

        const timelineResponse = await api.get(
          `/incidents/${id}/timeline`,
          config
        );

        const graphResponse = await api.get(
          `/incidents/${id}/graph`,
          config
        );

        setIncident(incidentResponse.data.incident);
        setTimeline(timelineResponse.data.timeline);

        setGraphNodes(graphResponse.data.nodes);
        setGraphEdges(graphResponse.data.edges);

      } catch (error) {
        console.log("Incident details error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">

          <div className="h-10 w-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-slate-400 mt-4">
            Loading incident investigation...
          </p>

        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">

        <button
          onClick={() => navigate("/dashboard")}
          className="text-slate-400 hover:text-white"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold mt-8">
          Incident not found
        </h1>

      </div>
    );
  }

  const formattedDate = new Date(
    incident.createdAt
  ).toLocaleString();

  const graphReactNodes = graphNodes.map((node) => {

    let position = {
      x: 0,
      y: 0,
    };

    if (node.type === "INCIDENT") {
      position = {
        x: 50,
        y: 220,
      };
    }

    if (node.type === "IP") {
      position = {
        x: 350,
        y: 220,
      };
    }

    if (node.type === "EVENT") {

      const eventIndex = graphNodes
        .filter((n) => n.type === "EVENT")
        .findIndex((n) => n.id === node.id);

      position = {
        x: 650,
        y: 60 + eventIndex * 130,
      };
    }

    if (node.type === "API") {

      const apiIndex = graphNodes
        .filter((n) => n.type === "API")
        .findIndex((n) => n.id === node.id);

      position = {
        x: 1000,
        y: 100 + apiIndex * 160,
      };
    }

    return {
      id: node.id,

      position,

      data: {
        label: (
          <div className="px-3 py-2">

            <p className="text-[10px] text-slate-400 uppercase">
              {node.type}
            </p>

            <p className="text-sm font-medium">
              {node.label}
            </p>

          </div>
        ),
      },

      style: {
        background:
          node.type === "INCIDENT"
            ? "#3f1d1d"
            : node.type === "IP"
            ? "#172554"
            : node.type === "EVENT"
            ? "#422006"
            : "#172554",

        color: "white",

        border:
          node.type === "INCIDENT"
            ? "1px solid #ef4444"
            : node.type === "IP"
            ? "1px solid #3b82f6"
            : node.type === "EVENT"
            ? "1px solid #f59e0b"
            : "1px solid #6366f1",

        borderRadius: "10px",

        minWidth: "150px",
      },
    };
  });

  const graphReactEdges = graphEdges.map(
    (edge, index) => ({
      id: `edge-${index}`,

      source: edge.source,

      target: edge.target,

      label: edge.relationship,

      animated: true,

      style: {
        stroke: "#64748b",
      },

      labelStyle: {
        fill: "#94a3b8",
        fontSize: 10,
      },
    })
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}

      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >

            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              T
            </div>

            <div className="text-left">

              <h1 className="font-bold text-lg">
                TraceX
              </h1>

              <p className="text-xs text-slate-500">
                Incident Investigation
              </p>

            </div>

          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 text-sm rounded-lg border border-slate-700 hover:bg-slate-800 transition"
          >
            ← Dashboard
          </button>

        </div>

      </nav>

      {/* Main */}

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}

        <div className="mb-8">

          <p className="text-sm text-blue-400 font-medium mb-2">
            SECURITY INCIDENT
          </p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">

            <div>

              <h1 className="text-3xl font-bold">
                {incident.type}
              </h1>

              <p className="text-slate-500 text-sm mt-2">
                Incident ID: {incident._id}
              </p>

            </div>

            <div className="flex gap-3">

              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  incident.severity === "CRITICAL"
                    ? "bg-red-500/10 text-red-400"
                    : incident.severity === "HIGH"
                    ? "bg-orange-500/10 text-orange-400"
                    : incident.severity === "MEDIUM"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {incident.severity}
              </span>

              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                {incident.status}
              </span>

            </div>

          </div>

        </div>

        {/* Incident overview */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-500">
              Source IP
            </p>

            <p className="text-lg font-semibold mt-2">
              {incident.sourceIP}
            </p>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-500">
              Events
            </p>

            <p className="text-2xl font-bold mt-2">
              {timeline.length}
            </p>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-500">
              Detected
            </p>

            <p className="text-sm font-medium mt-3">
              {formattedDate}
            </p>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-500">
              Status
            </p>

            <p className="text-lg font-semibold mt-2">
              {incident.status}
            </p>

          </div>

        </div>

        {/* Description */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">

          <p className="text-sm text-slate-500 mb-2">
            Incident Description
          </p>

          <p className="text-slate-300">
            {incident.description}
          </p>

        </div>

        {/* Investigation Timeline */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8">

          <div className="px-6 py-5 border-b border-slate-800">

            <h2 className="text-lg font-semibold">
              Investigation Timeline
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Chronological activity associated with this incident
            </p>

          </div>

          <div className="p-6">

            {timeline.length === 0 ? (

              <p className="text-slate-500">
                No events found.
              </p>

            ) : (

              <div className="relative">

                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700" />

                <div className="space-y-7">

                  {timeline.map((event) => (

                    <div
                      key={event._id}
                      className="relative pl-8"
                    >

                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-blue-500 border-4 border-slate-900" />

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

                        <div>

                          <div className="flex items-center gap-3">

                            <span className="font-mono text-sm text-blue-400">
                              {event.method}
                            </span>

                            <span className="font-mono text-sm">
                              {event.endpoint}
                            </span>

                          </div>

                          <p className="text-sm text-slate-500 mt-2">
                            Source IP: {event.ip}
                          </p>

                        </div>

                        <div className="md:text-right">

                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              event.statusCode >= 400
                                ? "bg-red-500/10 text-red-400"
                                : "bg-green-500/10 text-green-400"
                            }`}
                          >
                            HTTP {event.statusCode}
                          </span>

                          <p className="text-xs text-slate-600 mt-2">
                            {new Date(
                              event.timestamp
                            ).toLocaleString()}
                          </p>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            )}

          </div>

        </div>

        {/* Investigation Graph */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-800">

            <h2 className="text-lg font-semibold">
              Investigation Graph
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Relationships between the incident, source,
              events and APIs
            </p>

          </div>

          <div className="h-[600px] bg-slate-950">

            <ReactFlow
              nodes={graphReactNodes}
              edges={graphReactEdges}
              fitView
            >

              <Background color="#1e293b" />

              <Controls />

              <MiniMap />

            </ReactFlow>

          </div>

        </div>

      </main>

    </div>
  );
}

export default IncidentDetails;