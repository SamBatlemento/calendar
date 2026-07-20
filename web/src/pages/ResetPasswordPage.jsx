import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
import { resetPassword, validateResetToken } from '../api/auth';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [checking, setChecking] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const ranOnce = useRef(false); // StrictMode guard, same pattern as VerifyEmailPage

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    validateResetToken(token)
      .then(() => setLinkValid(true))
      .catch(() => setLinkValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may be invalid or expired.');
    }
  };

  // ---- State 1: still validating the link ----
  if (checking) {
    return (
      <main className="theme-page" aria-labelledby="reset-status-heading">
        <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
          <h2 id="reset-status-heading" className="visually-hidden">Checking reset link</h2>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Checking your reset link...</span>
          </Spinner>
        </Container>
      </main>
    );
  }

  // ---- State 2: link is invalid or expired ----
  if (!linkValid) {
    return (
      <main className="theme-page" aria-labelledby="reset-invalid-heading">
        <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
          <h2 id="reset-invalid-heading" className="visually-hidden">Reset link invalid</h2>
          <Alert variant="danger">
            This password reset link is invalid or has expired. Reset links are only valid
            for 30 minutes.
          </Alert>
          <Link to="/forgot-password" className="theme-link">Request a new reset link</Link>
          <div className="mt-3">
            <Link to="/login" className="theme-link">Back to login</Link>
          </div>
        </Container>
      </main>
    );
  }

  // ---- State 3: success (unchanged) ----
  if (success) {
    return (
      <main className="theme-page" aria-labelledby="reset-status-heading">
        <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
          <h2 id="reset-status-heading" className="visually-hidden">Password reset status</h2>
          <Alert variant="success">Password updated. Redirecting to login...</Alert>
        </Container>
      </main>
    );
  }

  // ---- State 4: valid link, show the form (unchanged) ----
  return (
    <main className="theme-page" aria-labelledby="reset-heading">
      <Container style={{ maxWidth: 420 }}>
        <div className="theme-card">
          <h2 id="reset-heading" className="theme-heading mb-4">Reset Password</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="reset-password">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={8}
              />
            </Form.Group>
            <Button type="submit" className="w-100 theme-btn-primary">Reset Password</Button>
          </Form>
          <div className="text-center mt-3">
            <Link to="/login" className="theme-link">Back to login</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}