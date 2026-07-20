import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Alert, Spinner, Form, Button } from 'react-bootstrap';
import client from '../api/client';
import { resendVerification } from '../api/auth';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null);

  useEffect(() => {
    client.post('/verify-email', { token })
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. You can now log in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus(null);
    try {
      const { data } = await resendVerification(resendEmail);
      setResendStatus(data.message);
    } catch {
      setResendStatus('Could not resend right now. Please try again in a few minutes.');
    }
  };

  return (
    <main className="theme-page" aria-labelledby="verify-heading">
      <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
        <h2 id="verify-heading" className="visually-hidden">Email verification status</h2>

        {status === 'loading' && <Spinner animation="border" role="status">
          <span className="visually-hidden">Verifying your email...</span>
        </Spinner>}

        {status !== 'loading' && (
          <Alert variant={status === 'success' ? 'success' : 'danger'}>{message}</Alert>
        )}

        {status === 'error' && (
          <div className="theme-card text-start mt-3 mb-3">
            <p className="theme-heading mb-3">Need a new link?</p>
            <Form onSubmit={handleResend} className="d-flex gap-2 mb-2">
              <Form.Group controlId="resend-verify-email" className="mb-0 flex-grow-1">
                <Form.Label className="visually-hidden">Email</Form.Label>
                <Form.Control
                  type="email" placeholder="your@email.com"
                  value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} required
                />
              </Form.Group>
              <Button type="submit" size="sm" className="theme-btn-primary">Resend</Button>
            </Form>
            {resendStatus && <div className="theme-muted mb-2">{resendStatus}</div>}
            <div className="theme-muted">
              Or, if you've forgotten your password too: <Link to="/forgot-password" className="theme-link">reset it</Link>
            </div>
          </div>
        )}

        <Link to="/login" className="theme-link">Go to login</Link>
      </Container>
    </main>
  );
}