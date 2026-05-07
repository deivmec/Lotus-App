// Design tokens — convertidos de src/styles/tokens.css
// oklch() → hex aproximado (React Native não suporta oklch)

export const colors = {
  // Backgrounds
  bg:        '#F7F4F0',
  bg2:       '#EDE9E3',
  bg3:       '#E4DED6',
  line:      '#D8D2CA',
  surface:   '#FFFFFF',

  // Text
  text:      '#2C2A28',
  text2:     '#7A756E',
  text3:     '#B0A99F',

  // Accent (oklch 62% 0.09 42 ≈ terracota quente)
  accent:    '#B8784A',
  accentBg:  '#F5EDE6',
  accentDk:  '#8A5530',

  // Semantic
  green:     '#5A9E6F',
  greenBg:   '#EEF7F1',
  blue:      '#5A7FAE',
  blueBg:    '#EEF3F9',
  red:       '#C45C4F',
  redBg:     '#FAEEED',
} as const;

export const darkColors = {
  bg:        '#1E1C1A',
  bg2:       '#2A2724',
  bg3:       '#333028',
  line:      '#3D3830',
  surface:   '#2A2724',
  text:      '#EDE9E3',
  text2:     '#A09890',
  text3:     '#706860',
  accent:    '#B8784A',
  accentBg:  '#3A2518',
  accentDk:  '#D4956A',
  green:     '#5A9E6F',
  greenBg:   '#1A2E22',
  blue:      '#5A7FAE',
  blueBg:    '#1A2232',
  red:       '#C45C4F',
  redBg:     '#2E1A18',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
} as const;

export const spacing = {
  screenPad: 24,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
} as const;

export const maxWidth = 420;
