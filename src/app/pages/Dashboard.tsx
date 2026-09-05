import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Button,
  Typography,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Add,
  People,
  Code,
  School,
  AutoAwesome,
  Quiz,
  ArrowForward,
  LibraryBooks,
  MenuBook,
} from '@mui/icons-material';

const CARD_GRADIENTS = [
  { bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', shadow: 'rgba(30,58,138,0.35)', accent: '#60a5fa' },
  { bg: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)', shadow: 'rgba(76,29,149,0.35)', accent: '#a78bfa' },
  { bg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', shadow: 'rgba(6,95,70,0.35)', accent: '#34d399' },
  { bg: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)', shadow: 'rgba(124,45,18,0.35)', accent: '#fb923c' },
  { bg: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', shadow: 'rgba(3,105,161,0.35)', accent: '#38bdf8' },
  { bg: 'linear-gradient(135deg, #6b21a8 0%, #d946ef 100%)', shadow: 'rgba(107,33,168,0.35)', accent: '#e879f9' },
];

export default function Dashboard() {
  const { currentUser, classrooms, addClassroom, joinClassroom } = useAuth();
  const navigate = useNavigate();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);

  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [description, setDescription] = useState('');
  const [classCode, setClassCode] = useState('');

  const isInstructor = currentUser?.role === 'instructor';
  const userClassrooms = classrooms.filter((classroom) =>
    isInstructor
      ? classroom.instructorId === currentUser?.id
      : classroom.students.includes(currentUser?.id || '')
  );

  const handleCreateClassroom = () => {
    if (!className || !subject || !section) return;
    const newClassroom = {
      id: `class-${Date.now()}`,
      name: className,
      subject,
      section,
      instructorId: currentUser?.id || '',
      classCode: `${subject.replace(/\s+/g, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      students: [],
      createdAt: new Date().toISOString(),
      description,
    };
    addClassroom(newClassroom);
    setClassName(''); setSubject(''); setSection(''); setDescription('');
    setOpenCreateDialog(false);
  };

  const handleJoinClassroom = () => {
    const studentId = currentUser?.id || '';
    const success = joinClassroom(classCode, studentId);
    if (success) {
      const targetClass = classrooms.find((c) => c.classCode.toLowerCase() === classCode.trim().toLowerCase());
      if (targetClass) navigate(`/classroom/${targetClass.id}`);
    } else {
      alert('Invalid Class Code. Please check the code and try again.');
    }
    setOpenJoinDialog(false);
    setClassCode('');
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f4f8' }}>
      {/* ── Hero Banner ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 40%, #1976d2 70%, #0288d1 100%)',
          pt: { xs: 4, md: 6 },
          pb: { xs: 8, md: 10 },
          px: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative orbs */}
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -40, left: '30%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: '20%', left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 5, lg: 6 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
            <Avatar
              src={currentUser?.avatar}
              sx={{
                width: 64,
                height: 64,
                fontSize: '1.4rem',
                fontWeight: 800,
                background: 'rgba(255,255,255,0.25)',
                border: '2px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)',
                color: 'white',
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2, fontSize: { xs: '1.5rem', md: '2rem' } }}
              >
                Welcome back, {currentUser?.name}!
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5, fontSize: '0.95rem' }}>
                {isInstructor
                  ? 'Manage your classrooms and create AI-powered examinations'
                  : 'View your enrolled classes, study with AI Reviewers, and take assessments'}
              </Typography>
            </Box>
          </Box>

          {/* Quick action buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {isInstructor ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<Quiz />}
                  onClick={() => navigate('/exam-generator')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  AI Exam Generator
                </Button>
                <Button
                  variant="contained"
                  startIcon={<LibraryBooks />}
                  onClick={() => navigate('/exam-repository')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  Exam Repository
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<AutoAwesome />}
                  onClick={() => navigate('/reviewer-generator')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  AI Reviewer
                </Button>
                <Button
                  variant="contained"
                  startIcon={<MenuBook />}
                  onClick={() => navigate('/reviewer')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  My Reviewers
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenJoinDialog(true)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  Join Class
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* ── Stats bar ── */}
      <Container maxWidth="xl" sx={{ mt: -4, mb: 4, position: 'relative', zIndex: 1, px: { xs: 2, sm: 3, md: 5, lg: 6 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            p: { xs: 2, md: 2.5 },
            display: 'flex',
            gap: { xs: 2, md: 4 },
            flexWrap: 'wrap',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            background: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <School sx={{ color: '#1565c0', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>{userClassrooms.length}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {isInstructor ? 'Classes Created' : 'Enrolled Classes'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ width: '1px', bgcolor: '#e2e8f0', flexShrink: 0 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <People sx={{ color: '#7c3aed', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                {isInstructor
                  ? userClassrooms.reduce((sum, c) => sum + c.students.length, 0)
                  : userClassrooms.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {isInstructor ? 'Total Students' : 'Active Classes'}
              </Typography>
            </Box>
          </Box>

          {isInstructor && (
            <>
              <Box sx={{ width: '1px', bgcolor: '#e2e8f0', flexShrink: 0 }} />
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <Chip
                  label="INSTRUCTOR"
                  sx={{
                    bgcolor: '#f5f3ff',
                    color: '#7c3aed',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    border: '1px solid #ddd6fe',
                  }}
                />
              </Box>
            </>
          )}
        </Paper>
      </Container>

      {/* ── My Classrooms ── */}
      <Container maxWidth="xl" sx={{ pb: 8, px: { xs: 2, sm: 3, md: 5, lg: 6 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
              My Classrooms
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {userClassrooms.length === 0
                ? 'No classrooms yet — get started below'
                : `${userClassrooms.length} classroom${userClassrooms.length > 1 ? 's' : ''} available`}
            </Typography>
          </Box>
          {!isInstructor && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenJoinDialog(true)}
              sx={{ fontWeight: 700 }}
            >
              Join Class
            </Button>
          )}
        </Box>

        {userClassrooms.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              border: '2px dashed #e2e8f0',
              bgcolor: 'white',
            }}
          >
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              bgcolor: '#f0f4f8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}>
              <School sx={{ fontSize: 40, color: '#94a3b8' }} />
            </Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No classrooms yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 340, mx: 'auto' }}>
              {isInstructor
                ? 'Click the (+) button in the bottom right to create your first class.'
                : 'Click "Join Class" and enter the class code provided by your instructor.'}
            </Typography>
            {isInstructor && (
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreateDialog(true)}>
                Create Classroom
              </Button>
            )}
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {userClassrooms.map((classroom, idx) => {
              const theme = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
              return (
                <Paper
                  key={classroom.id}
                  onClick={() => navigate(`/classroom/${classroom.id}`)}
                  elevation={0}
                  sx={{
                    width: '100%',
                    minHeight: { md: 110 },
                    bgcolor: 'white',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    borderLeft: `6px solid ${theme.accent}`,
                    p: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                      borderColor: '#cbd5e1',
                    },
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2.5,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Left side: Icon + Text Content */}
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2,
                      background: theme.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'white',
                      boxShadow: `0 4px 12px ${theme.shadow}`,
                    }}>
                      <School sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{
                          color: 'text.primary',
                          lineHeight: 1.25,
                          letterSpacing: '-0.01em',
                          fontSize: '1.05rem',
                        }}
                      >
                        {classroom.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.78rem', display: 'block', mt: 0.5 }}>
                        {classroom.subject} &bull; {classroom.section}
                      </Typography>
                      {classroom.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            mt: 1,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {classroom.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Right side: Chips + Action Arrow */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexShrink: 0,
                    minWidth: { md: '220px' },
                    width: { xs: '100%', md: 'auto' },
                    justifyContent: { xs: 'space-between', md: 'flex-end' },
                    borderTop: { xs: '1px solid #f1f5f9', md: 'none' },
                    pt: { xs: 1.5, md: 0 },
                    mt: { xs: 1, md: 0 }
                  }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<People sx={{ fontSize: '14px !important' }} />}
                        label={`${classroom.students.length} student${classroom.students.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                          bgcolor: '#f8fafc',
                          color: '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid #e2e8f0',
                          height: 28,
                        }}
                      />
                      <Chip
                        icon={<Code sx={{ fontSize: '14px !important' }} />}
                        label={classroom.classCode}
                        size="small"
                        sx={{
                          bgcolor: '#f8fafc',
                          color: '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid #e2e8f0',
                          height: 28,
                        }}
                      />
                    </Box>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#eff6ff',
                      color: '#1565c0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#1565c0',
                        color: 'white',
                      }
                    }}>
                      <ArrowForward sx={{ fontSize: 16 }} />
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Container>

      {/* FAB for instructor */}
      {isInstructor && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            boxShadow: '0 8px 24px rgba(21,101,192,0.4)',
            '&:hover': { boxShadow: '0 12px 32px rgba(21,101,192,0.5)' },
          }}
          onClick={() => setOpenCreateDialog(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Create Classroom Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create New Classroom</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField autoFocus margin="dense" label="Class Name" fullWidth variant="outlined" sx={{ mb: 2 }}
            value={className} onChange={(e) => setClassName(e.target.value)} required />
          <TextField margin="dense" label="Subject" fullWidth variant="outlined" sx={{ mb: 2 }}
            value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <TextField margin="dense" label="Section" fullWidth variant="outlined" sx={{ mb: 2 }}
            value={section} onChange={(e) => setSection(e.target.value)} required />
          <TextField margin="dense" label="Description (optional)" fullWidth variant="outlined" multiline rows={3}
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateClassroom} variant="contained" disabled={!className || !subject || !section}>
            Create Classroom
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Classroom Dialog */}
      <Dialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Join Classroom</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the class code provided by your instructor.
          </Typography>
          <TextField autoFocus margin="dense" label="Class Code" fullWidth variant="outlined"
            value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="e.g., WEB101-2024" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenJoinDialog(false)}>Cancel</Button>
          <Button onClick={handleJoinClassroom} variant="contained" disabled={!classCode}>
            Join Class
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
