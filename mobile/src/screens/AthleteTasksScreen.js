import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyAssignments } from '../api/assignments';
import TaskCard from '../components/TaskCard';
import { colors, shared, radii } from '../theme';
import Banner from '../components/Banner';
import dayjs from 'dayjs';

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'all', label: 'All' },
];

// This screen replaces "tap the right day cell on a mini calendar" with a plain, scrollable
// list of tasks. Every row is a full-width card you can't miss or mis-tap, sorted so the
// nearest due date is always first — the athlete never has to hunt for the right square.
export default function AthleteTasksScreen({ navigation }) {
  const [filter, setFilter] = useState('today');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getMyAssignments(
        filter === 'today'
          ? { date: dayjs().format('YYYY-MM-DD') }
          : { filter: filter === 'all' ? undefined : filter }
      );
      const sorted = [...data].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setAssignments(sorted);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Refresh every time the tab regains focus, e.g. after logging time on the detail screen.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.segmented}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.segment, filter === f.key && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, filter === f.key && styles.segmentTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.bannerWrap}>
        <Banner variant="danger">{error}</Banner>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>Nothing due {filter === 'all' ? '' : filter}. Nice work!</Text>
          )
        }
        renderItem={({ item }) => (
          <TaskCard
            assignment={item}
            onPress={(a) => navigation.navigate('TaskDetail', { assignment: a })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: shared.page,
  bannerWrap: { paddingHorizontal: 16 },
  segmented: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    padding: 4,
  },
  segment: { flex: 1, paddingVertical: 8, borderRadius: radii.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  segmentTextActive: { color: colors.accentText },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
