import { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTeamMembers, addTeamAthlete, removeTeamMember } from '../api/assignments';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

export default function CoachTeamScreen() {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getTeamMembers();
      setMembers(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load team.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!email.trim()) return;
    setError(null);
    setMsg(null);
    setAdding(true);
    try {
      await addTeamAthlete(email.trim());
      setMsg(`Added ${email.trim()} to your team.`);
      setEmail('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add athlete.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (member) => {
    Alert.alert('Remove athlete?', `Remove ${member.firstName} ${member.lastName} from your team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTeamMember(member._id);
            setMsg('Athlete removed.');
            load();
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove athlete.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Team</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="athlete@email.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Pressable style={styles.addButton} onPress={handleAdd} disabled={adding}>
          {adding ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.addButtonText}>Add</Text>}
        </Pressable>
      </View>

      <Banner variant="danger">{error}</Banner>
      <Banner variant="success">{msg}</Banner>

      <FlatList
        data={members}
        keyExtractor={(m) => m._id}
        ListEmptyComponent={<Text style={styles.empty}>No athletes on your team yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <Pressable onPress={() => handleRemove(item)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...shared.page, padding: 20 },
  heading: { ...shared.heading, marginBottom: 16 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { ...shared.input, flex: 1, padding: 12 },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: colors.accentText, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  email: { fontSize: 12, color: colors.muted, marginTop: 2 },
  removeText: { color: colors.danger, fontWeight: '600' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
});
