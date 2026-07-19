// Mirrors web/src/theme.css ("Navy & Amber theme") 1:1 so the mobile app reads as the
// same product. If the web palette changes, update the hex values here to match.
export const colors = {
  bg: '#0d2b45', // page background AND the fill color for inputs (recessed look)
  card: '#123152', // panel/card surface, sits one step lighter than the page
  border: '#1e4269',
  text: '#ffffff',
  muted: '#a9c2d8',
  accent: '#ffb020',
  accentHover: '#ffc04d',
  accentText: '#0d2b45', // text/icon color to use ON TOP OF the accent color
  danger: '#ff6b6b',
  dangerBg: 'rgba(255, 107, 107, 0.15)',
  dangerText: '#ffb3b3',
  success: '#1f7a4a',
  successBg: 'rgba(74, 222, 128, 0.15)',
  successText: '#b6f5c9',
  infoBg: 'rgba(169, 194, 216, 0.15)',
};

export const radii = { card: 12, control: 10, pill: 8 };

// Shared style fragments so every screen's StyleSheet stays consistent instead of
// re-deriving the same "input", "card", "button" look by hand each time.
export const shared = {
  page: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 20,
  },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  muted: { color: colors.muted },
  link: { color: colors.accent, fontWeight: '700' },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
    borderRadius: radii.control,
    padding: 16,
    alignItems: 'center',
  },
  buttonPrimaryText: { color: colors.accentText, fontWeight: '700', fontSize: 16 },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    padding: 16,
    alignItems: 'center',
  },
  buttonOutlineText: { color: colors.text, fontWeight: '700' },
  buttonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.control,
    padding: 12,
    alignItems: 'center',
  },
  buttonDangerText: { color: colors.danger, fontWeight: '700' },
};

// React Navigation theme so headers, the tab bar, and default screen backgrounds all
// pick up the palette automatically instead of needing per-screen overrides.
export const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.accent,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export const headerScreenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
};

export const tabScreenOptions = {
  ...headerScreenOptions,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
};
