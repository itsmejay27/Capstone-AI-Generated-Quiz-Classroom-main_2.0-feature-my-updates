import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Quiz,
  Add,
  Schedule,
  CheckCircle,
  People,
  Assignment,
  Assessment,
  MenuBook,
  Upload,
  Delete,
  PictureAsPdf,
  Description,
  InsertDriveFile,
  Visibility,
} from '@mui/icons-material';
import { useState } from 'react';

// Academic grade converter standard for OMSC (Occidental Mindoro State College)
// Integrated with the Base-65 Transmutation System (65% raw passing -> 75% transmuted passing)
function convertToTransmutedOMSCGrade(score: number, total: number) {
  if (total <= 0) return { rawPct: 0, transmutedPct: 0, grade: '5.00', remark: 'Failed', color: 'error.main' };
  
  const rawPct = (score / total) * 100;
  
  let transmutedPct = 0;
  if (rawPct >= 65) {
    transmutedPct = 75 + ((rawPct - 65) * 25) / 35;
  } else {
    transmutedPct = 50 + (rawPct * 25) / 65;
  }
  
  let grade = '5.00';
  let remark = 'Failed';
  let color = 'error.main';
  
  if (transmutedPct >= 98) {
    grade = '1.00'; remark = 'Excellent'; color = 'success.main';
  } else if (transmutedPct >= 95) {
    grade = '1.25'; remark = 'Very Good'; color = 'success.main';
  } else if (transmutedPct >= 92) {
    grade = '1.50'; remark = 'Very Good'; color = 'success.main';
  } else if (transmutedPct >= 89) {
    grade = '1.75'; remark = 'Good'; color = 'success.main';
  } else if (transmutedPct >= 86) {
    grade = '2.00'; remark = 'Good'; color = 'success.main';
  } else if (transmutedPct >= 83) {
    grade = '2.25'; remark = 'Satisfactory'; color = 'info.main';
  } else if (transmutedPct >= 80) {
    grade = '2.50'; remark = 'Satisfactory'; color = 'info.main';
  } else if (transmutedPct >= 77) {
    grade = '2.75'; remark = 'Fair'; color = 'warning.main';
  } else if (transmutedPct >= 75) {
    grade = '3.00'; remark = 'Passing'; color = 'warning.main';
  }
  
  return { rawPct, transmutedPct, grade, remark, color };
}

function getMaterialIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PictureAsPdf sx={{ fontSize: 32, color: '#e53935' }} />;
  if (ext === 'doc' || ext === 'docx') return <Description sx={{ fontSize: 32, color: '#1565c0' }} />;
  return <InsertDriveFile sx={{ fontSize: 32, color: '#546e7a' }} />;
}

