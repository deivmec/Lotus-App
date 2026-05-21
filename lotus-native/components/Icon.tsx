import React from 'react';
import Svg, {
  Path, Circle, Rect, Line, Polyline, Polygon, Ellipse,
} from 'react-native-svg';

// Conversão direta de src/components/Icon.jsx
// API idêntica: <Icon name="home" size={20} color="#000" />
// currentColor não existe em RN — passar cor explicitamente ou usar default

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

const Icon = ({ name, size = 22, color = '#2C2A28' }: IconProps) => {
  const w = '1.6';
  const base = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: w,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  // Wrapper comum para todos os ícones com props padrão
  const S = (props: object) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props} />
  );

  switch (name) {
    case 'home': return (
      <S><Path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><Path d="M9 22V12h6v10"/></S>
    );
    case 'tasks': return (
      <S><Rect x="3" y="3" width="7" height="7" rx="1"/><Rect x="14" y="3" width="7" height="7" rx="1"/><Rect x="3" y="14" width="7" height="7" rx="1"/><Path d="M14 17.5h7M17.5 14v7"/></S>
    );
    case 'person': return (
      <S><Circle cx="12" cy="8" r="4"/><Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></S>
    );
    case 'more': return (
      <S><Circle cx="5" cy="12" r="1.5" fill={color} stroke="none"/><Circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/><Circle cx="19" cy="12" r="1.5" fill={color} stroke="none"/></S>
    );
    case 'check': return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 13l4 4L19 7"/>
      </Svg>
    );
    case 'check2': return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 13l4 4L19 7"/>
      </Svg>
    );
    case 'eye': return (
      <S><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/></S>
    );
    case 'eyeOff': return (
      <S><Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><Line x1="1" y1="1" x2="23" y2="23"/></S>
    );
    case 'arrow': return (
      <S><Path d="M5 12h14M12 5l7 7-7 7"/></S>
    );
    case 'arrowLeft': return (
      <S><Path d="M19 12H5M12 19l-7-7 7-7"/></S>
    );
    case 'plus': return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 5v14M5 12h14"/>
      </Svg>
    );
    case 'star': return (
      <S><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></S>
    );
    case 'search': return (
      <S><Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/></S>
    );
    case 'chevronDown': return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M6 9l6 6 6-6"/>
      </Svg>
    );
    case 'x': return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18M6 6l12 12"/>
      </Svg>
    );
    case 'edit': return (
      <S><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></S>
    );
    case 'trash': return (
      <S><Polyline points="3 6 5 6 21 6"/><Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/><Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></S>
    );
    case 'copy': return (
      <S><Rect x="9" y="9" width="13" height="13" rx="2"/><Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></S>
    );
    case 'cart': return (
      <S><Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><Line x1="3" y1="6" x2="21" y2="6"/><Path d="M16 10a4 4 0 01-8 0"/></S>
    );
    case 'wallet': return (
      <S><Rect x="2" y="5" width="20" height="14" rx="2"/><Path d="M16 12h.01"/><Path d="M2 10h20"/></S>
    );
    case 'calendar': return (
      <S><Rect x="3" y="4" width="18" height="18" rx="2"/><Path d="M16 2v4M8 2v4M3 10h18"/></S>
    );
    case 'note': return (
      <S><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><Polyline points="14 2 14 8 20 8"/><Line x1="16" y1="13" x2="8" y2="13"/><Line x1="16" y1="17" x2="8" y2="17"/><Polyline points="10 9 9 9 8 9"/></S>
    );
    case 'heart': return (
      <S><Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></S>
    );
    case 'lock': return (
      <S><Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path d="M7 11V7a5 5 0 0110 0v4"/></S>
    );
    case 'plane': return (
      <S><Path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></S>
    );
    case 'palette': return (
      <S><Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
        <Circle cx="6.5" cy="11.5" r="1.5" fill={color} stroke="none"/>
        <Circle cx="9.5" cy="7.5" r="1.5" fill={color} stroke="none"/>
        <Circle cx="14.5" cy="7.5" r="1.5" fill={color} stroke="none"/>
        <Circle cx="17.5" cy="11.5" r="1.5" fill={color} stroke="none"/>
      </S>
    );
    case 'layers': return (
      <S><Polygon points="12 2 2 7 12 12 22 7 12 2"/><Polyline points="2 17 12 22 22 17"/><Polyline points="2 12 12 17 22 12"/></S>
    );
    case 'calculator': return (
      <S><Rect x="4" y="2" width="16" height="20" rx="2"/><Line x1="8" y1="6" x2="16" y2="6"/><Line x1="8" y1="12" x2="8" y2="12" strokeWidth="2.5"/><Line x1="12" y1="12" x2="12" y2="12" strokeWidth="2.5"/><Line x1="16" y1="12" x2="16" y2="12" strokeWidth="2.5"/><Line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.5"/><Line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.5"/><Line x1="16" y1="14" x2="16" y2="18"/></S>
    );
    case 'bell': return (
      <S><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></S>
    );
    case 'target': return (
      <S><Circle cx="12" cy="12" r="10"/><Circle cx="12" cy="12" r="6"/><Circle cx="12" cy="12" r="2"/></S>
    );
    case 'mic': return (
      <S><Rect x="9" y="2" width="6" height="11" rx="3"/><Path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></S>
    );
    case 'laptop': return (
      <S><Rect x="2" y="3" width="20" height="14" rx="2"/><Path d="M8 21h8M12 17v4"/></S>
    );
    case 'book': return (
      <S><Path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></S>
    );
    case 'pill': return (
      <S><Path d="M10.5 20H4a2 2 0 01-2-2v-3a7 7 0 017-7h10a2 2 0 012 2v3M10.5 20a7 7 0 007 0M2 13h12"/><Circle cx="17" cy="17" r="5"/><Path d="M17 14v6M14 17h6"/></S>
    );
    case 'dumbbell': return (
      <S><Path d="M6 5v14M18 5v14"/><Path d="M3 8h3M18 8h3M3 16h3M18 16h3"/><Line x1="6" y1="12" x2="18" y2="12"/></S>
    );
    case 'run': return (
      <S><Circle cx="13" cy="4" r="2"/><Path d="M7 21l3-7 3 3 2-4 4-2"/><Path d="M10 14l-2 7"/></S>
    );
    case 'leaf': return (
      <S><Path d="M17 8C8 10 5.9 16.17 3.82 19.34L5.71 21l1-1C7.72 18.85 9.78 18 12 18c5 0 8-4 8-8s-3-8-8-8C9 2 6 5 5 8"/><Path d="M3.82 19.34L3 20"/></S>
    );
    case 'idCard': return (
      <S><Rect x="2" y="5" width="20" height="14" rx="2"/><Circle cx="8" cy="12" r="2.5"/><Path d="M14 10h4M14 14h2"/></S>
    );
    case 'key': return (
      <S><Circle cx="7.5" cy="15.5" r="5.5"/><Path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/></S>
    );
    case 'userCheck': return (
      <S><Path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><Circle cx="9" cy="7" r="4"/><Polyline points="16 11 18 13 22 9"/></S>
    );
    case 'car': return (
      <S><Path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2l2-4h14l2 4a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><Circle cx="7.5" cy="17.5" r="2.5"/><Circle cx="16.5" cy="17.5" r="2.5"/></S>
    );
    case 'compass': return (
      <S><Circle cx="12" cy="12" r="10"/><Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></S>
    );
    case 'shield': return (
      <S><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>
    );
    case 'briefcase': return (
      <S><Rect x="2" y="7" width="20" height="14" rx="2"/><Path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4"/></S>
    );
    case 'utensils': return (
      <S><Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><Path d="M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></S>
    );
    case 'utensil': return (
      <S><Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><Path d="M7 2v20"/></S>
    );
    case 'film': return (
      <S><Rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><Line x1="7" y1="2" x2="7" y2="22"/><Line x1="17" y1="2" x2="17" y2="22"/><Line x1="2" y1="12" x2="22" y2="12"/><Line x1="2" y1="7" x2="7" y2="7"/><Line x1="2" y1="17" x2="7" y2="17"/><Line x1="17" y1="17" x2="22" y2="17"/><Line x1="17" y1="7" x2="22" y2="7"/></S>
    );
    case 'building': return (
      <S><Rect x="2" y="7" width="20" height="14"/><Path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></S>
    );
    case 'mail': return (
      <S><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><Polyline points="22 6 12 13 2 6"/></S>
    );
    case 'cloud': return (
      <S><Path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></S>
    );
    case 'flame': return (
      <S><Path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-7-7c0-1.5.5-3 2-4"/></S>
    );
    case 'mapPin': return (
      <S><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><Circle cx="12" cy="10" r="3"/></S>
    );
    case 'tag': return (
      <S><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><Line x1="7" y1="7" x2="7.01" y2="7"/></S>
    );
    case 'link': return (
      <S><Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></S>
    );
    case 'globe': return (
      <S><Circle cx="12" cy="12" r="10"/><Line x1="2" y1="12" x2="22" y2="12"/><Path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></S>
    );
    case 'sun': return (
      <S><Circle cx="12" cy="12" r="5"/><Line x1="12" y1="1" x2="12" y2="3"/><Line x1="12" y1="21" x2="12" y2="23"/><Line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><Line x1="1" y1="12" x2="3" y2="12"/><Line x1="21" y1="12" x2="23" y2="12"/><Line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></S>
    );
    case 'moon': return (
      <S><Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></S>
    );
    case 'trendUp': return (
      <S><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><Polyline points="17 6 23 6 23 12"/></S>
    );
    case 'trendDown': return (
      <S><Polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><Polyline points="17 18 23 18 23 12"/></S>
    );
    case 'settings': return (
      <S><Circle cx="12" cy="12" r="3"/><Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></S>
    );
    case 'logout': return (
      <S><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></S>
    );
    case 'activity': return (
      <S><Polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></S>
    );
    case 'portfolio': return (
      <S><Rect x="2" y="7" width="20" height="14" rx="2"/><Path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></S>
    );
    case 'capilar': return (
      <S><Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><Path d="M8 14s1.5 2 4 2 4-2 4-2"/><Line x1="9" y1="9" x2="9.01" y2="9"/><Line x1="15" y1="9" x2="15.01" y2="9"/></S>
    );
    case 'camera': return (
      <S><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><Circle cx="12" cy="13" r="4"/></S>
    );
    case 'phone': return (
      <S><Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 11.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012.41 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.4a16 16 0 006.72 6.72l.77-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></S>
    );
    case 'user': return (
      <S><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><Circle cx="12" cy="7" r="4"/></S>
    );
    case 'image': return (
      <S><Rect x="3" y="3" width="18" height="18" rx="2"/><Circle cx="8.5" cy="8.5" r="1.5"/><Polyline points="21 15 16 10 5 21"/></S>
    );
    case 'paperclip': return (
      <S><Path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></S>
    );
    default: return null;
  }
};

export default Icon;
