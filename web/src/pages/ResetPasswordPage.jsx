import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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