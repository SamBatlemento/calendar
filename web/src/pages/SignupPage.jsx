import { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { resendVerification } from '../api/auth';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Athlete' });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [resendStatus, setResendStatus] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await signup(form);
      setStatus(data.message || 'Check your email to verify your account before logging in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Try again.');
    }
  };

  const handleResend = async () => {
    setResendStatus(null);
    try {
      const { data } = await resendVerification(form.email);
      setResendStatus(data.message);
    } catch {
      setResendStatus('Could not resend right now. Please try again in a few minutes.');
    }
  };

  if (status) {
  return (
    <main className="theme-page" aria-labelledby="signup-status-heading">
      <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
        <h2 id="signup-status-heading" className="visually-hidden">Signup status</h2>
        <Alert variant="success">{status}</Alert>

        <div className="theme-card text-start mt-3">
          <p className="theme-heading mb-3">Didn't get the email?</p>
          <Button className="theme-btn-outline w-100" size="sm" onClick={handleResend}>
            Resend verification email
          </Button>
          {resendStatus && <div className="theme-muted mt-2 text-center">{resendStatus}</div>}
        </div>

        <div className="mt-3">
          <Link to="/login" className="theme-link">Go to login</Link>
        </div>
      </Container>
    </main>
    );
  }

  return (
    <main className="theme-page" aria-labelledby="signup-heading">
      <Container style={{ maxWidth: 420 }}>
        <div className="theme-card">
          <h2 id="signup-heading" className="theme-heading mb-4">Create your account</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="signup-firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control name="firstName" value={form.firstName} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="signup-lastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control name="lastName" value={form.lastName} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="signup-email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={form.email} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="signup-password">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label id="role-group-label">I am a...</Form.Label>
              <div role="radiogroup" aria-labelledby="role-group-label">
                <Form.Check
                  inline label="Coach" type="radio" name="role" id="signup-role-coach" value="Coach"
                  checked={form.role === 'Coach'} onChange={handleChange}
                />
                <Form.Check
                  inline label="Team Athlete" type="radio" name="role" id="signup-role-athlete" value="Athlete"
                  checked={form.role === 'Athlete'} onChange={handleChange}
                />
              </div>
            </Form.Group>
            <Button type="submit" className="w-100 theme-btn-primary">Sign Up</Button>
          </Form>
          <div className="text-center mt-3 theme-muted">
            Already have an account? <Link to="/login" className="theme-link">Log in</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
