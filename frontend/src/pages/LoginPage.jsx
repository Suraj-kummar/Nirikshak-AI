import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button,
  CircularProgress, Alert, Tab, Tabs, InputAdornment, IconButton,
} from '@mui/material';
import LockIcon          from '@mui/icons-material/Lock';
import EmailIcon         from '@mui/icons-material/Email';
import PersonIcon        from '@mui/icons-material/Person';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RocketLaunchIcon  from '@mui/icons-material/RocketLaunch';
import ShieldIcon        from '@mui/icons-material/Shield';
import { useNavigate }   from 'react-router-dom';
import { login, register } from '../api';

// ── Animated floating orb ────────────────────────────────────────────────────
function Orb({ size, top, left, color, delay = 0 }) {
  return (
    <Box sx={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      top, left,
      animation: `orbPulse ${3 + delay}s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
      filter: 'blur(1px)',
    }} />
  );
}

// ── Feature row ──────────────────────────────────────────────────────────────
function Feature({ icon, text }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: '8px',
        background: 'rgba(129,140,248,0.12)',
        border: '1px solid rgba(129,140,248,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem', flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
        {text}
      </Typography>
    </Box>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#A5B4FC', lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.3 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── Input styles ─────────────────────────────────────────────────────────────
const inputSx = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(255,255,255,0.04)',
    '&:hover fieldset': { borderColor: 'rgba(129,140,248,0.6)' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(99,102,241,0.22)' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#818CF8' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
  '& .MuiInputBase-input': { color: '#fff' },
  '& .MuiInputAdornment-root svg': { color: '#6366F1' },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab]         = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginForm, setLoginForm]       = useState({ email: 'demo@nirikshak.ai', password: 'demo1234' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });

  const handleDemoMode = () => {
    localStorage.setItem('nirikshak_token', 'demo-offline-token');
    localStorage.setItem('nirikshak_student', JSON.stringify({ id: 'demo-student-001', name: 'Demo Student', email: 'demo@nirikshak.ai' }));
    navigate('/exam/demo-exam-001');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await login(loginForm);
      localStorage.setItem('nirikshak_token', data.token);
      localStorage.setItem('nirikshak_student', JSON.stringify({ id: data.studentId, name: data.name, email: data.email }));
      navigate('/exam/demo-exam-001');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed — use Demo Mode to try without a backend.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await register(registerForm);
      localStorage.setItem('nirikshak_token', data.token);
      localStorage.setItem('nirikshak_student', JSON.stringify({ id: data.studentId, name: data.name, email: data.email }));
      navigate('/exam/demo-exam-001');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      background: 'radial-gradient(ellipse at 15% 60%, #1e1b4b 0%, #06050F 55%), radial-gradient(ellipse at 85% 20%, #2d1f5e 0%, transparent 45%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <Orb size={600} top="-15%" left="-10%" color="rgba(99,102,241,0.12)" delay={0} />
      <Orb size={400} top="50%"  left="55%"  color="rgba(124,58,237,0.1)"  delay={1.5} />
      <Orb size={300} top="70%"  left="10%"  color="rgba(6,182,212,0.08)"  delay={1} />
      <Orb size={250} top="5%"   left="70%"  color="rgba(167,139,250,0.09)" delay={2} />

      {/* Grid overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }} />

      {/* ── LEFT HERO PANEL ────────────────────────────────────────────────── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flex: 1, flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-start',
        px: { md: 6, lg: 10 }, py: 6,
        position: 'relative', zIndex: 1,
        maxWidth: 600,
      }}>
        {/* Logo + brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(124,58,237,0.2) 100%)',
            border: '1px solid rgba(129,140,248,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(99,102,241,0.35)',
          }}>
            <ShieldIcon sx={{ fontSize: 26, color: '#818CF8' }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 900, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Nirikshak <Box component="span" sx={{ color: '#818CF8' }}>AI</Box>
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', mt: 0.3 }}>
              Proctoring Platform
            </Typography>
          </Box>
        </Box>

        {/* Hero headline */}
        <Typography sx={{
          fontFamily: '"Outfit", sans-serif', fontWeight: 900,
          fontSize: { md: '2.6rem', lg: '3.2rem' }, lineHeight: 1.05,
          letterSpacing: '-0.035em', color: '#fff', mb: 2,
          animation: 'slideInLeft 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}>
          Secure.<br />
          Intelligent.<br />
          <Box component="span" sx={{
            background: 'linear-gradient(135deg, #818CF8, #A78BFA)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Real-time.
          </Box>
        </Typography>

        <Typography sx={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', mb: 5, maxWidth: 420, lineHeight: 1.7, animation: 'slideInLeft 0.6s 0.1s cubic-bezier(0.4,0,0.2,1) both' }}>
          Browser-native AI proctoring with zero video storage. Every exam session is monitored in real time using on-device machine learning.
        </Typography>

        {/* Feature list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 5, animation: 'slideInLeft 0.6s 0.2s cubic-bezier(0.4,0,0.2,1) both' }}>
          <Feature icon="👁" text="Real-time gaze & head pose tracking (68-point landmarks)" />
          <Feature icon="👥" text="Multi-face detection — impersonation prevention" />
          <Feature icon="🔒" text="Zero data stored — frames processed in-memory only" />
          <Feature icon="⚡" text="Sub-100ms detection latency via TinyFaceDetector" />
        </Box>

        {/* Stats strip */}
        <Box sx={{
          display: 'flex', gap: 3, p: 2.5,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(129,140,248,0.12)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
          animation: 'slideInLeft 0.6s 0.3s cubic-bezier(0.4,0,0.2,1) both',
        }}>
          <Stat value="<100ms" label="Detection latency" />
          <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Stat value="99.4%" label="Accuracy" />
          <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Stat value="0 MB" label="Data stored" />
        </Box>
      </Box>

      {/* ── RIGHT FORM PANEL ───────────────────────────────────────────────── */}
      <Box sx={{
        width: { xs: '100%', md: 480 }, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        px: { xs: 2, md: 4 }, py: 4,
        position: 'relative', zIndex: 1,
        borderLeft: { md: '1px solid rgba(129,140,248,0.08)' },
        background: { md: 'linear-gradient(180deg, rgba(7,6,18,0.5) 0%, rgba(10,9,24,0.6) 100%)' },
        backdropFilter: 'blur(24px)',
      }}>
        <Box sx={{ width: '100%', maxWidth: 400, animation: 'slideInUp 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4, justifyContent: 'center' }}>
            <ShieldIcon sx={{ fontSize: 28, color: '#818CF8' }} />
            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#fff' }}>
              Nirikshak <Box component="span" sx={{ color: '#818CF8' }}>AI</Box>
            </Typography>
          </Box>

          {/* Card */}
          <Box sx={{
            background: 'rgba(10,9,25,0.85)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(129,140,248,0.15)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
          }}>
            {/* Card top accent */}
            <Box sx={{ height: 3, background: 'linear-gradient(90deg, #6366F1, #7C3AED, #A78BFA)' }} />

            <Box sx={{ p: { xs: 3, sm: 4 } }}>
              {/* Tabs */}
              <Tabs
                value={tab}
                onChange={(_, v) => { setTab(v); setError(''); }}
                variant="fullWidth"
                sx={{
                  mb: 3.5, minHeight: 42,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px', p: '4px',
                  '& .MuiTab-root': {
                    color: 'rgba(255,255,255,0.4)', minHeight: 34,
                    borderRadius: '9px', fontFamily: '"Outfit", sans-serif',
                    fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s ease',
                  },
                  '& .Mui-selected': { color: '#fff !important', background: 'rgba(99,102,241,0.35)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
                  '& .MuiTabs-indicator': { display: 'none' },
                }}
              >
                <Tab label="Sign In" id="tab-login" />
                <Tab label="Register" id="tab-register" />
              </Tabs>

              {error && (
                <Alert severity="error" sx={{
                  mb: 2.5, borderRadius: '10px',
                  bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#FCA5A5', fontSize: '0.82rem',
                  '& .MuiAlert-icon': { color: '#F87171' },
                }}>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              {tab === 0 && (
                <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                  <TextField id="login-email" label="Email address" type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    required fullWidth sx={inputSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
                  />
                  <TextField id="login-password" label="Password"
                    type={showPwd ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    required fullWidth sx={inputSx}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPwd(p => !p)} edge="end" sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#818CF8' } }}>
                            {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button id="btn-login" type="submit" variant="contained" size="large" fullWidth
                    disabled={loading}
                    sx={{ mt: 0.5, py: 1.5, fontSize: '0.95rem', borderRadius: '12px' }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Enter Exam Room →'}
                  </Button>
                  <Typography variant="caption" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem' }}>
                    Demo credentials pre-filled above
                  </Typography>
                </Box>
              )}

              {/* Register Form */}
              {tab === 1 && (
                <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                  <TextField id="reg-name" label="Full Name" value={registerForm.name}
                    onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                    required fullWidth sx={inputSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
                  />
                  <TextField id="reg-email" label="Email" type="email" value={registerForm.email}
                    onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                    required fullWidth sx={inputSx}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
                  />
                  <TextField id="reg-password" label="Password"
                    type={showPwd ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                    required fullWidth sx={inputSx}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPwd(p => !p)} edge="end" sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#818CF8' } }}>
                            {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button id="btn-register" type="submit" variant="contained" size="large" fullWidth
                    disabled={loading}
                    sx={{ mt: 0.5, py: 1.5, fontSize: '0.95rem', borderRadius: '12px' }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Account →'}
                  </Button>
                </Box>
              )}

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5 }}>
                <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem', letterSpacing: '0.08em' }}>OR</Typography>
                <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              </Box>

              {/* Demo button */}
              <Button
                id="btn-demo-mode"
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<RocketLaunchIcon />}
                onClick={handleDemoMode}
                sx={{
                  borderColor: 'rgba(129,140,248,0.35)',
                  color: '#A5B4FC',
                  borderRadius: '12px',
                  borderStyle: 'dashed',
                  py: 1.4,
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 700,
                  '&:hover': {
                    background: 'rgba(99,102,241,0.12)',
                    borderColor: '#818CF8', borderStyle: 'solid',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 24px rgba(99,102,241,0.28)',
                  },
                  transition: 'all 0.22s ease',
                }}
              >
                Try Demo Mode (No Backend)
              </Button>
              <Typography sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                Live camera · Browser AI · No data stored
              </Typography>

              {/* Footer badges */}
              <Box sx={{ mt: 3.5, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                {['🔒 Privacy-first', '🧠 On-device AI', '⚡ Real-time'].map(t => (
                  <Typography key={t} sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                    {t}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
