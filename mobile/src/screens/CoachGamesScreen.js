import { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { getGames, createGame, deleteGame } from '../api/assignments';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

export default function CoachGamesScreen() {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({ title: '', location: '' });
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getGames();
      const list = data.games || data;
      setGames([...list].sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load games.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError('A title is required.');
      return;
    }
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      await createGame({
        title: form.title.trim(),
        location: form.location.trim(),
        date: dayjs(date).toISOString(),
      });
      setMsg('Game added.');
      setForm({ title: '', location: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add game.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (game) => {
    Alert.alert('Delete game?', `Delete "${game.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGame(game._id);
            setMsg('Game deleted.');
            load();
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete game.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Games</Text>

      <View style={styles.bannerWrap}>
        <Banner variant="danger">{error}</Banner>
        <Banner variant="success">{msg}</Banner>
      </View>

      <FlatList
        data={games}
        keyExtractor={(g) => g._id}
        ListHeaderComponent={
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="e.g. vs. Riverside High"
              placeholderTextColor={colors.muted}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Location (optional)"
              placeholderTextColor={colors.muted}
              value={form.location}
              onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
            />
            <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
              <Text style={styles.dateButtonText}>{dayjs(date).format('dddd, MMMM D, YYYY')}</Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(_, selected) => {
                  setShowPicker(false);
                  if (selected) setDate(selected);
                }}
              />
            )}
            <Pressable style={styles.button} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.buttonText}>Add Game</Text>}
            </Pressable>
            <Text style={styles.listLabel}>Upcoming Games</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No games scheduled yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.detail}>{dayjs(item.date).format('MMM D, YYYY')}</Text>
              {item.location ? <Text style={styles.detail}>{item.location}</Text> : null}
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
  dateButton: { ...shared.input, padding: 14, marginBottom: 8 },
  dateButtonText: { fontSize: 15, color: colors.text },
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
