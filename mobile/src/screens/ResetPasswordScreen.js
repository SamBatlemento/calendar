import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { resetPassword } from '../api/auth';

// The reset email links to CLIENT_URL/reset-password/<token> (the web app), since this mobile
// app doesn't have a deep link registered for that URL yet. The token is the last part of that
// link, so we ask the person to paste just that part in here.
export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setMsg('Password reset. You can sign in with your new password now.');
      setToken('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>
        Paste the token from the end of your reset link (the part after /reset-password/).
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {msg && <Text style={styles.success}>{msg}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Reset token"
        autoCapitalize="none"
        value={token}
        onChangeText={setToken}
      />
      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '800', color: '#1f4d3d', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#1f4d3d', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#1f4d3d', textAlign: 'center', fontWeight: '600' },
  error: { color: '#c0392b', textAlign: 'center', marginBottom: 12 },
  success: { color: '#2f8f5b', textAlign: 'center', marginBottom: 12 },
});
