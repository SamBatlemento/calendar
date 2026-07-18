import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { getGames } from '../api/assignments';

export default function AthleteGamesScreen() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getGames();
      const list = data.games || data;
      setGames([...list].sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load games.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Games</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={games}
        keyExtractor={(g) => g._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No games scheduled yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>🏆 {item.title}</Text>
            <Text style={styles.detail}>{dayjs(item.date).format('dddd, MMMM D, YYYY')}</Text>
            {item.location ? <Text style={styles.detail}>{item.location}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8f7' },
  heading: { fontSize: 22, fontWeight: '800', color: '#222', marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  error: { color: '#c0392b', marginHorizontal: 20, marginBottom: 8 },
  card: {
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
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1f4d3d' },
  detail: { fontSize: 13, color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
