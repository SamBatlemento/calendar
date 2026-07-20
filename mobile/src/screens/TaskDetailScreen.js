import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import { logExerciseTime } from '../api/assignments';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

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
      <Text style={styles.due}>Due {dayjs(String(assignment.dueDate).slice(0, 10)).format('dddd, MMMM D')}</Text>
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
          <Banner variant="danger">{error}</Banner>
          <Text style={shared.label}>Minutes completed</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={colors.muted}
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
            {saving ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={styles.buttonText}>Mark Complete</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...shared.page, padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  due: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 16 },
  description: { fontSize: 15, color: colors.text, marginBottom: 8, lineHeight: 21 },
  target: { fontSize: 13, color: colors.muted, marginBottom: 24 },
  input: { ...shared.input, fontSize: 18, marginBottom: 16 },
  button: shared.buttonPrimary,
  buttonDisabled: { opacity: 0.5 },
  buttonText: shared.buttonPrimaryText,
  doneBox: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
  },
  doneText: { color: colors.successText, fontWeight: '700', fontSize: 16 },
});
