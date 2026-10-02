import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const userResponse = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const incidentResponse = await api.get("/incidents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(userResponse.data.user);
      setIncidents(incidentResponse.data.incidents);

    } catch (error) {
      console.log("Dashboard error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalIncidents = incidents.length;

  const openIncidents = incidents.filter(
    (incident) => incident.status === "OPEN"
  ).length;

  const highSeverity = incidents.filter(
    (incident) =>
      incident.severity === "HIGH" ||
      incident.severity === "CRITICAL"
  ).length;

  const investigating = incidents.filter(
    (incident) => incident.status === "INVESTIGATING"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-slate-400 mt-4">
            Loading TraceX...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}

      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              T
            </div>

            <div>
              <h1 className="font-bold text-lg">
                TraceX
              </h1>

              <p className="text-xs text-slate-500">
                Incident Investigation Platform
              </p>
            </div>

          </div>

          <div className="flex items-center gap-5">

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">
                {user?.role}
              </p>

              <p className="text-xs text-slate-500">
                Investigator
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm rounded-lg border border-slate-700 hover:bg-slate-800 transition"
            >
              Logout
            </button>

          </div>

        </div>

      </nav>

      {/* Main */}

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>

            <p className="text-sm text-blue-400 font-medium mb-2">
              SECURITY OPERATIONS
            </p>

            <h2 className="text-3xl font-bold">
              Investigation Dashboard
            </h2>

            <p className="text-slate-400 mt-2">
              Monitor and investigate application security incidents.
            </p>

          </div>

          <button
            onClick={fetchDashboard}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition text-sm"
          >
            ↻ Refresh
          </button>

        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Total */}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-400">
              Total Incidents
            </p>

            <p className="text-3xl font-bold mt-3">
              {totalIncidents}
            </p>

            <p className="text-xs text-slate-500 mt-2">
              All detected incidents
            </p>

          </div>

          {/* Open */}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-400">
              Open Incidents
            </p>

            <p className="text-3xl font-bold mt-3">
              {openIncidents}
            </p>

            <p className="text-xs text-slate-500 mt-2">
              Awaiting investigation
            </p>

          </div>

          {/* High */}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-400">
              High Severity
            </p>

            <p className="text-3xl font-bold mt-3">
              {highSeverity}
            </p>

            <p className="text-xs text-slate-500 mt-2">
              High or critical incidents
            </p>

          </div>

          {/* Investigating */}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <p className="text-sm text-slate-400">
              Investigating
            </p>

            <p className="text-3xl font-bold mt-3">
              {investigating}
            </p>

            <p className="text-xs text-slate-500 mt-2">
              Currently being reviewed
            </p>

          </div>

        </div>

        {/* Incident table */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

            <div>
              <h3 className="text-lg font-semibold">
                Recent Incidents
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Detected application security events
              </p>
            </div>

            <span className="text-sm text-slate-500">
              {incidents.length} total
            </span>

          </div>

          {incidents.length === 0 ? (

            <div className="p-12 text-center">

              <div className="text-4xl mb-4">
                ✓
              </div>

              <h3 className="font-semibold">
                No incidents detected
              </h3>

              <p className="text-slate-500 text-sm mt-2">
                TraceX has not detected any security incidents yet.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b border-slate-800">

                  <tr className="text-xs uppercase text-slate-500">

                    <th className="px-6 py-4 font-medium">
                      Incident
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Source IP
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Severity
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Detected
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {incidents.map((incident) => (

                    <tr
                      key={incident._id}
                      onClick={() =>
                        navigate(`/incidents/${incident._id}`)
                      }
                      className="hover:bg-slate-800/50 cursor-pointer transition"
                    >

                      <td className="px-6 py-5">

                        <p className="font-medium">
                          {incident.type}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          ID: {incident._id.slice(-8)}
                        </p>

                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {incident.sourceIP}
                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
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

                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            incident.status === "OPEN"
                              ? "bg-red-500/10 text-red-400"
                              : incident.status === "INVESTIGATING"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-green-500/10 text-green-400"
                          }`}
                        >
                          {incident.status}
                        </span>

                      </td>

                      <td className="px-6 py-5 text-sm text-slate-400">

                        {new Date(
                          incident.createdAt
                        ).toLocaleString()}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

export default Dashboard;