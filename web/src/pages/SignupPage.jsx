import { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Athlete' });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signup(form);
      setStatus('Check your email to verify your account before logging in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Try again.');
    }
  };

  if (status) return <Container className="mt-5"><Alert variant="success">{status}</Alert></Container>;

  return (
    <Container className="mt-5" style={{ maxWidth: 420 }}>
      <h2 className="mb-4">Create your account</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>First Name</Form.Label>
          <Form.Control name="firstName" value={form.firstName} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Last Name</Form.Label>
          <Form.Control name="lastName" value={form.lastName} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" name="email" value={form.email} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
        </Form.Group>
        <Form.Group className="mb-4">
          <Form.Label>I am a...</Form.Label>
          <div>
            <Form.Check
              inline label="Coach" type="radio" name="role" value="Coach"
              checked={form.role === 'Coach'} onChange={handleChange}
            />
            <Form.Check
              inline label="Team Athlete" type="radio" name="role" value="Athlete"
              checked={form.role === 'Athlete'} onChange={handleChange}
            />
          </div>
        </Form.Group>
        <Button type="submit" className="w-100">Sign Up</Button>
      </Form>
      <div className="text-center mt-3">
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </Container>
  );
}
