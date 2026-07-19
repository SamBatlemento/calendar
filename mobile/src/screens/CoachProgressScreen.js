import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import {
  getTeamMembers,
  getAssignmentsForMember,
  deleteAssignment,
} from '../api/assignments';
import IdChip from '../components/IdChip';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

export default function CoachProgressScreen() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [msg, setMsg] = useState(null);

  const loadMembers = useCallback(async () => {
    try {
      const { data } = await getTeamMembers();
      setTeamMembers(data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load team.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  const viewProgress = async (member) => {
    if (selectedMember?._id === member._id) {
      setSelectedMember(null);
      return;
    }
    try {
      const { data } = await getAssignmentsForMember(member._id);
      setSelectedMember(member);
      setAssignments(data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load progress.');
    }
  };

  const handleDelete = (assignmentId) => {
    Alert.alert('Delete assignment?', 'This also removes any logged time for it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAssignment(assignmentId);
            const { data } = await getAssignmentsForMember(selectedMember._id);
            setAssignments(data);
          } catch (err) {
            setMsg(err.response?.data?.error || 'Failed to delete assignment.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Team Progress</Text>
      <View style={styles.bannerWrap}>
        <Banner variant="danger">{msg}</Banner>
      </View>

      <FlatList
        data={teamMembers}
        keyExtractor={(m) => m._id}
        renderItem={({ item }) => (
          <View>
            <Pressable style={styles.memberRow} onPress={() => viewProgress(item)}>
              <Text style={styles.memberName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.memberToggle}>
                {selectedMember?._id === item._id ? 'Hide' : 'View'}
              </Text>
            </Pressable>

            {selectedMember?._id === item._id && (
              <View style={styles.assignmentList}>
                {assignments.length === 0 && (
                  <Text style={styles.empty}>No assignments yet.</Text>
                )}
                {assignments.map((a) => (
                  <View key={a._id} style={styles.assignmentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>
                        {a.exercise?.name || 'Unknown Exercise'}
                      </Text>
                      <Text style={styles.dueDate}>
                        Due {dayjs(a.dueDate).format('MMM D, YYYY')} ·{' '}
                        {a.completed ? '✓ Completed' : 'Not completed'}
                      </Text>
                      <IdChip id={a._id} label="Assignment" />
                    </View>
                    <Pressable onPress={() => handleDelete(a._id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...shared.page, paddingTop: 16 },
  heading: { ...shared.heading, marginHorizontal: 20, marginBottom: 12 },
  bannerWrap: { marginHorizontal: 20 },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberName: { fontSize: 16, fontWeight: '600', color: colors.text },
  memberToggle: { color: colors.accent, fontWeight: '600' },
  assignmentList: { backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 8 },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseName: { fontSize: 14, fontWeight: '600', color: colors.text },
  dueDate: { fontSize: 12, color: colors.muted, marginTop: 2, marginBottom: 6 },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 13, marginLeft: 12 },
  empty: { color: colors.muted, paddingVertical: 12 },
});
