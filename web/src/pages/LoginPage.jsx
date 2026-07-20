import { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerification } from '../api/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'Coach' ? '/coach' : '/athlete');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
      setShowResend(err.response?.status === 403);
      setResendStatus(null);
    }
  };

  const handleResend = async () => {
    setResendStatus(null);
    try{
      const { data } = await resendVerification(form.email);
      setResendStatus(data.message);
    } catch {
      setResendStatus('Could not resend right now. Please try again in a few minutes.');
    }
  }

  return (
    <main className="theme-page" aria-labelledby="login-heading">
      <Container style={{ maxWidth: 420 }}>
        <div className="theme-card">
          <h2 id="login-heading" className="theme-heading mb-4">Log in</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {showResend && (
            <div className="text-center mb-3">
              <Button size="sm" className="theme-btn-outline" onClick={handleResend}>
                Resend verification email
              </Button>
              {resendStatus && <div className="theme-muted mt-2">{resendStatus}</div>}
            </div>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="login-email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="login-password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required
              />
            </Form.Group>
            <Button type="submit" className="w-100 theme-btn-primary">Log In</Button>
          </Form>
          <div className="text-center mt-2">
            <Link to="/forgot-password" className="theme-link">Forgot password?</Link>
          </div>
          <div className="text-center mt-3 theme-muted">
            Don't have an account? <Link to="/signup" className="theme-link">Sign up</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
