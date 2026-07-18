import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { getMyAssignments, getGames, getMyMeals, logExerciseTime, logMeal } from '../api/assignments';

export default function AthleteDashboardScreen() {
  const { user, logout } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [games, setGames] = useState([]);
  const [meals, setMeals] = useState([]);
  const [msg, setMsg] = useState(null);

  const [logForm, setLogForm] = useState({ assignmentId: '', minutes: '' });
  const [mealForm, setMealForm] = useState({ name: '', calories: '', time: '', date: '' });

  const loadAll = useCallback(async () => {
    try {
      const [as, gm, ml] = await Promise.all([getMyAssignments(), getGames(), getMyMeals()]);
      setAssignments(as.data);
      setGames(gm.data.games || gm.data);
      setMeals(ml.data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load dashboard data.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const handleLogExercise = async () => {
    try {
      await logExerciseTime(logForm.assignmentId, Number(logForm.minutes) || 0);
      setLogForm({ assignmentId: '', minutes: '' });
      loadAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to log exercise time.');
    }
  };

  const handleLogMeal = async () => {
    try {
      await logMeal(mealForm);
      setMealForm({ name: '', calories: '', time: '', date: '' });
      loadAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to log meal.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Athlete Dashboard{user ? ` - ${user.firstName}` : ''}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>
      {msg && <Text style={styles.error}>{msg}</Text>}

      <Text style={styles.section}>Upcoming Games</Text>
      <FlatList
        data={games}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text>{item.location}</Text>
            <Text>{dayjs(item.date).format('MMM D, YYYY h:mm A')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No games scheduled.</Text>}
      />

      <Text style={styles.section}>My Assignments</Text>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.exercise?.name || 'Exercise'}</Text>
            <Text>Due: {dayjs(item.dueDate).format('MMM D, YYYY')}</Text>
            <Text style={styles.idHint}>id: {item._id}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No assignments yet.</Text>}
      />
      <TextInput
        style={styles.input}
        placeholder="Assignment ID (tap card above to copy)"
        value={logForm.assignmentId}
        onChangeText={(v) => setLogForm((f) => ({ ...f, assignmentId: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Minutes completed"
        keyboardType="numeric"
        value={logForm.minutes}
        onChangeText={(v) => setLogForm((f) => ({ ...f, minutes: v }))}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogExercise}>
        <Text style={styles.buttonText}>Log Exercise Time</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Meal Log</Text>
      <FlatList
        data={meals}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.meal} - {item.calories} cal</Text>
            <Text>{item.time} {item.date ? `- ${dayjs(item.date).format('MMM D')}` : ''}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No meals logged yet.</Text>}
      />
      <TextInput style={styles.input} placeholder="Meal name" value={mealForm.name} onChangeText={(v) => setMealForm((f) => ({ ...f, name: v }))} />
      <TextInput style={styles.input} placeholder="Calories" keyboardType="numeric" value={mealForm.calories} onChangeText={(v) => setMealForm((f) => ({ ...f, calories: v }))} />
      <TextInput style={styles.input} placeholder="Time (e.g. 12:30 PM)" value={mealForm.time} onChangeText={(v) => setMealForm((f) => ({ ...f, time: v }))} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={mealForm.date} onChangeText={(v) => setMealForm((f) => ({ ...f, date: v }))} />
      <TouchableOpacity style={styles.button} onPress={handleLogMeal}>
        <Text style={styles.buttonText}>Log Meal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  logout: { color: '#dc2626', fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardTitle: { fontWeight: '600' },
  idHint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  empty: { color: '#6b7280', fontStyle: 'italic', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 4 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 12 },
});
