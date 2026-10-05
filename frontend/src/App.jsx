
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import IncidentDetails from "./pages/IncidentDetails";
import EventExplorer from "./pages/EventExplorer";
import AppLayout from "./components/AppLayout";

function ProtectedLayout() {
  const location = useLocation();

  const [token, setToken] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem("token");
      setToken(false);
    };

    window.addEventListener("tracex:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener(
        "tracex:unauthorized",
        handleUnauthorized
      );
    };
  }, []);

  // Login ke bina protected pages access nahi honge
  if (!token || !localStorage.getItem("token")) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:id" element={<IncidentDetails />} />
          <Route path="/events" element={<EventExplorer />} />
        </Route>

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

