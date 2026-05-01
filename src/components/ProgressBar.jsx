const ProgressBar = ({ value = 0, color = 'var(--accent)', height = 4 }) => (
  <div className="progress-track" style={{ height }}>
    <div
      className="progress-fill"
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, height }}
    />
  </div>
);

export default ProgressBar;