export default function ClassroomDetail() {
  const { classroomId } = useParams();
  const { currentUser, users, classrooms, exams, examAttempts, classroomMaterials, addClassroomMaterial, deleteClassroomMaterial } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [viewMaterial, setViewMaterial] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const classroom = classrooms.find((c) => c.id === classroomId);
  const instructor = users.find((u) => u.id === classroom?.instructorId);
  const students = users.filter((u) => classroom?.students.includes(u.id));

  const isInstructor = currentUser?.role === 'instructor';
  const materials = classroomMaterials[classroomId || ''] || [];

  if (!classroom) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Classroom not found</Typography>
      </Container>
    );
  }

  // Filter classroom exams
  const rawClassExams = exams.filter((e) => e.classroomId === classroomId);
  const classExams = isInstructor
    ? rawClassExams
    : rawClassExams.filter((e) => {
        if (!e.postDate) return true;
        return new Date(e.postDate) <= new Date();
      });

  const getExamStatus = (examId: string) => {
    const attempt = examAttempts.find(
      (a) => a.examId === examId && a.studentId === currentUser?.id
    );
    if (attempt?.submittedAt) return 'completed';
    if (attempt?.startedAt) return 'in-progress';
    return 'not-started';
  };

  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classroomId) return;
    const material = {
      id: `mat-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Instructor',
      // In a real app this would be a URL; here we store the filename for display
      content: `This material "${file.name}" has been uploaded by the instructor for classroom study. Students can review this document to prepare for upcoming assessments.`,
    };
    addClassroomMaterial(classroomId, material);
    // Reset input
    e.target.value = '';
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (classroomId) {
      deleteClassroomMaterial(classroomId, materialId);
      setDeleteConfirm(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const tabCount = isInstructor ? 4 : 3;

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 5, lg: 6 } }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      {/* Header banner */}
      <Paper
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(30,58,138,0.12)',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            p: { xs: 3, md: 4 },
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                {classroom.name}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 400 }}>
                {classroom.section} &bull; {classroom.subject}
              </Typography>
              {classroom.description && (
                <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.8, maxWidth: 600 }}>
                  {classroom.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Code: ${classroom.classCode}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', backdropFilter: 'blur(8px)' }}
                />
                <Chip
                  icon={<People sx={{ color: 'white !important' }} />}
                  label={`${classroom.students.length} Students`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)' }}
                />
              </Box>
            </Box>
            {isInstructor && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/exam-generator')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                Generate Exam
              </Button>
            )}
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            '& .MuiTab-root': { fontWeight: 600, minHeight: 52 },
          }}
        >
          <Tab label="Exams & Quizzes" icon={<Quiz />} iconPosition="start" />
          <Tab label="Study Materials" icon={<MenuBook />} iconPosition="start" />
          <Tab label="People" icon={<People />} iconPosition="start" />
          {isInstructor && (
            <Tab label="Grades & Scores" icon={<Assessment />} iconPosition="start" />
          )}
        </Tabs>
      </Paper>

      {/* TAB 0: EXAMS LIST */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
          {classExams.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: 'rgba(25,118,210,0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
              }}>
                <Assignment sx={{ fontSize: 40, color: '#1976d2' }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                No exams or quizzes scheduled yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isInstructor
                  ? 'Generate a new exam or assign one from your repository.'
                  : 'Your instructor has not posted any exams yet. Check back later.'}
              </Typography>
              {isInstructor && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={() => navigate('/exam-repository')}>
                    Assign from Repository
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/exam-generator')}>
                    Generate with AI
                  </Button>
                </Box>
              )}
            </Paper>
          ) : (
            classExams.map((exam) => {
              const status = !isInstructor ? getExamStatus(exam.id) : null;
              const attempt = examAttempts.find(
                (a) => a.examId === exam.id && a.studentId === currentUser?.id
              );
              const isFuture = exam.postDate && new Date(exam.postDate) > new Date();

              const statusColor: any = {
                completed: { bg: '#dcfce7', border: '#16a34a', text: '#15803d', label: 'Completed' },
                'in-progress': { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e', label: 'In Progress' },
                'not-started': { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', label: 'Not Started' },
              };
              const sc = status ? statusColor[status] : null;

              return (
                <Paper
                  key={exam.id}
                  elevation={0}
                  sx={{
                    width: '100%',
                    minHeight: { md: 110 },
                    bgcolor: 'white',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    borderLeft: `6px solid ${sc ? sc.border : '#1e3a8a'}`,
                    p: 3,
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
                  {/* Left Section: Icon + Text Content */}
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(30,58,138,0.2)',
                    }}>
                      <Quiz sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
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
                          {exam.title}
                        </Typography>
                        {sc && (
                          <Chip
                            size="small"
                            label={sc.label}
                            sx={{
                              bgcolor: sc.bg,
                              color: sc.text,
                              border: `1px solid ${sc.border}`,
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              height: 20
                            }}
                          />
                        )}
                      </Box>
                      {exam.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            mb: 1.5,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {exam.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {exam.postDate && (
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            Posted: {new Date(exam.postDate).toLocaleString()}
                          </Typography>
                        )}
                        {exam.dueDate && (
                          <Typography variant="caption" color="error.main" fontWeight="700">
                            Due: {new Date(exam.dueDate).toLocaleString()}
                          </Typography>
                        )}
                      </Box>

                      {!isInstructor && status === 'completed' && attempt?.score !== undefined && (
                        <Box sx={{ mt: 1.5, p: 1, px: 1.5, bgcolor: '#dcfce7', borderRadius: 2, border: '1px solid #86efac', display: 'inline-block' }}>
                          <Typography variant="caption" fontWeight="bold" color="success.dark" sx={{ fontSize: '0.75rem' }}>
                            Score: {attempt.score} / {exam.totalPoints}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Right Section: Details Chips & Action Button */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'center', md: 'flex-end' },
                    gap: 2,
                    flexShrink: 0,
                    minWidth: { md: '190px' },
                    width: { xs: '100%', md: 'auto' },
                    justifyContent: { xs: 'space-between', md: 'flex-end' },
                    borderTop: { xs: '1px solid #f1f5f9', md: 'none' },
                    pt: { xs: 1.5, md: 0 },
                    mt: { xs: 1, md: 0 }
                  }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: { md: 1 } }}>
                      <Chip icon={<Schedule sx={{ fontSize: '13px !important' }} />} label={`${exam.duration} mins`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
                      <Chip label={`${exam.totalPoints} pts`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
                      <Chip label={`${exam.activeQuestionCount || exam.questions.length} items`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
                    </Box>

                    {isInstructor ? (
                      <Button size="small" variant="outlined" onClick={() => navigate('/exam-repository')} sx={{ minWidth: 150, fontWeight: 700 }}>
                        Manage in Repository
                      </Button>
                    ) : status === 'completed' ? (
                      <Button size="small" variant="outlined" color="success" onClick={() => navigate(`/exam/${exam.id}/results`)} sx={{ minWidth: 150, fontWeight: 700 }}>
                        View Submission
                      </Button>
                    ) : (
                      <Button size="small" variant="contained" disabled={!!isFuture} onClick={() => navigate(`/exam/${exam.id}/take`)} sx={{ minWidth: 150, fontWeight: 700 }}>
                        {status === 'in-progress' ? 'Continue Exam' : 'Start Exam'}
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      )}

      {/* TAB 1: STUDY MATERIALS */}
      {activeTab === 1 && (
        <Box>
          {/* Instructor upload section */}
          {isInstructor && (
            <Paper
              sx={{
                p: 3, mb: 3, borderRadius: 4,
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1px solid #bae6fd',
                boxShadow: '0 4px 16px rgba(3,105,161,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="#0c4a6e">
                    Upload Study Materials
                  </Typography>
                  <Typography variant="body2" color="#0369a1">
                    Upload PDFs, Word documents, or text files for students to study before assessments.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<Upload />}
                  sx={{
                    background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                    boxShadow: '0 4px 12px rgba(3,105,161,0.3)',
                    '&:hover': { boxShadow: '0 6px 16px rgba(3,105,161,0.4)' },
                  }}
                >
                  Upload Material
                  <input type="file" hidden accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" onChange={handleMaterialUpload} />
                </Button>
              </Box>
            </Paper>
          )}

          {/* Materials grid */}
          {materials.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: 'rgba(3,105,161,0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
              }}>
                <MenuBook sx={{ fontSize: 40, color: '#0369a1' }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                No study materials yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isInstructor
                  ? 'Upload lecture notes, readings, or slide decks to help students prepare.'
                  : 'Your instructor has not uploaded any materials yet. Check back later.'}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              {materials.map((mat) => (
                <Paper
                  key={mat.id}
                  elevation={0}
                  sx={{
                    width: '100%',
                    minHeight: { sm: 76 },
                    bgcolor: 'white',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    borderLeft: '6px solid #0288d1',
                    p: 2.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                      borderColor: '#cbd5e1',
                    },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Left Section: File Icon + File Info */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid #bae6fd'
                    }}>
                      {getMaterialIcon(mat.name)}
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        sx={{
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.92rem',
                          lineHeight: 1.3
                        }}
                      >
                        {mat.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.5, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Size: {formatFileSize(mat.size)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          &bull;
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Uploaded by {mat.uploadedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          &bull;
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(mat.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Right Section: View / Delete Action */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexShrink: 0,
                    minWidth: { sm: '160px' },
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'space-between', sm: 'flex-end' },
                    borderTop: { xs: '1px solid #f1f5f9', sm: 'none' },
                    pt: { xs: 1.5, sm: 0 },
                    mt: { xs: 1, sm: 0 }
                  }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Visibility />}
                      sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                        px: 2.5,
                        height: 32,
                      }}
                      onClick={() => setViewMaterial(mat)}
                    >
                      View Notes
                    </Button>
                    {isInstructor && (
                      <Tooltip title="Delete material">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteConfirm(mat.id)}
                          sx={{
                            bgcolor: '#fef2f2',
                            border: '1px solid #fee2e2',
                            '&:hover': { bgcolor: '#fee2e2' },
                            width: 32,
                            height: 32,
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* TAB 2: PEOPLE LIST */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3.5, borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <People color="primary" /> Class Members
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.secondary', mb: 1 }}>
            Class Instructor
          </Typography>
          <List disablePadding sx={{ mb: 4 }}>
            {instructor && (
              <ListItem sx={{ px: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)', fontWeight: 'bold' }}>
                    {instructor.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight="bold">{instructor.name}</Typography>}
                  secondary={instructor.email}
                />
                <Chip label="Instructor" size="small" color="secondary" sx={{ ml: 'auto' }} />
              </ListItem>
            )}
          </List>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.secondary', mb: 1 }}>
            Class Students ({students.length})
          </Typography>
          {students.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No students enrolled yet. Share code <strong>{classroom.classCode}</strong> with students.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {students.map((student, idx) => (
                <Box key={student.id}>
                  <ListItem sx={{ px: 1, py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', fontWeight: 'bold' }}>
                        {student.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight="medium">{student.name}</Typography>}
                      secondary={student.email}
                    />
                    <Chip label={`#${idx + 1}`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', ml: 'auto' }} />
                  </ListItem>
                  {idx < students.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* TAB 3: GRADES MATRIX (INSTRUCTOR ONLY) */}
      {activeTab === 3 && isInstructor && (
        <Box>
          {/* Assessment Type Legend */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>Assessment Types:</Typography>
            <Chip size="small" label="Midterm Exam" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, border: '1px solid #bfdbfe' }} />
            <Chip size="small" label="Final Exam" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700, border: '1px solid #fecaca' }} />
            <Chip size="small" label="Other/Custom" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontWeight: 700, border: '1px solid #d1d5db' }} />
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflowX: 'auto',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 3 },
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold', color: 'white', minWidth: 160 }}>Student Name</TableCell>
                  <TableCell style={{ fontWeight: 'bold', color: 'white', minWidth: 200 }}>Email Address</TableCell>
                  {rawClassExams.map((exam) => {
                    const examType = exam.type || '';
                    const isMidterm = examType.toLowerCase().includes('midterm');
                    const isFinal = examType.toLowerCase().includes('final');
                    const typeBg = isMidterm ? 'rgba(219,234,254,0.25)' : isFinal ? 'rgba(254,226,226,0.25)' : 'rgba(255,255,255,0.1)';
                    const typeBorder = isMidterm ? '1px solid rgba(191,219,254,0.4)' : isFinal ? '1px solid rgba(252,165,165,0.4)' : '1px solid rgba(255,255,255,0.2)';
                    return (
                      <TableCell key={exam.id} align="center" style={{ fontWeight: 'bold', color: 'white', minWidth: 180 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                          {examType && (
                            <Box
                              sx={{
                                px: 1.5,
                                py: 0.4,
                                borderRadius: 1.5,
                                bgcolor: typeBg,
                                border: typeBorder,
                                display: 'inline-block',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'white', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                                {examType.toUpperCase()}
                              </Typography>
                            </Box>
                          )}
                          <Typography variant="body2" fontWeight={800} sx={{ color: 'white', lineHeight: 1.3 }}>
                            {exam.title}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8, color: 'white' }}>
                            Cap: {exam.totalPoints} pts
                          </Typography>
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2 + rawClassExams.length} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No students enrolled to display grades.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      {rawClassExams.map((exam) => {
                        const attempt = examAttempts.find(
                          (a) => a.examId === exam.id && a.studentId === student.id
                        );
                        if (attempt && attempt.submittedAt && attempt.score !== undefined) {
                          const { rawPct, transmutedPct, grade, remark, color } = convertToTransmutedOMSCGrade(attempt.score, exam.totalPoints);
                          const passed = transmutedPct >= 75;
                          return (
                            <TableCell key={exam.id} align="center">
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {attempt.score} / {exam.totalPoints}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Raw: {rawPct.toFixed(1)}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                  Transmuted: {transmutedPct.toFixed(1)}%
                                </Typography>
                                <Chip
                                  label={`${grade} — ${remark}`}
                                  size="small"
                                  sx={{ bgcolor: 'white', border: '1px solid', borderColor: color, color: color, fontWeight: 'bold', mt: 0.5, fontSize: '0.7rem' }}
                                />
                                <Chip
                                  label={passed ? 'PASSED' : 'FAILED'}
                                  size="small"
                                  sx={{
                                    bgcolor: passed ? '#dcfce7' : '#fee2e2',
                                    color: passed ? '#166534' : '#991b1b',
                                    border: `1px solid ${passed ? '#86efac' : '#fca5a5'}`,
                                    fontWeight: 800,
                                    fontSize: '0.62rem',
                                  }}
                                />
                              </Box>
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={exam.id} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" color="text.disabled">—</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.72rem' }}>Not Submitted</Typography>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* View Material Dialog */}
      <Dialog open={!!viewMaterial} onClose={() => setViewMaterial(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', color: 'white', fontWeight: 'bold' }}>
          {viewMaterial?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a preview of the uploaded material. In a production system, this would display the actual file content.
          </Alert>
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            {viewMaterial?.content}
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>File name:</strong> {viewMaterial?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>File size:</strong> {viewMaterial ? formatFileSize(viewMaterial.size) : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Uploaded by:</strong> {viewMaterial?.uploadedBy}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Date:</strong> {viewMaterial ? new Date(viewMaterial.uploadedAt).toLocaleString() : ''}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewMaterial(null)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Material Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Delete Material?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove the material from the classroom. Students will no longer be able to access it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDeleteMaterial(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
