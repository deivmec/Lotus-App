const LotusLogo = ({ size = 32, color = "var(--text)" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 28 C16 28 6 22 6 14 C6 10 9 7 12 7 C13.5 7 15 7.8 16 9 C17 7.8 18.5 7 20 7 C23 7 26 10 26 14 C26 22 16 28 16 28Z"
      stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M16 28 C16 28 10 20 10 14 C10 11 12.5 9 14.5 9 C15.2 9 15.7 9.3 16 9.8 C16.3 9.3 16.8 9 17.5 9 C19.5 9 22 11 22 14 C22 20 16 28 16 28Z"
      stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeOpacity="0.45"/>
    <line x1="16" y1="9" x2="16" y2="28" stroke={color} strokeWidth="1.1" strokeOpacity="0.25"/>
  </svg>
);

export default LotusLogo;
