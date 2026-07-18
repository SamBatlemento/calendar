import { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getExercises, createExercise, deleteExercise } from '../api/assignments';

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

      {error && <Text style={styles.error}>{error}</Text>}
      {msg && <Text style={styles.msg}>{msg}</Text>}

      <FlatList
        data={exercises}
        keyExtractor={(ex) => ex._id}
        ListHeaderComponent={
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={2}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Target duration (minutes)"
              keyboardType="number-pad"
              value={form.targetDurationMinutes}
              onChangeText={(v) => setForm((f) => ({ ...f, targetDurationMinutes: v }))}
            />
            <Pressable style={styles.button} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Exercise</Text>}
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
  container: { flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '800', color: '#222', marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  error: { color: '#c0392b', marginHorizontal: 20, marginBottom: 8 },
  msg: { color: '#2f8f5b', marginHorizontal: 20, marginBottom: 8, fontWeight: '600' },
  form: { paddingHorizontal: 20, paddingBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 15 },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  button: { backgroundColor: '#1f4d3d', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700' },
  listLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 20, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: { fontSize: 15, fontWeight: '600', color: '#222' },
  detail: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteText: { color: '#c0392b', fontWeight: '600', marginLeft: 12 },
  empty: { color: '#888', textAlign: 'center', marginTop: 30 },
});
