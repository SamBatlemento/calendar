import { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, ListGroup, Badge, Modal } from 'react-bootstrap';
import { createExercise, assignExercise, addTeamAthlete, getExercises, getTeamMembers, 
  getAssignmentsForMember, updateExercise, deleteExercise, removeTeamMember, updateAssignmentDueDate, 
  deleteAssignment, bulkAssignExercise, createGame } from '../api/assignments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

export default function CoachDashboard() {
  const [exercise, setExercise] = useState({ name: '', description: '', targetDurationMinutes: 30 });
  const [assignment, setAssignment] = useState({ exerciseId: '', athleteId: '', dueDate: '' });
  const [athleteEmail, setAthleteEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProgressMember, setSelectedProgressMember] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingDueDate, setEditingDueDate] = useState({});
  const [games, setGame] = useState({ title: '', location: '', date: '' });
  
  const handleLogout = () => {
  logout();
  navigate('/login');
  };

  const loadDropdownData = async () => {
    try {
      const exercisesResponse = await getExercises();
      const membersResponse = await getTeamMembers();

      setExercises(exercisesResponse.data);
      setTeamMembers(membersResponse.data);
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Failed loading dashboard data");
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    try
    {
      await createExercise(exercise);
      setMsg(`Exercise "${exercise.name}" created.`);
      setExercise({ name: '', description: '', targetDurationMinutes: 30});
      loadDropdownData();
    }catch (err)
    {
      setMsg(err.response?.data?.error || 'Failed to create exercise');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try{
      await assignExercise({...assignment, dueDate: parseLocalDate(assignment.dueDate).toISOString(),});
      setMsg('Assigned.');
      if (selectedProgressMember?.member._id === assignment.athleteId) 
      {
      refreshProgress();
      }
    }catch (err)
    {
      setMsg(err.response?.data?.error || 'Failed to assign exercise.');
    }
  };

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    try
    {
      await addTeamAthlete(athleteEmail);
      setMsg(`Added ${athleteEmail} to your team.`);
      setAthleteEmail('');
      loadDropdownData();
    }catch (err)
    {
      setMsg(err.response?.data?.error || 'Failed to add athlete.');
    }
  };

  const viewProgress = async (member) => {
    try {
    if (selectedProgressMember?.member._id === member._id) {
      setSelectedProgressMember(null);
      return;
    }
    const { data } = await getAssignmentsForMember(member._id);
    setSelectedProgressMember({ member, assignments: data });
    } catch(err) {
    setMsg(err.response?.data?.error || "Failed loading progress");
    }
  };

  const handleRemoveAthlete = async (memberId) => {
    if (!window.confirm('Remove this athlete from your team?')) return;
    try {
      await removeTeamMember(memberId);
      setMsg('Athlete removed.');
      setSelectedProgressMember(null); // clear in case you were viewing this athlete's progress
      loadDropdownData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to remove athlete.');
    }
  };

  const handleUpdateExercise = async (e) => {
    e.preventDefault();
    try {
      await updateExercise(editingExercise._id, {
        name: editingExercise.name,
        description: editingExercise.description,
        targetDurationMinutes: editingExercise.targetDurationMinutes,
      });
      setMsg('Exercise updated.');
      setEditingExercise(null);
      loadDropdownData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to update exercise.');
    }
  };

  const handleDeleteExercise = async (id) => {
    try {
      await deleteExercise(id);
      setMsg('Exercise deleted.');
      loadDropdownData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to delete exercise.');
    }
  };

  const refreshProgress = async () => {
    if (!selectedProgressMember) return;
    const { data } = await getAssignmentsForMember(selectedProgressMember.member._id);
    setSelectedProgressMember({ ...selectedProgressMember, assignments: data });
  };

  const handleUpdateDueDate = async (assignmentId) => {
    try {
      await updateAssignmentDueDate(assignmentId, editingDueDate[assignmentId]);
      setMsg('Due date updated.');
      setEditingDueDate({ ...editingDueDate, [assignmentId]: undefined });
      refreshProgress();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to update due date.');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Delete this assignment? This also removes any logged time for it.')) return;
    try {
      await deleteAssignment(assignmentId);
      setMsg('Assignment deleted.');
      refreshProgress();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to delete assignment.');
    }
  };

  const handleBulkAssign = async () => {
    if (!assignment.exerciseId || !assignment.dueDate) {
      setMsg('Select an exercise and due date first.');
      return;
    }
    if (!window.confirm('Assign this exercise to your entire team?')) return;
    try {
      const { data } = await bulkAssignExercise({
        exerciseId: assignment.exerciseId,
        dueDate: parseLocalDate(assignment.dueDate).toISOString(),
      });
      setMsg(data.message);
      refreshProgress();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to bulk assign.');
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      await createGame({ ...games, date: parseLocalDate(games.date).toISOString() });
      setMsg('Game date added.');
      setGame({ title: '', location: '', date: '' });
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to add game date.');
    }
  };

  function parseLocalDate(dateInput) {
    if (!dateInput) return null;
    const datePart = typeof dateInput === 'string' ? dateInput.split('T')[0] : dayjs(dateInput).format('YYYY-MM-DD');
    return new Date(`${datePart}T00:00:00`);
  }

  return (
    <Container className="mt-4">
      <h2>Coach Dashboard</h2>
      {msg && <Alert variant="info" onClose={() => setMsg(null)} dismissible>{msg}</Alert>}

      <Row className="mt-4">
        <Col md={4}>
          <h5>Add Team Athlete</h5>
          <Form onSubmit={handleAddAthlete}>
            <Form.Control
              className="mb-2" placeholder="athlete@email.com"
              value={athleteEmail} onChange={(e) => setAthleteEmail(e.target.value)} required
            />
            <Button type="submit" size="sm">Add Athlete</Button>
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
              <Form.Control
                className="mb-2" type="number" placeholder="Target duration (minutes)"
                value={exercise.targetDurationMinutes}
                onChange={(e) => setExercise({ ...exercise, targetDurationMinutes: Number(e.target.value) })}
                required
              />
            <Button type="submit" size="sm">Create</Button>
          </Form>
        </Col>

        <Col md={4}>
          <h5>Assign Exercise</h5>
          <Form onSubmit={handleAssign}>
            <Form.Select
              className="mb-2" value={assignment.exerciseId}
              onChange={(e) => setAssignment({ ...assignment, exerciseId: e.target.value })} required
            >
              <option value="">Select exercise...</option>
              {exercises.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.name}</option>
              ))}
            </Form.Select>
            <Form.Select
              className="mb-2" value={assignment.athleteId}
              onChange={(e) => setAssignment({ ...assignment, athleteId: e.target.value })} required
            >
              <option value="">Select athlete...</option>
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
              ))}
            </Form.Select>
            <Form.Control
              className="mb-2" type="date"
              value={assignment.dueDate}
              onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })} required
            />
            <div className="d-flex gap-2">
              <Button type="submit" size="sm">Assign to Selected Athlete</Button>
              <Button type="button" size="sm" variant="outline-secondary" onClick={handleBulkAssign}>
                Assign to Entire Team
              </Button>
            </div>
          </Form>
        </Col>
      </Row>

        <hr className="my-4" />
        <h5>Manage Exercises</h5>
        <ListGroup className="mb-3">
          {exercises.map((ex) => (
            <ListGroup.Item key={ex._id} className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{ex.name}</strong>
                <span className="text-muted ms-2">{ex.targetDuration} min</span>
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" variant="outline-secondary" onClick={() => 
                  setEditingExercise({ ...ex, targetDurationMinutes: ex.targetDuration })}>
                  Edit
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => handleDeleteExercise(ex._id)}>
                  Delete
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <Modal show={!!editingExercise} onHide={() => setEditingExercise(null)}>
          <Modal.Header closeButton><Modal.Title>Edit Exercise</Modal.Title></Modal.Header>
          <Modal.Body>
            {editingExercise && (
              <Form onSubmit={handleUpdateExercise}>
                <Form.Group className="mb-2">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea" rows={2}
                    value={editingExercise.description}
                    onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Target Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editingExercise.targetDurationMinutes}
                    onChange={(e) => setEditingExercise({ ...editingExercise, targetDurationMinutes: Number(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Button type="submit" size="sm">Save Changes</Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>

      <hr className="my-4" />

      <h5>Team Progress</h5>
      <ListGroup className="mb-3">
        {teamMembers.map((m) => (
          <ListGroup.Item key={m._id} className="d-flex justify-content-between align-items-center">
            {m.firstName} {m.lastName}
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={() => viewProgress(m)}>
                View Progress
              </Button>
              <Button size="sm" variant="outline-danger" onClick={() => handleRemoveAthlete(m._id)}>
                Remove
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>

      {selectedProgressMember && (
        <div>
          <div className="d-flex justify-content-between align-items-center">
            <h6>{selectedProgressMember.member.firstName}'s Assignments</h6>
          </div>
          <ListGroup>
            {selectedProgressMember.assignments.map((a) => (
              <ListGroup.Item key={a._id} className="d-flex justify-content-between align-items-center">
                <div>
                  {a.exercise?.name || "Unknown Exercise"} — due {parseLocalDate(a.dueDate).toLocaleDateString()}
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Badge bg={a.completed ? 'success' : 'secondary'}>
                    {a.completed ? 'Completed' : 'Not completed'}
                  </Badge>
                  {!a.completed && (
                    <>
                      <Form.Control
                        size="sm" type="date" style={{ width: 150 }}
                        value={editingDueDate[a._id] ?? ''}
                        onChange={(e) => setEditingDueDate({ ...editingDueDate, [a._id]: e.target.value })}
                      />
                      <Button size="sm" variant="outline-secondary" onClick={() => handleUpdateDueDate(a._id)}>
                        Update
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAssignment(a._id)}>
                    Delete
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}

      <Col md={4}>
        <h5>Add Game Date</h5>
        <Form onSubmit={handleCreateGame}>
          <Form.Control
            className="mb-2" placeholder="e.g. vs. Riverside High"
            value={games.title}
            onChange={(e) => setGame({ ...games, title: e.target.value })} required
          />
          <Form.Control
            className="mb-2" placeholder="Location (optional)"
            value={games.location}
            onChange={(e) => setGame({ ...games, location: e.target.value })}
          />
          <Form.Control
            className="mb-2" type="date"
            value={games.date}
            onChange={(e) => setGame({ ...games, date: e.target.value })} required
          />
          <Button type="submit" size="sm">Add Game</Button>
        </Form>
      </Col>

      <Button variant="outline-secondary" size="sm" onClick={handleLogout}>Sign Out</Button>
    </Container>
  );
}
