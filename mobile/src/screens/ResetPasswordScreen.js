import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { resetPassword } from '../api/auth';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

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
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>
          Paste the token from the end of your reset link (the part after /reset-password/).
        </Text>

        <Banner variant="danger">{error}</Banner>
        <Banner variant="success">{msg}</Banner>

        <Text style={shared.label}>Reset token</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={token}
          onChangeText={setToken}
        />
        <Text style={shared.label}>New password</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Back to sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { ...shared.page, justifyContent: 'center', padding: 24 },
  card: shared.card,
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 20 },
  input: { ...shared.input, marginBottom: 12 },
  button: { ...shared.buttonPrimary, marginBottom: 16 },
  buttonText: shared.buttonPrimaryText,
  link: shared.link,
});
