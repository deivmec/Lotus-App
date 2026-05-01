const PRIORITY_MAP = {
  alta:  { label: 'Alta',  bg: 'oklch(96% 0.04 42)',  color: 'oklch(48% 0.12 42)' },
  media: { label: 'Média', bg: 'oklch(96% 0.04 200)', color: 'oklch(48% 0.1 200)' },
  baixa: { label: 'Baixa', bg: 'var(--bg2)',           color: 'var(--text3)' },
};

export const PriorityTag = ({ level }) => {
  const m = PRIORITY_MAP[level] || PRIORITY_MAP.baixa;
  return <span className="tag" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
};

const Tag = ({ children, bg = 'var(--bg2)', color = 'var(--text3)' }) => (
  <span className="tag" style={{ background: bg, color }}>{children}</span>
);

export default Tag;
