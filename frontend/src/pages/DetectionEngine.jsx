
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
  Zap,
} from "lucide-react";

import api from "../services/api";
import { SeverityBadge, StatusBadge } from "../components/StatusBadge";
import LoadingState, {
  EmptyState,
  ErrorState,
} from "../components/LoadingState";

function getList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function DetectionEngine() {
  const [incidents, setIncidents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Load incidents using the existing backend endpoint.
      const response = await api.get("/incidents");
      const incidentList = getList(response.data, "incidents");

      setIncidents(incidentList);

      // Collect events from the existing incident timeline endpoints.
      const timelineResults = await Promise.allSettled(
        incidentList.map((incident) =>
          api.get(`/incidents/${incident._id}/timeline`)
        )
      );

      const uniqueEvents = new Map();

      timelineResults.forEach((result) => {
        if (result.status !== "fulfilled") return;

        const timeline = getList(result.value.data, "timeline");

        timeline.forEach((event) => {
          if (event?._id) {
            uniqueEvents.set(String(event._id), event);
          }
        });
      });

      const eventList = Array.from(uniqueEvents.values()).sort(
        (a, b) =>
          new Date(b.timestamp || b.createdAt || 0) -
          new Date(a.timestamp || a.createdAt || 0)
      );

      setEvents(eventList);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load detection data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const openIncidents = incidents.filter((incident) =>
      ["OPEN", "NEW"].includes(
        String(incident.status || "").toUpperCase()
      )
    ).length;

    const highSeverity = incidents.filter((incident) =>
      ["HIGH", "CRITICAL"].includes(
        String(incident.severity || "").toUpperCase()
      )
    ).length;

    const detectedThreats = incidents.filter((incident) =>
      String(incident.type || "").toUpperCase().includes("BRUTE") ||
      String(incident.type || "").toUpperCase().includes("SCAN") ||
      String(incident.type || "").toUpperCase().includes("ABNORMAL") ||
      String(incident.type || "").toUpperCase().includes("FREQUENCY")
    ).length;

    return {
      totalIncidents: incidents.length,
      totalEvents: events.length,
      openIncidents,
      highSeverity,
      detectedThreats,
    };
  }, [incidents, events]);

  if (loading) {
    return <LoadingState label="Loading detection engine..." />;
  }

  if (error && incidents.length === 0) {
    return (
      <ErrorState
        message={error}
        onRetry={() => loadData()}
      />
    );
  }

  const detectionRules = [
    {
      name: "Brute-force detection",
      description: "Detects repeated failed login attempts within a short time window.",
      trigger: "Repeated failed logins",
      icon: ShieldAlert,
    },
    {
      name: "Endpoint scanning",
      description: "Flags suspicious requests to multiple non-existent endpoints.",
      trigger: "Multiple HTTP 404 responses",
      icon: TerminalSquare,
    },
    {
      name: "Abnormal access",
      description: "Flags forbidden access attempts against protected resources.",
      trigger: "HTTP 403 on restricted resources",
      icon: ShieldAlert,
    },
    {
      name: "Request frequency",
      description: "Identifies unusually high request volumes from a source.",
      trigger: "High request frequency",
      icon: Zap,
    },
  ];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <div className="eyebrow">THREAT MONITORING</div>
          <h1>Detection Engine</h1>
          <p>
            Monitor recorded incidents, review event activity, and inspect
            the threat patterns tracked by TraceX.
          </p>
        </div>

        <button
          className="button button-secondary"
          onClick={() => loadData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </section>

      {error && (
        <div className="inline-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <section className="stats-strip">
        <div>
          <span>Total incidents</span>
          <strong>{stats.totalIncidents}</strong>
        </div>

        <div>
          <span>Linked events</span>
          <strong>{stats.totalEvents}</strong>
        </div>

        <div>
          <span>Open incidents</span>
          <strong>{stats.openIncidents}</strong>
        </div>

        <div>
          <span>High / critical</span>
          <strong className="text-red">{stats.highSeverity}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <Activity size={17} />
              Detection rules
            </h2>
            <p>
              Threat patterns monitored by the current detection service.
            </p>
          </div>
          <span className="count-pill">
            {detectionRules.length} RULES
          </span>
        </div>

        <div className="detection-rule-list">
          {detectionRules.map((rule) => {
            const RuleIcon = rule.icon;

            return (
              <div className="detection-rule-row" key={rule.name}>
                <div className="event-status-icon failed">
                  <RuleIcon size={17} />
                </div>

                <div className="event-main">
                  <div className="event-title">
                    <strong>{rule.name}</strong>
                  </div>
                  <div className="event-meta">
                    <span>{rule.description}</span>
                  </div>
                  <div className="event-meta">
                    <span>Trigger: {rule.trigger}</span>
                  </div>
                </div>

                <span className="count-pill">MONITORED</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <ShieldCheck size={17} />
              Detected incidents
            </h2>
            <p>
              Incidents returned by the backend, newest first.
            </p>
          </div>

          <span className="count-pill">
            {incidents.length} INCIDENTS
          </span>
        </div>

        {incidents.length === 0 ? (
          <EmptyState
            title="No incidents detected"
            message="Recorded incidents will appear here when the backend creates them."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Threat type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Detected at</th>
                </tr>
              </thead>

              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident._id}>
                    <td>
                      <div className="table-primary">
                        {String(incident.type || "Unknown threat")
                          .replaceAll("_", " ")}
                      </div>
                      <div className="table-secondary">
                        ID: {incident._id}
                      </div>
                    </td>

                    <td>
                      <SeverityBadge
                        severity={incident.severity || "MEDIUM"}
                      />
                    </td>

                    <td>
                      <StatusBadge
                        status={incident.status || "OPEN"}
                      />
                    </td>

                    <td>
                      {new Date(
                        incident.createdAt ||
                          incident.timestamp ||
                          Date.now()
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <Activity size={17} />
              Recent linked events
            </h2>
            <p>
              Events collected from incident timelines and deduplicated by ID.
            </p>
          </div>

          <span className="count-pill">
            {events.length} EVENTS
          </span>
        </div>

        {events.length === 0 ? (
          <EmptyState
            title="No linked events available"
            message="Events appear here when they are included in an incident timeline."
          />
        ) : (
          <div className="event-list">
            {events.slice(0, 10).map((event) => {
              const failed = Number(event.statusCode) >= 400;

              return (
                <div className="event-row" key={event._id}>
                  <div
                    className={`event-status-icon ${
                      failed ? "failed" : "passed"
                    }`}
                  >
                    {failed ? (
                      <ShieldAlert size={16} />
                    ) : (
                      <Activity size={16} />
                    )}
                  </div>

                  <div className="event-main">
                    <div className="event-title">
                      <span className="method-pill">
                        {event.method || "—"}
                      </span>
                      <code>{event.endpoint || "Unknown endpoint"}</code>
                    </div>

                    <div className="event-meta">
                      <span>{event.ip || "Unknown IP"}</span>
                      <span>
                        {event.type || "API_REQUEST"}
                      </span>
                      <span>
                        {new Date(
                          event.timestamp ||
                            event.createdAt ||
                            Date.now()
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`http-pill ${
                      failed ? "http-error" : "http-ok"
                    }`}
                  >
                    {event.statusCode ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}