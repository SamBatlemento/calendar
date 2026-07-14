import { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
    setSent(true); // always show this, even on failure — don't reveal whether an email exists
  };

  if (sent) {
    return (
      <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
        <Alert variant="info">If that email exists, a reset link has been sent.</Alert>
        <Link to="/login">Back to login</Link>
      </Container>
    );
  }

  return (
    <Container className="mt-5" style={{ maxWidth: 420 }}>
      <h2 className="mb-4">Forgot Password</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-4">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>
        <Button type="submit" className="w-100">Send Reset Link</Button>
      </Form>
      <div className="text-center mt-3">
        <Link to="/login">Back to login</Link>
      </div>
    </Container>
  );
}