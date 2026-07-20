import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { getGames } from '../api/assignments';
import { colors, shared, radii } from '../theme';
import Banner from '../components/Banner';

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
      <View style={styles.bannerWrap}>
        <Banner variant="danger">{error}</Banner>
      </View>
      <FlatList
        data={games}
        keyExtractor={(g) => g._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />
        }
        ListEmptyComponent={!loading && <Text style={styles.empty}>No games scheduled yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>🏆 {item.title}</Text>
            <Text style={styles.detail}>{dayjs(String(item.date).slice(0, 10)).format('dddd, MMMM D, YYYY')}</Text>
            {item.location ? <Text style={styles.detail}>{item.location}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: shared.page,
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  bannerWrap: { marginHorizontal: 20 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.accent },
  detail: { fontSize: 13, color: colors.muted, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
