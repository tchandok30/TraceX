export default function LoadingState({ label = "Loading data..." }) {
  return <div className="state-card"><span className="spinner" /><p>{label}</p></div>;
}
export function ErrorState({ message, onRetry }) {
  return <div className="state-card error-state"><strong>Unable to load data</strong><p>{message}</p>{onRetry && <button className="button button-secondary" onClick={onRetry}>Try again</button>}</div>;
}
export function EmptyState({ title = "Nothing here yet", message = "Data will appear here when it becomes available." }) {
  return <div className="empty-state"><div className="empty-icon">⌁</div><strong>{title}</strong><p>{message}</p></div>;
}
