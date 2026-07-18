import { Pressable, View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

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
        <Text style={styles.due}>Due {dayjs(assignment.dueDate).format('ddd, MMM D')}</Text>
        {done && <Text style={styles.loggedText}>Logged: {assignment.loggedMinutes} min</Text>}
      </View>

      <View style={[styles.badge, done ? styles.badgeDone : styles.badgeOpen]}>
        <Text style={styles.badgeText}>{done ? '✓ Done' : 'Log time'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 72, // comfortably tappable target, unlike a calendar day cell
  },
  cardDone: {
    backgroundColor: '#f2fbf6',
  },
  cardPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  due: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  loggedText: {
    fontSize: 13,
    color: '#2f8f5b',
    marginTop: 2,
  },
  badge: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeOpen: {
    backgroundColor: '#ff6b4a',
  },
  badgeDone: {
    backgroundColor: '#2f8f5b',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
