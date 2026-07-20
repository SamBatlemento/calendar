import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';
import { colors, shared } from '../theme';
import { resendVerification } from '../api/auth';
import Banner from '../components/Banner';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation swaps automatically once `user` is set in AuthContext.
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in. Check your connection.');
      setShowResend(err.response?.status === 403);
      setResendStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus(null);
    try {
      const { data } = await resendVerification(email.trim());
      setResendStatus(data.message);
    } catch {
      setResendStatus('Could not resend right now. Try again later.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Team Calendar</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <Banner variant="danger">{error}</Banner>

          {showResend && (
            <Pressable onPress={handleResend}>
              <Text style={styles.link}>Resend verification email</Text>
            </Pressable>
          )}

          <Banner variant="info">{resendStatus}</Banner>

          <Text style={shared.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={shared.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}>Need an account? Sign up</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.link}>Forgot your password?</Text>
          </Pressable>

          <Text style={styles.hint}>Connecting to {API_URL}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: shared.page,
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: shared.card,
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 20 },
  input: { ...shared.input, marginBottom: 12 },
  button: { ...shared.buttonPrimary, marginTop: 8, marginBottom: 4 },
  buttonText: shared.buttonPrimaryText,
  link: { ...shared.link, textAlign: 'center', marginTop: 12 },
  hint: { marginTop: 20, fontSize: 11, color: colors.muted, textAlign: 'center' },
});
