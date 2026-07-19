import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { getExercises, getTeamMembers, assignExercise, bulkAssignExercise } from '../api/assignments';
import IdChip from '../components/IdChip';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

export default function CoachAssignScreen() {
  const [exercises, setExercises] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [lastAssignmentId, setLastAssignmentId] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadDropdowns = useCallback(async () => {
    try {
      const [ex, members] = await Promise.all([getExercises(), getTeamMembers()]);
      setExercises(ex.data);
      setTeamMembers(members.data);
      if (!exerciseId && ex.data[0]) setExerciseId(ex.data[0]._id);
      if (!athleteId && members.data[0]) setAthleteId(members.data[0]._id);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load exercises/athletes.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDropdowns();
    }, [loadDropdowns])
  );

  const handleAssign = async () => {
    if (!exerciseId || !athleteId) {
      setMsg('Pick an exercise and an athlete first.');
      return;
    }
    setMsg(null);
    setLastAssignmentId(null);
    try {
      const { data } = await assignExercise({
        exerciseId,
        athleteId,
        dueDate: dayjs(dueDate).toISOString(),
      });
      // Surfacing this ID is the whole point: the coach now has something concrete
      // to point to ("assignment #4F2A1C") instead of just a name + a due date.
      setLastAssignmentId(data.assignmentId);
      setMsg('Assigned.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to assign exercise.');
    }
  };

  const handleBulkAssign = () => {
    if (!exerciseId) {
      setMsg('Pick an exercise first.');
      return;
    }
    Alert.alert('Assign to entire team?', 'This creates one assignment per athlete on your team.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign',
        onPress: async () => {
          try {
            const { data } = await bulkAssignExercise({
              exerciseId,
              dueDate: dayjs(dueDate).toISOString(),
            });
            setMsg(data.message);
            setLastAssignmentId(null); // multiple ids created; see Team Progress for each one
          } catch (err) {
            setMsg(err.response?.data?.error || 'Failed to bulk assign.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>Assign Exercise</Text>

      <Banner variant="info">{msg}</Banner>
      {lastAssignmentId && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmLabel}>New assignment created:</Text>
          <IdChip id={lastAssignmentId} label="Assignment" />
        </View>
      )}

      <Text style={shared.label}>Exercise</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={exerciseId} onValueChange={setExerciseId} style={styles.picker} dropdownIconColor={colors.text}>
          {exercises.map((ex) => (
            <Picker.Item key={ex._id} label={ex.name} value={ex._id} />
          ))}
        </Picker>
      </View>

      <Text style={shared.label}>Athlete</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={athleteId} onValueChange={setAthleteId} style={styles.picker} dropdownIconColor={colors.text}>
          {teamMembers.map((m) => (
            <Picker.Item key={m._id} label={`${m.firstName} ${m.lastName}`} value={m._id} />
          ))}
        </Picker>
      </View>

      <Text style={shared.label}>Due Date</Text>
      <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateButtonText}>{dayjs(dueDate).format('dddd, MMMM D, YYYY')}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          onChange={(_, selected) => {
            setShowPicker(false);
            if (selected) setDueDate(selected);
          }}
        />
      )}

      <Pressable style={styles.button} onPress={handleAssign}>
        <Text style={styles.buttonText}>Assign to Selected Athlete</Text>
      </Pressable>
      <Pressable style={styles.buttonOutline} onPress={handleBulkAssign}>
        <Text style={styles.buttonOutlineText}>Assign to Entire Team</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: shared.page,
  heading: { ...shared.heading, marginBottom: 16 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  picker: { color: colors.text },
  dateButton: { ...shared.input, padding: 14 },
  dateButtonText: { fontSize: 15, color: colors.text },
  button: { ...shared.buttonPrimary, marginTop: 24 },
  buttonText: shared.buttonPrimaryText,
  buttonOutline: { ...shared.buttonOutline, marginTop: 10 },
  buttonOutlineText: shared.buttonOutlineText,
  confirmBox: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  confirmLabel: { fontSize: 12, color: colors.successText, marginBottom: 4, fontWeight: '600' },
});
