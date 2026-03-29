// CogniZen · Design Tokens
// Mochi-inspired palette: warm cream surfaces, cocoa text, caramel accents,
// and a soft blue borrowed from Mochi's eyes.

export const colors = {
  // Backgrounds
  bg0: '#FFF8F0',
  bg1: '#FBF1E7',
  bg2: '#F2E1CD',
  bg3: '#E7C9AA',

  // Borders
  border0: '#ECD8C1',
  border1: '#E2C9B2',
  border2: '#C89C78',

  // Text
  textPrimary: '#4B3124',
  textSecondary: '#654736',
  textTertiary: '#7C5A45',
  textOnAccent: '#3A2318',

  // Accent families
  jadeLight: '#F2C48C',
  jade: '#D79A62',
  jadeDark: '#A8683C',

  amberLight: '#B8DAF4',
  amber: '#7FB4DE',
  amberDark: '#4B86B6',

  violetLight: '#DAB3A0',
  violet: '#B67A63',
  violetDark: '#865441',

  // CDI state colors
  driftAnchor: '#8EBEDE',
  driftSteady: '#B8DAF4',
  driftMild: '#F2C48C',
  driftActive: '#D79A62',
  driftStrong: '#BA8774',

  // Realm tints
  realmEmber: '#F8E5D8',
  realmRidge: '#F4EADF',
  realmEchoes: '#EFE4D8',
  realmWell: '#F6EEE5',
};

export const typography = {
  display: 'Cormorant-SemiBold',
  displayItalic: 'Cormorant-SemiBoldItalic',

  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',

  mono: 'DMSans-Regular',

  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
    display: 44,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 20,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#6B3A22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 4,
  },
  lifted: {
    shadowColor: '#6B3A22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.17,
    shadowRadius: 26,
    elevation: 8,
  },
  float: {
    shadowColor: '#6B3A22',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 12,
  },
  inner: {
    shadowColor: '#6B3A22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
};

export function cdiColor(score: number): string {
  if (score < 20) return colors.driftAnchor;
  if (score < 40) return colors.driftSteady;
  if (score < 55) return colors.driftMild;
  if (score < 70) return colors.driftActive;
  return colors.driftStrong;
}

export function realmTint(realmName: string): string {
  if (realmName.includes('Ember')) return colors.realmEmber;
  if (realmName.includes('Ridge')) return colors.realmRidge;
  if (realmName.includes('Echo')) return colors.realmEchoes;
  return colors.realmWell;
}
