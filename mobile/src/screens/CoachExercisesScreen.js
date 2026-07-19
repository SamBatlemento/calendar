import { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getExercises, createExercise, deleteExercise } from '../api/assignments';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

export default function CoachExercisesScreen() {
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', targetDurationMinutes: '30' });
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getExercises();
      setExercises(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load exercises.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setError('Name and description are required.');
      return;
    }
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      await createExercise({
        name: form.name.trim(),
        description: form.description.trim(),
        targetDurationMinutes: Number(form.targetDurationMinutes) || 0,
      });
      setMsg(`"${form.name}" created.`);
      setForm({ name: '', description: '', targetDurationMinutes: '30' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create exercise.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (exercise) => {
    Alert.alert('Delete exercise?', `Delete "${exercise.name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExercise(exercise._id);
            setMsg('Exercise deleted.');
            load();
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete exercise.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Exercises</Text>

      <View style={styles.bannerWrap}>
        <Banner variant="danger">{error}</Banner>
        <Banner variant="success">{msg}</Banner>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(ex) => ex._id}
        ListHeaderComponent={
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              placeholderTextColor={colors.muted}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Target duration (minutes)"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={form.targetDurationMinutes}
              onChangeText={(v) => setForm((f) => ({ ...f, targetDurationMinutes: v }))}
            />
            <Pressable style={styles.button} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.buttonText}>Create Exercise</Text>}
            </Pressable>
            <Text style={styles.listLabel}>Your Exercises</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No exercises yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>{item.description}</Text>
              <Text style={styles.detail}>{item.targetDuration} min</Text>
            </View>
            <Pressable onPress={() => handleDelete(item)}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: shared.page,
  heading: { ...shared.heading, marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  bannerWrap: { marginHorizontal: 20 },
  form: { paddingHorizontal: 20, paddingBottom: 8 },
  input: { ...shared.input, padding: 12, marginBottom: 8, fontSize: 15 },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  button: { ...shared.buttonPrimary, padding: 14, marginTop: 4 },
  buttonText: shared.buttonPrimaryText,
  listLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 20, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  detail: { fontSize: 12, color: colors.muted, marginTop: 2 },
  deleteText: { color: colors.danger, fontWeight: '600', marginLeft: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
});
