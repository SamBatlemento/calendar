import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import { logExerciseTime } from '../api/assignments';

export default function TaskDetailScreen({ route, navigation }) {
  const { assignment } = route.params;
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const alreadyLogged = !!assignment.loggedMinutes;

  const handleSubmit = async () => {
    if (!minutes) return;
    setSaving(true);
    setError(null);
    try {
      await logExerciseTime(assignment._id, Number(minutes));
      navigation.goBack(); // Tasks screen re-fetches on focus, so the list updates itself.
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log time.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{assignment.exercise?.name}</Text>
      <Text style={styles.due}>Due {dayjs(assignment.dueDate).format('dddd, MMMM D')}</Text>
      {assignment.exercise?.description ? (
        <Text style={styles.description}>{assignment.exercise.description}</Text>
      ) : null}
      {assignment.exercise?.targetDuration ? (
        <Text style={styles.target}>Target: {assignment.exercise.targetDuration} min</Text>
      ) : null}

      {alreadyLogged ? (
        <View style={styles.doneBox}>
          <Text style={styles.doneText}>✓ Logged {assignment.loggedMinutes} minutes</Text>
        </View>
      ) : (
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Text style={styles.label}>Minutes completed</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={minutes}
            onChangeText={setMinutes}
            placeholder="e.g. 30"
            autoFocus
          />
          <Pressable
            style={[styles.button, (!minutes || saving) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!minutes || saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Mark Complete</Text>}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', color: '#222' },
  due: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 16 },
  description: { fontSize: 15, color: '#333', marginBottom: 8, lineHeight: 21 },
  target: { fontSize: 13, color: '#888', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
  },
  button: { backgroundColor: '#1f4d3d', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#c0392b', marginBottom: 12 },
  doneBox: { backgroundColor: '#f2fbf6', borderRadius: 10, padding: 16, marginTop: 12 },
  doneText: { color: '#2f8f5b', fontWeight: '700', fontSize: 16 },
});
