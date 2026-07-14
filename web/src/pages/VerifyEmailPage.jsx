import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import client from '../api/client';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

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

  return (
    <Container className="mt-5 text-center" style={{ maxWidth: 420 }}>
      {status === 'loading' && <Spinner animation="border" />}
      {status !== 'loading' && (
        <Alert variant={status === 'success' ? 'success' : 'danger'}>{message}</Alert>
      )}
      <Link to="/login">Go to login</Link>
    </Container>
  );
}