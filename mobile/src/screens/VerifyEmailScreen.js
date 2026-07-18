import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { verifyEmail } from '../api/auth';

export default function VerifyEmailScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      await verifyEmail(token.trim());
      setMsg('Email verified! You can log in now.');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {msg && <Text style={styles.success}>{msg}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Verification token (from your email link)"
        autoCapitalize="none"
        value={token}
        onChangeText={setToken}
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 16 },
  error: { color: '#dc2626', textAlign: 'center', marginBottom: 12 },
  success: { color: '#16a34a', textAlign: 'center', marginBottom: 12 },
});
