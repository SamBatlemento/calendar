import { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, ListGroup, Badge, Modal } from 'react-bootstrap';
import { createExercise, assignExercise, addTeamAthlete, getExercises, getTeamMembers, 
  getAssignmentsForMember, updateExercise, deleteExercise, removeTeamMember, updateAssignmentDueDate, 
  deleteAssignment, bulkAssignExercise, createGame, updateGame, deleteGame, getGames } from '../api/assignments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import parseLocalDate from '../utils/parseLocalDate';

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
  const [gamesList, setGamesList] = useState([]);
  const [editingGame, setEditingGame] = useState(null);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadDropdownData = async () => {
    try {
      const exercisesResponse = await getExercises();
      const membersResponse = await getTeamMembers();
      setExercises(exercisesResponse.data);
      const sortedMembers = [...membersResponse.data].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
      setTeamMembers(sortedMembers);
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Failed loading dashboard data");
    }
  };

  useEffect(() => {
    loadDropdownData();
    loadGames();
  }, []);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    try
    {
      await createExercise(exercise);
      setMsg(`Exercise "${exercise.name}" created.`);
      setExercise({ name: '', description: '', targetDurationMinutes: 30});
      loadDropdownData();
    }catch (err){
      setMsg(err.response?.data?.error || 'Failed to create exercise');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try{
      await assignExercise({...assignment, dueDate: assignment.dueDate});
      setMsg('Assigned.');
      if (selectedProgressMember?.member._id === assignment.athleteId) 
      {
      refreshProgress();
      }
    }catch (err){
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
    }catch (err){
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
    const sortedAssignments = [...data].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    setSelectedProgressMember({ member, assignments: sortedAssignments });
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
    const sortedAssignments = [...data].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    setSelectedProgressMember({ ...selectedProgressMember, assignments: sortedAssignments });
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
        dueDate: assignment.dueDate,
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
      await createGame(games);
      setMsg('Game date added.');
      setGame({ title: '', location: '', date: '' });
      loadGames();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to add game date.');
    }
  };

  const loadGames = async () => {
    try {
      const { data } = await getGames();
      setGamesList(data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed loading games.');
    }
  };

  const handleUpdateGame = async (e) => {
    e.preventDefault();
    try {
      await updateGame(editingGame._id, {
        title: editingGame.title,
        location: editingGame.location,
        date: editingGame.date,
      });
      setMsg('Game updated.');
      setEditingGame(null);
      loadGames();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to update game.');
    }
  };

  const handleDeleteGame = async (id) => {
    if (!window.confirm('Delete this game date?')) return;
    try {
      await deleteGame(id);
      setMsg('Game deleted.');
      loadGames();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to delete game.');
    }
  };

  return (
    <main className="theme-page" aria-labelledby="coach-heading">
      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 id="coach-heading" className="theme-heading mb-0">Coach Dashboard</h2>
          <Button variant="outline-secondary" size="sm" className="theme-btn-outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>

        {msg && <Alert variant="info" onClose={() => setMsg(null)} dismissible>{msg}</Alert>}

        <Row className="mt-4">
          <Col md={4}>
            <div className="theme-card h-100">
              <h3 className="theme-heading">Add Team Athlete</h3>
              <Form onSubmit={handleAddAthlete}>
                <Form.Group className="mb-2" controlId="add-athlete-email">
                  <Form.Label className="visually-hidden">Athlete email</Form.Label>
                  <Form.Control
                    placeholder="athlete@email.com"
                    value={athleteEmail} onChange={(e) => setAthleteEmail(e.target.value)} required
                  />
                </Form.Group>
                <Button type="submit" size="sm" className="theme-btn-primary">Add Athlete</Button>
              </Form>
            </div>
          </Col>

          <Col md={4}>
            <div className="theme-card h-100">
              <h3 className="theme-heading">Create Exercise</h3>
              <Form onSubmit={handleCreateExercise}>
                <Form.Group className="mb-2" controlId="create-exercise-name">
                  <Form.Label className="visually-hidden">Exercise name</Form.Label>
                  <Form.Control
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => setExercise({ ...exercise, name: e.target.value })} required
                  />
                </Form.Group>
                <Form.Group className="mb-2" controlId="create-exercise-description">
                  <Form.Label className="visually-hidden">Description</Form.Label>
                  <Form.Control
                    placeholder="Description" as="textarea" rows={2}
                    value={exercise.description}
                    onChange={(e) => setExercise({ ...exercise, description: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-2" controlId="create-exercise-duration">
                  <Form.Label className="visually-hidden">Target duration in minutes</Form.Label>
                  <Form.Control
                    type="number" placeholder="Target duration (minutes)"
                    value={exercise.targetDurationMinutes}
                    onChange={(e) => setExercise({ ...exercise, targetDurationMinutes: Number(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Button type="submit" size="sm" className="theme-btn-primary">Create</Button>
              </Form>
            </div>
          </Col>

          <Col md={4}>
            <div className="theme-card h-100">
              <h3 className="theme-heading">Assign Exercise</h3>
              <Form onSubmit={handleAssign}>
                <Form.Group className="mb-2" controlId="assign-exercise-select">
                  <Form.Label className="visually-hidden">Exercise</Form.Label>
                  <Form.Select
                    value={assignment.exerciseId}
                    onChange={(e) => setAssignment({ ...assignment, exerciseId: e.target.value })} required
                  >
                    <option value="">Select exercise...</option>
                    {exercises.map((ex) => (
                      <option key={ex._id} value={ex._id}>{ex.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2" controlId="assign-athlete-select">
                  <Form.Label className="visually-hidden">Athlete</Form.Label>
                  <Form.Select
                    value={assignment.athleteId}
                    onChange={(e) => setAssignment({ ...assignment, athleteId: e.target.value })} required
                  >
                    <option value="">Select athlete...</option>
                    {teamMembers.map((m) => (
                      <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2" controlId="assign-due-date">
                  <Form.Label className="visually-hidden">Due date</Form.Label>
                  <Form.Control
                    type="date"
                    value={assignment.dueDate}
                    onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })} required
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button type="submit" size="sm" className="theme-btn-primary">Assign to Selected Athlete</Button>
                  <Button type="button" size="sm" className="theme-btn-outline" onClick={handleBulkAssign}>
                    Assign to Entire Team
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>

        <hr className="my-4" />
        <h3 className="theme-heading">Manage Exercises</h3>
        <ListGroup className="mb-3">
          {exercises.map((ex) => (
            <ListGroup.Item key={ex._id} className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{ex.name}</strong>
                <span className="theme-muted ms-2">{ex.targetDuration} min</span>
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" className="theme-btn-outline" onClick={() =>
                  setEditingExercise({ ...ex, targetDurationMinutes: ex.targetDuration })}>
                  Edit
                </Button>
                <Button size="sm" className="theme-btn-danger" onClick={() => handleDeleteExercise(ex._id)}>
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
                <Form.Group className="mb-2" controlId="edit-exercise-name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2" controlId="edit-exercise-description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea" rows={2}
                    value={editingExercise.description}
                    onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="edit-exercise-duration">
                  <Form.Label>Target Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editingExercise.targetDurationMinutes}
                    onChange={(e) => setEditingExercise({ ...editingExercise, targetDurationMinutes: Number(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Button type="submit" size="sm" className="theme-btn-primary">Save Changes</Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>

        <hr className="my-4" />
        <h3 className="theme-heading">Team Progress</h3>
        <ListGroup className="mb-3">
          {teamMembers.map((m) => (
            <ListGroup.Item key={m._id} className="d-flex justify-content-between align-items-center">
              {m.firstName} {m.lastName}
              <div className="d-flex gap-2">
                <Button size="sm" className="theme-btn-outline" onClick={() => viewProgress(m)}>
                  View Progress
                </Button>
                <Button size="sm" className="theme-btn-danger" onClick={() => handleRemoveAthlete(m._id)}>
                  Remove
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        {selectedProgressMember && (
          <div className="theme-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4 className="theme-heading mb-0">{selectedProgressMember.member.firstName}'s Assignments</h4>
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
                        <Form.Group controlId={`due-date-${a._id}`} className="mb-0">
                          <Form.Label className="visually-hidden">
                            New due date for {a.exercise?.name || 'this assignment'}
                          </Form.Label>
                          <Form.Control
                            size="sm" type="date" style={{ width: 150 }}
                            value={editingDueDate[a._id] ?? ''}
                            onChange={(e) => setEditingDueDate({ ...editingDueDate, [a._id]: e.target.value })}
                          />
                        </Form.Group>
                        <Button size="sm" className="theme-btn-outline" onClick={() => handleUpdateDueDate(a._id)}>
                          Update
                        </Button>
                      </>
                    )}
                    <Button size="sm" className="theme-btn-danger" onClick={() => handleDeleteAssignment(a._id)}>
                      Delete
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        <div className="theme-card mb-4" style={{ maxWidth: 420 }}>
          <h3 className="theme-heading">Add Game Date</h3>
          <Form onSubmit={handleCreateGame}>
            <Form.Group className="mb-2" controlId="add-game-title">
              <Form.Label className="visually-hidden">Game title</Form.Label>
              <Form.Control
                placeholder="e.g. vs. Riverside High"
                value={games.title}
                onChange={(e) => setGame({ ...games, title: e.target.value })} required
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="add-game-location">
              <Form.Label className="visually-hidden">Game location</Form.Label>
              <Form.Control
                placeholder="Location (optional)"
                value={games.location}
                onChange={(e) => setGame({ ...games, location: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="add-game-date">
              <Form.Label className="visually-hidden">Game date</Form.Label>
              <Form.Control
                type="date"
                value={games.date}
                onChange={(e) => setGame({ ...games, date: e.target.value })} required
              />
            </Form.Group>
            <Button type="submit" size="sm" className="theme-btn-primary">Add Game</Button>
          </Form>
        </div>

        <hr className="my-4" />
        <h3 className="theme-heading">Manage Games</h3>
        <ListGroup className="mb-3">
          {gamesList.length === 0 && (
            <ListGroup.Item className="theme-muted">No game dates added yet.</ListGroup.Item>
          )}
          {gamesList.map((g) => (
            <ListGroup.Item key={g._id} className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{g.title}</strong>
                <span className="theme-muted ms-2">{parseLocalDate(g.date).toLocaleDateString()}</span>
                {g.location && <span className="theme-muted ms-2">— {g.location}</span>}
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" className="theme-btn-outline" onClick={() => setEditingGame({
                  ...g,
                  date: g.date.split('T')[0],
                })}>
                  Edit
                </Button>
                <Button size="sm" className="theme-btn-danger" onClick={() => handleDeleteGame(g._id)}>
                  Delete
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <Modal show={!!editingGame} onHide={() => setEditingGame(null)}>
          <Modal.Header closeButton><Modal.Title>Edit Game</Modal.Title></Modal.Header>
          <Modal.Body>
            {editingGame && (
              <Form onSubmit={handleUpdateGame}>
                <Form.Group className="mb-2" controlId="edit-game-title">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    value={editingGame.title}
                    onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2" controlId="edit-game-location">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    value={editingGame.location || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, location: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="edit-game-date">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={editingGame.date}
                    onChange={(e) => setEditingGame({ ...editingGame, date: e.target.value })}
                    required
                  />
                </Form.Group>
                <Button type="submit" size="sm" className="theme-btn-primary">Save Changes</Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </main>
  );
}
