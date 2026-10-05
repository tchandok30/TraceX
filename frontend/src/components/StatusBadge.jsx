export function SeverityBadge({ severity = "MEDIUM" }) {
  return <span className={`badge severity-${String(severity).toLowerCase()}`}><i />{severity}</span>;
}
export function StatusBadge({ status = "OPEN" }) {
  return <span className={`badge status-${String(status).toLowerCase()}`}>{status}</span>;
}
