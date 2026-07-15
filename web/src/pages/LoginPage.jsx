import { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'Coach' ? '/coach' : '/athlete');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: 420 }}>
      <h2 className="mb-4">Log in</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required
          />
        </Form.Group>
        <Form.Group className="mb-4">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required
          />
        </Form.Group>
        <Button type="submit" className="w-100">Log In</Button>
      </Form>
      <div className="text-center mt-2">
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
      <div className="text-center mt-3">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
    </Container>
  );
}
