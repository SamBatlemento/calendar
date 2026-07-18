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

const ROLES = ['Athlete', 'Coach'];

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>

        {error && <Text style={styles.error}>{error}</Text>}
        {msg && <Text style={styles.success}>{msg}</Text>}

        <TextInput
          style={styles.input}
          placeholder="First name"
          value={form.firstName}
          onChangeText={update('firstName')}
        />
        <TextInput
          style={styles.input}
          placeholder="Last name"
          value={form.lastName}
          onChangeText={update('lastName')}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={update('email')}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={form.password}
          onChangeText={update('password')}
        />

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r}
              style={[styles.roleButton, form.role === r && styles.roleButtonActive]}
              onPress={() => update('role')(r)}
            >
              <Text style={form.role === r ? styles.roleTextActive : styles.roleText}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#1f4d3d', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f4d3d',
    alignItems: 'center',
  },
  roleButtonActive: { backgroundColor: '#1f4d3d' },
  roleText: { color: '#1f4d3d', fontWeight: '600' },
  roleTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#1f4d3d', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#1f4d3d', textAlign: 'center', fontWeight: '600' },
  error: { color: '#c0392b', textAlign: 'center', marginBottom: 12 },
  success: { color: '#2f8f5b', textAlign: 'center', marginBottom: 12 },
});
