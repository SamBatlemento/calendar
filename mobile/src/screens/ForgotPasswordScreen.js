import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { forgotPassword } from '../api/auth';
import { colors, shared } from '../theme';
import Banner from '../components/Banner';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setMsg('If that email exists on an account, a reset link has been sent to it.');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the email on your account and we'll send a reset link.</Text>

        <Banner variant="danger">{error}</Banner>
        <Banner variant="success">{msg}</Banner>

        <Text style={shared.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={styles.link}>Already have a reset link? Enter it here</Text>
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
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 20 },
  input: { ...shared.input, marginBottom: 12 },
  button: { ...shared.buttonPrimary, marginBottom: 16 },
  buttonText: shared.buttonPrimaryText,
  link: { ...shared.link, textAlign: 'center', marginTop: 8 },
});
