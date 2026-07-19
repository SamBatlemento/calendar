import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { signup } from '../api/auth';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

// Underlying values stay exactly what the API expects ('Coach' | 'Athlete');
// only the display label for Athlete matches the web copy ("Team Athlete").
const ROLES = [
  { value: 'Coach', label: 'Coach' },
  { value: 'Athlete', label: 'Team Athlete' },
];

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Athlete',
  });
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSignup = async () => {
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      const { data } = await signup(form);
      setMsg(data.message || 'Account created. Check your email to verify it before signing in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>

          <Banner variant="danger">{error}</Banner>
          <Banner variant="success">{msg}</Banner>

          <Text style={shared.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={colors.muted}
            value={form.firstName}
            onChangeText={update('firstName')}
          />
          <Text style={shared.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={colors.muted}
            value={form.lastName}
            onChangeText={update('lastName')}
          />
          <Text style={shared.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={update('email')}
          />
          <Text style={shared.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={form.password}
            onChangeText={update('password')}
          />

          <Text style={[shared.label, styles.roleLabel]}>I am a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => {
              const selected = form.role === r.value;
              return (
                <Pressable
                  key={r.value}
                  style={styles.roleOption}
                  onPress={() => update('role')(r.value)}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.roleText}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: shared.page,
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: shared.card,
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 20 },
  input: { ...shared.input, marginBottom: 12 },
  roleLabel: { marginTop: 4, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 24, marginBottom: 22 },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.accent },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  roleText: { color: colors.text, fontSize: 15 },
  button: shared.buttonPrimary,
  buttonText: shared.buttonPrimaryText,
  link: { ...shared.link, textAlign: 'center', marginTop: 16 },
});
