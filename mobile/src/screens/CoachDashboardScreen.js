import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import {
  getExercises,
  getTeamMembers,
  getGames,
  createExercise,
  addTeamAthlete,
  assignExercise,
  createGame,
} from '../api/assignments';

export default function CoachDashboardScreen() {
  const { user, logout } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [members, setMembers] = useState([]);
  const [games, setGames] = useState([]);
  const [msg, setMsg] = useState(null);

  const [exerciseForm, setExerciseForm] = useState({ name: '', description: '', targetDurationMinutes: '30' });
  const [athleteEmail, setAthleteEmail] = useState('');
  const [gameForm, setGameForm] = useState({ title: '', location: '', date: '' });
  const [assignForm, setAssignForm] = useState({ exerciseId: '', athleteId: '', dueDate: '' });

  const loadAll = useCallback(async () => {
    try {
      const [ex, tm, gm] = await Promise.all([getExercises(), getTeamMembers(), getGames()]);
      setExercises(ex.data);
      setMembers(tm.data);
      setGames(gm.data.games || gm.data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load dashboard data.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const handleCreateExercise = async () => {
    try {
      await createExercise({
        name: exerciseForm.name,
        description: exerciseForm.description,
        targetDurationMinutes: Number(exerciseForm.targetDurationMinutes) || 0,
      });
      setExerciseForm({ name: '', description: '', targetDurationMinutes: '30' });
      loadAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create exercise.');
    }
  };

  const handleAddAthlete = async () => {
    try {
      await addTeamAthlete(athleteEmail.trim());
      setAthleteEmail('');
      loadAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add athlete.');
    }
  };

  const handleAssign = async () => {
    try {
      await assignExercise({
        exerciseId: assignForm.exerciseId,
        athleteId: assignForm.athleteId,
        dueDate: dayjs(assignForm.dueDate).isValid() ? dayjs(assignForm.dueDate).toISOString() : assignForm.dueDate,
      });
      Alert.alert('Assigned', 'Exercise assigned.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to assign exercise.');
    }
  };

  const handleCreateGame = async () => {
    try {
      await createGame(gameForm);
      setGameForm({ title: '', location: '', date: '' });
      loadAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create game.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Coach Dashboard{user ? ` - ${user.firstName}` : ''}</Text>
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
        ListEmptyComponent={<Text style={styles.empty}>No games scheduled yet.</Text>}
      />
      <TextInput style={styles.input} placeholder="Game title" value={gameForm.title} onChangeText={(v) => setGameForm((f) => ({ ...f, title: v }))} />
      <TextInput style={styles.input} placeholder="Location" value={gameForm.location} onChangeText={(v) => setGameForm((f) => ({ ...f, location: v }))} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD HH:mm)" value={gameForm.date} onChangeText={(v) => setGameForm((f) => ({ ...f, date: v }))} />
      <TouchableOpacity style={styles.button} onPress={handleCreateGame}>
        <Text style={styles.buttonText}>Add Game</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Team Members</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.firstName} {item.lastName} - {item.email}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No team members yet.</Text>}
      />
      <TextInput
        style={styles.input}
        placeholder="Athlete email to add"
        autoCapitalize="none"
        value={athleteEmail}
        onChangeText={setAthleteEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddAthlete}>
        <Text style={styles.buttonText}>Add Athlete</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Exercises</Text>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exercises yet.</Text>}
      />
      <TextInput style={styles.input} placeholder="Exercise name" value={exerciseForm.name} onChangeText={(v) => setExerciseForm((f) => ({ ...f, name: v }))} />
      <TextInput style={styles.input} placeholder="Description" value={exerciseForm.description} onChangeText={(v) => setExerciseForm((f) => ({ ...f, description: v }))} />
      <TextInput
        style={styles.input}
        placeholder="Target duration (minutes)"
        keyboardType="numeric"
        value={exerciseForm.targetDurationMinutes}
        onChangeText={(v) => setExerciseForm((f) => ({ ...f, targetDurationMinutes: v }))}
      />
      <TouchableOpacity style={styles.button} onPress={handleCreateExercise}>
        <Text style={styles.buttonText}>Create Exercise</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Assign Exercise</Text>
      <TextInput style={styles.input} placeholder="Exercise ID" value={assignForm.exerciseId} onChangeText={(v) => setAssignForm((f) => ({ ...f, exerciseId: v }))} />
      <TextInput style={styles.input} placeholder="Athlete ID" value={assignForm.athleteId} onChangeText={(v) => setAssignForm((f) => ({ ...f, athleteId: v }))} />
      <TextInput style={styles.input} placeholder="Due date (YYYY-MM-DD)" value={assignForm.dueDate} onChangeText={(v) => setAssignForm((f) => ({ ...f, dueDate: v }))} />
      <TouchableOpacity style={styles.button} onPress={handleAssign}>
        <Text style={styles.buttonText}>Assign</Text>
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
  empty: { color: '#6b7280', fontStyle: 'italic', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 4 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 12 },
});
