import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { GOOGLE_CLIENT_ID } from '../config/authConfig';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Grid,
  Avatar,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  School,
  Login as LoginIcon,
  RecordVoiceOver,
  Person,
  AutoAwesome,
} from '@mui/icons-material';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('instructor');
  const [error, setError] = useState('');
  const [gsiLoaded, setGsiLoaded] = useState(false);

  const { login, loginWithGoogle, users } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        setGsiLoaded(true);
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response?.credential) {
                const success = loginWithGoogle(response.credential, selectedRole);
                if (success) {
                  navigate('/dashboard');
                } else {
                  setError('Failed to log in with Google account. Please try again.');
                }
              }
            },
          });

          const btnDiv = document.getElementById('googleGsiButton');
          if (btnDiv) {
            btnDiv.innerHTML = '';
            window.google.accounts.id.renderButton(btnDiv, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
            });
          }
        } catch (e) {
          console.error('Google GSI initialization error:', e);
        }
      }
    };

    initGoogleGsi();
    const timer = setInterval(() => {
      if (window.google?.accounts?.id && !gsiLoaded) {
        initGoogleGsi();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [loginWithGoogle, navigate, selectedRole, gsiLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login(email, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    if (login(userEmail, userPassword)) {
      navigate('/dashboard');
    }
  };

  const handleFallbackGoogleLogin = () => {
    setError('');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In service is loading. Please refresh if it does not load.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)',
        p: { xs: 2, sm: 3 },
        boxSizing: 'border-box',
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            width: '100%',
            bgcolor: '#ffffff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 10px 20px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
          }}
        >
          {/* OMSC Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 3,
                background: selectedRole === 'instructor'
                  ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                  : 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                boxShadow: selectedRole === 'instructor'
                  ? '0 8px 20px rgba(124,58,237,0.35)'
                  : '0 8px 20px rgba(37,99,235,0.35)',
                transition: 'all 0.3s ease',
              }}
            >
              <School sx={{ fontSize: 34, color: 'white' }} />
            </Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 850, color: '#0f172a', letterSpacing: '-0.02em' }}
            >
              OMSC Exam Generator
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5, display: 'block' }}>
              Occidental Mindoro State College &bull; AI Classroom
            </Typography>
          </Box>

          {/* Unified Role Switcher */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 750, color: '#475569', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Login Role
            </Typography>
            <ToggleButtonGroup
              value={selectedRole}
              exclusive
              onChange={(_, newRole) => {
                if (newRole) setSelectedRole(newRole);
              }}
              size="small"
              sx={{
                width: '100%',
                bgcolor: '#f1f5f9',
                p: 0.5,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                '& .MuiToggleButton-root': {
                  flex: 1,
                  py: 1,
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  borderRadius: '10px !important',
                  border: 'none !important',
                  color: '#64748b',
                  transition: 'all 0.2s ease',
                },
                '& .Mui-selected': {
                  bgcolor: selectedRole === 'instructor' ? '#7c3aed !important' : '#2563eb !important',
                  color: 'white !important',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                },
              }}
            >
              <ToggleButton value="instructor">
                <RecordVoiceOver sx={{ mr: 0.8, fontSize: 18 }} /> Instructor
              </ToggleButton>
              <ToggleButton value="student">
                <Person sx={{ mr: 0.8, fontSize: 18 }} /> Student
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Google Sign-In Area */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2.5, minHeight: 44 }}>
            <div id="googleGsiButton" style={{ minHeight: 44, display: 'flex', justifyContent: 'center', width: '100%' }}></div>
            {!gsiLoaded && (
              <Button
                variant="outlined"
                onClick={handleFallbackGoogleLogin}
                fullWidth
                startIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                }
                sx={{
                  py: 1.2,
                  borderRadius: 6,
                  borderColor: '#cbd5e1',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                }}
              >
                Continue with Google
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              OR SIGN IN WITH EMAIL
            </Typography>
          </Divider>

          {/* Email Sign-In Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                type="email"
                placeholder="name@omsc.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />

              <TextField
                fullWidth
                size="small"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />

              {error && (
                <Alert severity="error" sx={{ py: 0.5, borderRadius: 2, fontSize: '0.8rem' }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={<LoginIcon />}
                sx={{
                  mt: 0.5,
                  py: 1.3,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  background: selectedRole === 'instructor'
                    ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  boxShadow: selectedRole === 'instructor'
                    ? '0 6px 18px rgba(124,58,237,0.3)'
                    : '0 6px 18px rgba(37,99,235,0.3)',
                  '&:hover': {
                    background: selectedRole === 'instructor'
                      ? 'linear-gradient(135deg, #6d28d9, #4f46e5)'
                      : 'linear-gradient(135deg, #0369a1, #1d4ed8)',
                  },
                }}
              >
                Sign In as {selectedRole === 'instructor' ? 'Instructor' : 'Student'}
              </Button>
            </Box>
          </form>

          {/* Quick Demo Accounts Bar */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AutoAwesome fontSize="small" sx={{ fontSize: 14, color: '#7c3aed' }} /> Quick Demo Login
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Tap to auto-fill
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {users.map((u) => (
                <Grid item xs={6} key={u.id}>
                  <Paper
                    variant="outlined"
                    onClick={() => {
                      setSelectedRole(u.role);
                      quickLogin(u.email, u.password || 'instructor123');
                    }}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: u.role === 'instructor' ? '#7c3aed' : '#2563eb',
                        bgcolor: u.role === 'instructor' ? '#f5f3ff' : '#eff6ff',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Avatar
                      src={u.avatar}
                      sx={{
                        width: 26,
                        height: 26,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: u.role === 'instructor' ? '#7c3aed' : '#2563eb',
                      }}
                    >
                      {u.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', display: 'block', noWrap: true, fontSize: '0.72rem', lineHeight: 1.1 }}>
                        {u.name.split(' ')[0]}
                      </Typography>
                      <Chip
                        label={u.role}
                        size="small"
                        sx={{
                          height: 14,
                          fontSize: '0.55rem',
                          fontWeight: 800,
                          bgcolor: u.role === 'instructor' ? '#ede9fe' : '#dbeafe',
                          color: u.role === 'instructor' ? '#6d28d9' : '#1d4ed8',
                          p: 0,
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
