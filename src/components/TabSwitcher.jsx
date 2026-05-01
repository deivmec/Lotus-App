const TabSwitcher = ({ tabs, active, onChange }) => (
  <div className="tab-switcher">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`tab-btn${active === tab.id ? ' active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default TabSwitcher;
