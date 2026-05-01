import Icon from './Icon';

const Checkbox = ({ checked, onToggle, children, strikethrough = true }) => (
  <div className="checkbox-wrap" onClick={onToggle}>
    <div className={`checkbox${checked ? ' checked' : ''}`}>
      {checked && <Icon name="check" size={12} />}
    </div>
    <span style={{
      fontSize: 14,
      lineHeight: 1.5,
      color: checked ? 'var(--text3)' : 'var(--text)',
      textDecoration: checked && strikethrough ? 'line-through' : 'none',
      transition: 'color 0.2s',
      flex: 1,
    }}>
      {children}
    </span>
  </div>
);

export default Checkbox;
