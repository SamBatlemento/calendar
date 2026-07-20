import { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { getMyMeals, logMeal, updateMeal, deleteMeal } from '../api/assignments';
import { colors, shared, radii } from '../theme';
import Banner from '../components/Banner';

const MEAL_TIMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function AthleteMealsScreen() {
  const [viewDate, setViewDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [meals, setMeals] = useState([]);
  const [editingId, setEditingId] = useState(null); // null = creating a new meal
  const [form, setForm] = useState({ name: '', calories: '', time: 'Breakfast' });
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (date) => {
    try {
      const { data } = await getMyMeals(dayjs(date).format('YYYY-MM-DD'));
      setMeals(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load meals.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(viewDate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewDate])
  );

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', calories: '', time: 'Breakfast' });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.calories) {
      setError('Meal name and calories are required.');
      return;
    }
    setError(null);
    setMsg(null);
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      calories: form.calories,
      time: form.time,
      date: dayjs(viewDate).format('YYYY-MM-DD'),
    };
    try {
      if (editingId) {
        await updateMeal(editingId, payload);
        setMsg('Meal updated.');
      } else {
        await logMeal(payload);
        setMsg('Meal logged.');
      }
      resetForm();
      load(viewDate);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save meal.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (meal) => {
    setEditingId(meal._id);
    setForm({ name: meal.meal, calories: String(meal.calories), time: meal.time });
  };

  const handleDelete = (meal) => {
    Alert.alert('Delete meal?', `Delete "${meal.meal}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(meal._id);
            setMsg('Meal deleted.');
            if (editingId === meal._id) resetForm();
            load(viewDate);
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete meal.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Meal Log</Text>

      <View style={styles.dateRow}>
        <Pressable onPress={() => setViewDate(dayjs(viewDate).subtract(1, 'day').toDate())}>
          <Text style={styles.dateArrow}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{dayjs(viewDate).format('dddd, MMM D')}</Text>
        </Pressable>
        <Pressable onPress={() => setViewDate(dayjs(viewDate).add(1, 'day').toDate())}>
          <Text style={styles.dateArrow}>›</Text>
        </Pressable>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={viewDate}
          mode="date"
          onChange={(_, selected) => {
            setShowDatePicker(false);
            if (selected) setViewDate(selected);
          }}
        />
      )}

      <View style={styles.bannerWrap}>
        <Banner variant="danger">{error}</Banner>
        <Banner variant="success">{msg}</Banner>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(m) => m._id}
        ListHeaderComponent={
          <View style={styles.form}>
            {editingId && <Text style={styles.editingLabel}>Editing meal</Text>}
            <TextInput
              style={styles.input}
              placeholder="Meal name"
              placeholderTextColor={colors.muted}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Calories"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={form.calories}
              onChangeText={(v) => setForm((f) => ({ ...f, calories: v }))}
            />
            <View style={styles.segmented}>
              {MEAL_TIMES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setForm((f) => ({ ...f, time: t }))}
                  style={[styles.segment, form.time === t && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, form.time === t && styles.segmentTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formButtons}>
              <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={colors.accentText} />
                ) : (
                  <Text style={styles.buttonText}>{editingId ? 'Save Changes' : 'Log Meal'}</Text>
                )}
              </Pressable>
              {editingId && (
                <Pressable style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.listLabel}>Meals for this day</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No meals logged for this day.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.meal} · {item.calories} cal
              </Text>
              <Text style={styles.detail}>{item.time}</Text>
            </View>
            <Pressable onPress={() => handleEdit(item)}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
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
  bannerWrap: { marginHorizontal: 20 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginHorizontal: 20, marginTop: 16 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 12,
  },
  dateArrow: { fontSize: 24, color: colors.accent, paddingHorizontal: 8 },
  dateText: { fontSize: 16, fontWeight: '600', color: colors.text },
  form: { paddingHorizontal: 20, paddingBottom: 8 },
  editingLabel: { fontSize: 12, color: colors.accent, fontWeight: '700', marginBottom: 6 },
  input: { ...shared.input, padding: 12, marginBottom: 8, fontSize: 15 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    padding: 4,
    marginBottom: 12,
  },
  segment: { flex: 1, paddingVertical: 8, borderRadius: radii.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  segmentTextActive: { color: colors.accentText },
  formButtons: { flexDirection: 'row', gap: 8 },
  button: { ...shared.buttonPrimary, flex: 1, padding: 14 },
  buttonText: shared.buttonPrimaryText,
  cancelButton: { ...shared.buttonOutline, flex: 1, padding: 14 },
  cancelButtonText: shared.buttonOutlineText,
  listLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 20, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  detail: { fontSize: 12, color: colors.muted, marginTop: 2 },
  editText: { color: colors.accent, fontWeight: '600' },
  deleteText: { color: colors.danger, fontWeight: '600' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
});
