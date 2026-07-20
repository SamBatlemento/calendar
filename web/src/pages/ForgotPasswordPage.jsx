import { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
    } catch {
      // Intentionally ignored: we show the same message regardless,
      // so we don't reveal whether the email exists.
    }
    setSent(true);
  };

  if (sent) {
    return (
      <main className="theme-page" aria-labelledby="forgot-status-heading">
        <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
          <h2 id="forgot-status-heading" className="visually-hidden">Reset link status</h2>
          <Alert variant="info">If that email exists, a reset link has been sent.</Alert>
          <Link to="/login" className="theme-link">Back to login</Link>
        </Container>
      </main>
    );
  }

  return (
    <main className="theme-page" aria-labelledby="forgot-heading">
      <Container style={{ maxWidth: 420 }}>
        <div className="theme-card">
          <h2 id="forgot-heading" className="theme-heading mb-4">Forgot Password</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="forgot-email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>
            <Button type="submit" className="w-100 theme-btn-primary">Send Reset Link</Button>
          </Form>
          <div className="text-center mt-3">
            <Link to="/login" className="theme-link">Back to login</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}