import Icon from './Icon';

const BackHeader = ({ title, subtitle, onBack, action }) => (
  <div className="back-header">
    <button className="back-btn" onClick={onBack}>
      <Icon name="arrowLeft" size={20} />
    </button>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', lineHeight: 1.2 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
    {action}
  </div>
);

export default BackHeader;
