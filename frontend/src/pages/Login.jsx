import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Eye, EyeOff, Network, ShieldCheck, UserPlus } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "register") {
        const { data } = await api.post("/auth/register", { name: name.trim(), email: email.trim(), password });
        const token = data.token || data.accessToken;
        if (token) {
          localStorage.setItem("token", token);
          navigate(location.state?.from || "/dashboard", { replace: true });
        } else {
          setSuccess("Account created successfully. Sign in with your new credentials.");
          setMode("login");
          setPassword("");
        }
      } else {
        const { data } = await api.post("/auth/login", { email: email.trim(), password });
        const token = data.token || data.accessToken;
        if (!token) throw new Error("Login response did not contain a token. Check the backend response format.");
        localStorage.setItem("token", token);
        navigate(location.state?.from || "/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || (mode === "register" ? "Could not create account." : "Login failed. Check your credentials and backend."));
    } finally {
      setLoading(false);
    }
  }

  const registering = mode === "register";

  return (
    <div className="login-page">
      <div className="login-ambient ambient-one" /><div className="login-ambient ambient-two" />
      <div className="login-left">
        <div className="login-brand"><span className="brand-mark"><Network size={21} /></span><span>Trace<span>X</span></span></div>
        <div className="login-hero">
          <div className="eyebrow"><span className="pulse-dot" /> INCIDENT RESPONSE PLATFORM</div>
          <h1>See the signal.<br /><span>Trace the threat.</span></h1>
          <p>Turn suspicious activity into a complete incident story. Investigate events, connect entities, and understand what happened.</p>
          <div className="login-feature"><span><Activity size={18} /></span><div><strong>Live event intelligence</strong><small>Bring activity into one investigation view.</small></div></div>
          <div className="login-feature"><span><Network size={18} /></span><div><strong>Connected incident context</strong><small>Follow the links between events and entities.</small></div></div>
          <div className="login-feature"><span><ShieldCheck size={18} /></span><div><strong>Analyst-first workflow</strong><small>Move from alert to investigation in one place.</small></div></div>
        </div>
        <div className="login-footnote">TRACEX SECURITY OPERATIONS <span>·</span> LOCAL INSTANCE</div>
      </div>
      <div className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-icon">{registering ? <UserPlus size={22} /> : <ShieldCheck size={22} />}</div>
          <p className="eyebrow">{registering ? "NEW ANALYST ACCOUNT" : "ANALYST ACCESS"}</p>
          <h2>{registering ? "Create your account" : "Welcome back"}</h2>
          <p className="login-subtitle">{registering ? "Set up your TraceX investigator account." : "Sign in to continue to your workspace."}</p>
          {error && <div className="alert-error" role="alert">{error}</div>}
          {success && <div className="alert-success" role="status">{success}</div>}
          {registering && <><label className="field-label" htmlFor="name">Full name</label><input id="name" className="text-input" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required minLength={2} /></>}
          <label className="field-label" htmlFor="email">Email address</label>
          <input id="email" className="text-input" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="field-label" htmlFor="password">Password</label>
          <div className="password-wrap"><input id="password" className="text-input" type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} placeholder={registering ? "Create a password" : "Enter your password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={registering ? 8 : undefined} /><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          {registering && <p className="form-hint">Use at least 8 characters. Your account is created with the backend's default role.</p>}
          <button className="button button-primary login-submit" disabled={loading}>{loading ? (registering ? "Creating account..." : "Signing in...") : <>{registering ? "Create account" : "Sign in securely"} <ArrowRight size={17} /></>}</button>
          <div className="login-security"><ShieldCheck size={15} /> Protected with token-based authentication</div>
          <div className="login-bottom">{registering ? "Already have an account? " : "New to TraceX? "}<button type="button" className="auth-mode-toggle" onClick={() => switchMode(registering ? "login" : "register")}>{registering ? "Sign in" : "Create an account"}</button><div className="login-help">Make sure the TraceX backend is running and the API URL is configured.</div></div>
        </form>
      </div>
    </div>
  );
}
