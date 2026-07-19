import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

const VARIANTS = {
  danger: { bg: colors.dangerBg, border: colors.danger, text: colors.dangerText },
  success: { bg: colors.successBg, border: colors.success, text: colors.successText },
  info: { bg: colors.infoBg, border: colors.border, text: colors.muted },
};

// Mirrors web's .alert-danger / .alert-success / .alert-info (theme.css): a tinted,
// bordered box rather than plain colored text, so errors/success messages read the
// same way they do on the web app.
export default function Banner({ variant = 'info', children }) {
  if (!children) return null;
  const v = VARIANTS[variant] || VARIANTS.info;
  return (
    <View style={[styles.box, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: radii.pill,
    padding: 12,
    marginBottom: 12,
  },
  text: { fontSize: 14 },
});
