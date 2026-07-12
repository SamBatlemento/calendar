import { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { createExercise, assignExercise, addTeamMember } from '../api/assignments';

export default function CoachDashboard() {
  const [exercise, setExercise] = useState({ name: '', description: '', targetDurationMinutes: 30 });
  const [assignment, setAssignment] = useState({ exerciseId: '', memberId: '', dueDate: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [msg, setMsg] = useState(null);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    const { data } = await createExercise(exercise);
    setMsg(`Exercise "${data.name}" created.`);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    await assignExercise(assignment);
    setMsg('Assigned.');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    await addTeamMember(memberEmail);
    setMsg(`Added ${memberEmail} to your team.`);
    setMemberEmail('');
  };

  return (
    <Container className="mt-4">
      <h2>Coach Dashboard</h2>
      {msg && <Alert variant="info" onClose={() => setMsg(null)} dismissible>{msg}</Alert>}

      <Row className="mt-4">
        <Col md={4}>
          <h5>Add Team Member</h5>
          <Form onSubmit={handleAddMember}>
            <Form.Control
              className="mb-2" placeholder="member@email.com"
              value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required
            />
            <Button type="submit" size="sm">Add Member</Button>
          </Form>
        </Col>

        <Col md={4}>
          <h5>Create Exercise</h5>
          <Form onSubmit={handleCreateExercise}>
            <Form.Control
              className="mb-2" placeholder="Exercise name"
              value={exercise.name}
              onChange={(e) => setExercise({ ...exercise, name: e.target.value })} required
            />
            <Form.Control
              className="mb-2" placeholder="Description" as="textarea" rows={2}
              value={exercise.description}
              onChange={(e) => setExercise({ ...exercise, description: e.target.value })}
            />
            <Button type="submit" size="sm">Create</Button>
          </Form>
        </Col>

        <Col md={4}>
          <h5>Assign Exercise</h5>
          <Form onSubmit={handleAssign}>
            <Form.Control
              className="mb-2" placeholder="Exercise ID"
              value={assignment.exerciseId}
              onChange={(e) => setAssignment({ ...assignment, exerciseId: e.target.value })} required
            />
            <Form.Control
              className="mb-2" placeholder="Member ID"
              value={assignment.memberId}
              onChange={(e) => setAssignment({ ...assignment, memberId: e.target.value })} required
            />
            <Form.Control
              className="mb-2" type="date"
              value={assignment.dueDate}
              onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })} required
            />
            <Button type="submit" size="sm">Assign</Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
