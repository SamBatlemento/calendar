import { Pressable, View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { colors, radii } from '../theme';

export default function TaskCard({ assignment, onPress }) {
  const done = !!assignment.loggedMinutes;
  const exerciseName = assignment.exercise?.name || 'Exercise';

  return (
    <Pressable
      onPress={() => onPress(assignment)}
      style={({ pressed }) => [
        styles.card,
        done && styles.cardDone,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{exerciseName}</Text>
        <Text style={styles.due}>Due {dayjs(String(assignment.dueDate).slice(0, 10)).format('ddd, MMM D')}</Text>
        {done && <Text style={styles.loggedText}>Logged: {assignment.loggedMinutes} min</Text>}
      </View>

      <View style={[styles.badge, done ? styles.badgeDone : styles.badgeOpen]}>
        <Text style={[styles.badgeText, done ? styles.badgeTextDone : styles.badgeTextOpen]}>
          {done ? '✓ Done' : 'Log time'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    minHeight: 72, // comfortably tappable target, unlike a calendar day cell
  },
  cardDone: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  cardPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  due: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  loggedText: {
    fontSize: 13,
    color: colors.successText,
    marginTop: 2,
  },
  badge: {
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeOpen: {
    backgroundColor: colors.accent,
  },
  badgeDone: {
    backgroundColor: colors.success,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  badgeTextOpen: {
    color: colors.accentText,
  },
  badgeTextDone: {
    color: colors.text,
  },
});
