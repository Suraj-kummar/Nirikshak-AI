import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Typography, IconButton, Tooltip,
  Divider, Chip, Snackbar, Alert, Paper, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  CircularProgress, useMediaQuery, useTheme,
} from '@mui/material';
import DarkModeIcon          from '@mui/icons-material/DarkMode';
import LightModeIcon         from '@mui/icons-material/LightMode';
import LogoutIcon            from '@mui/icons-material/Logout';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SmartToyIcon          from '@mui/icons-material/SmartToy';

import WebcamCapture  from '../components/WebcamCapture';
import GazeIndicator  from '../components/GazeIndicator';
import AlertFeed      from '../components/AlertFeed';
import ExamTimer      from '../components/ExamTimer';
import ViolationBadge from '../components/ViolationBadge';

import { startExam, endExam, getQuestions, submitExam } from '../api';

const WS_URL           = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
const EXAM_DURATION_SEC = 3600; // 1 hour default
const FRAME_THROTTLE_MS = 1000; // max 1 frame/sec over WS (belt-and-suspenders)

// Fallback questions for demo/offline mode — mirrors V3__questions.sql seed
const FALLBACK_QUESTIONS = [
  {
    id: 'q1', content: 'A train travels at 60 km/h for 2 hours and then at 80 km/h for 3 hours. What is the average speed for the entire journey?',
    optionA: '68 km/h', optionB: '72 km/h', optionC: '70 km/h', optionD: '75 km/h',
    difficulty: 'MEDIUM', marks: 2,
  },
  {
    id: 'q2', content: 'If ROSE is coded as 6821 and CHAIR is coded as 73456, what is the code for SEARCH?',
    optionA: '214673', optionB: '246173', optionC: '214637', optionD: '214763',
    difficulty: 'HARD', marks: 3,
  },
  {
    id: 'q3', content: 'A man is 24 years older than his son. In two years, his age will be twice the age of his son. What is the present age of his son?',
    optionA: '20 years', optionB: '22 years', optionC: '24 years', optionD: '18 years',
    difficulty: 'EASY', marks: 1,
  },
  {
    id: 'q4', content: 'Which number should come next in the series: 2, 6, 12, 20, 30, ?',
    optionA: '40', optionB: '42', optionC: '44', optionD: '46',
    difficulty: 'MEDIUM', marks: 2,
  },
  {
    id: 'q5', content: 'In a class of 60 students, the ratio of boys to girls is 2:1. How many girls are in the class?',
    optionA: '15', optionB: '20', optionC: '25', optionD: '30',
    difficulty: 'EASY', marks: 1,
  },
  {
    id: 'q6', content: 'A can do a piece of work in 10 days and B can do it in 15 days. In how many days will both together complete the work?',
    optionA: '5 days', optionB: '6 days', optionC: '8 days', optionD: '12 days',
    difficulty: 'MEDIUM', marks: 2,
  },
  {
    id: 'q7', content: 'What is the next term in the series: 1, 4, 9, 16, 25, ?',
    optionA: '30', optionB: '35', optionC: '36', optionD: '49',
    difficulty: 'EASY', marks: 1,
  },
  {
    id: 'q8', content: 'Which number should replace the "?" in the series: 3, 7, 15, 31, 63, ?',
    optionA: '95', optionB: '111', optionC: '127', optionD: '125',
    difficulty: 'MEDIUM', marks: 2,
  },
];

const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const DIFFICULTY_COLORS = {
  EASY:   { bg: 'rgba(16,185,129,0.1)',  color: '#065F46', border: 'rgba(16,185,129,0.3)'  },
  MEDIUM: { bg: 'rgba(245,158,11,0.1)', color: '#92400E', border: 'rgba(245,158,11,0.3)'  },
  HARD:   { bg: 'rgba(239,68,68,0.1)',  color: '#991B1B', border: 'rgba(239,68,68,0.3)'   },
};

export default function ExamRoomPage({ darkMode, onToggleDark }) {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  // ── Core state ─────────────────────────────────────────────────────────────
  const [sessionId, setSessionId]         = useState(null);
  const [alerts, setAlerts]               = useState([
    { id: 'init', alertType: 'CLEAR', severity: 'LOW', message: 'Session started. Monitoring active.', timestamp: Date.now() }
  ]);
  const [violationCount, setViolationCount] = useState(0);
  const [currentAlert, setCurrentAlert]   = useState('CLEAR');
  const [snackOpen, setSnackOpen]         = useState(false);
  const [snackMsg, setSnackMsg]           = useState('');
  const [tabHiddenWarning, setTabHiddenWarning] = useState(false);
  const [wsStatus, setWsStatus]           = useState('connecting');
  const [wsAuthReady, setWsAuthReady]     = useState(false); // true after AUTH_ACK received

  // ── Question state ─────────────────────────────────────────────────────────
  const [questions, setQuestions]         = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  // answers: { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers]             = useState({});

  const wsRef         = useRef(null);
  const webcamRef     = useRef(null);
  const lastSentRef   = useRef(0); // Fix 2: WS frame throttle timestamp
  const questionRefs  = useRef({});  // for scroll-to-question
  const student       = JSON.parse(localStorage.getItem('nirikshak_student') || '{}');
  const token         = localStorage.getItem('nirikshak_token');

  const isDemoMode = token === 'demo-offline-token';

  // Submit dialog state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitResult, setSubmitResult]         = useState(null); // null | { score, totalMarks, correct, total, passed }
  const [submitting, setSubmitting]             = useState(false);
  const [navOpen, setNavOpen]                   = useState(false); // question navigator panel

  // ── Load questions ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadQuestions = async () => {
      setQuestionsLoading(true);
      if (isDemoMode) {
        // Offline demo — use seeded fallback
        setQuestions(FALLBACK_QUESTIONS);
        setQuestionsLoading(false);
        return;
      }
      try {
        const { data } = await getQuestions(examId);
        setQuestions(data.length > 0 ? data : FALLBACK_QUESTIONS);
      } catch (e) {
        console.warn('Failed to fetch questions — using local fallback', e);
        setQuestions(FALLBACK_QUESTIONS);
      } finally {
        setQuestionsLoading(false);
      }
    };
    loadQuestions();
  }, [examId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start exam session on mount ────────────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      setSessionId('demo-session-' + Date.now());
      setWsStatus('disconnected');
      return;
    }
    (async () => {
      try {
        const { data } = await startExam({ examId });
        setSessionId(data.id);
        connectWebSocket(data.id);
      } catch (e) {
        console.error('Failed to start exam session', e);
        const fallbackId = 'offline-session-' + Date.now();
        setSessionId(fallbackId);
        setSnackMsg('Backend offline — running in demo mode. Camera is active.');
        setSnackOpen(true);
        setWsStatus('disconnected');
      }
    })();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page Visibility API — tab switch warning ───────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setTabHiddenWarning(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── Paste / copy-paste violation detection ────────────────────────────────
  useEffect(() => {
    const handlePaste = (e) => {
      // Pastes during an exam are a cheating signal
      const pasteAlert = {
        alertType:   'COPY_PASTE_DETECTED',
        severity:    'HIGH',
        message:     'Copy-paste detected during exam.',
        description: 'Copy-paste detected during exam.',
        timestamp:   Date.now(),
        id:          Date.now(),
      };
      setAlerts((prev) => [...prev, pasteAlert]);
      setViolationCount((c) => c + 1);
      setSnackMsg('⚠ Copy-paste detected! This has been recorded.');
      setSnackOpen(true);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // ── WebSocket connection (Fix 4: post-handshake AUTH) ─────────────────────
  const connectWebSocket = useCallback((sid) => {
    // No token in URL — security fix. Token sent as first message after open.
    const ws = new WebSocket(`${WS_URL}/ws/exam`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      // Send AUTH message first — server will not accept frame messages until ACK
      ws.send(JSON.stringify({ type: 'AUTH', token }));
      console.log('WS connected — AUTH message sent');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle AUTH_ACK
        if (msg.type === 'AUTH_ACK') {
          if (msg.status === 'OK') {
            setWsAuthReady(true);
            console.log('WS AUTH acknowledged — frame streaming enabled');
          } else {
            console.error('WS AUTH rejected by server');
            ws.close();
            setWsStatus('disconnected');
          }
          return;
        }

        // Handle proctoring alerts (alertType field)
        const alert = msg;
        setCurrentAlert(alert.alertType);
        if (alert.alertType !== 'CLEAR') {
          setAlerts((prev) => [...prev, { ...alert, id: Date.now() }]);
          setViolationCount((c) => c + 1);
          setSnackMsg(`⚠ ${alert.alertType.replace('_', ' ')}: ${alert.message}`);
          setSnackOpen(true);
        }
      } catch (e) {
        console.error('WS message parse error', e);
      }
    };

    ws.onerror  = () => setWsStatus('disconnected');
    ws.onclose  = () => { setWsStatus('disconnected'); setWsAuthReady(false); };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send captured frames via WebSocket (Fix 2: throttled) ─────────────────
  const handleFrame = useCallback((base64Frame) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!sessionId || !wsAuthReady) return; // don't send before AUTH_ACK

    // Throttle: max 1 frame/sec over the wire regardless of capture interval
    const now = Date.now();
    if (now - lastSentRef.current < FRAME_THROTTLE_MS) return;
    lastSentRef.current = now;

    wsRef.current.send(JSON.stringify({
      sessionId,
      frameBase64: base64Frame,
      timestamp:   now,
    }));
  }, [sessionId, wsAuthReady]);

  // ── Handle local browser-side AI proctoring alerts ─────────────────────────
  const handleAlert = useCallback((result) => {
    if (!result || !result.alertType) return;
    setCurrentAlert(result.alertType);
    if (result.alertType !== 'CLEAR') {
      setAlerts((prev) => {
        // Debounce: don't add duplicate consecutive alerts of the same type within 4s
        const last = prev[prev.length - 1];
        if (last && last.alertType === result.alertType &&
            Date.now() - last.timestamp < 4000) return prev;
        return [...prev, {
          ...result,
          id:        Date.now(),
          message:   result.description,
          timestamp: Date.now(),
        }];
      });
      setViolationCount((c) => c + 1);
      setSnackMsg(`⚠ ${result.alertType.replace(/_/g, ' ')}: ${result.description}`);
      setSnackOpen(true);
    }
  }, []);

  // ── Select an answer ───────────────────────────────────────────────────────
  const handleSelectAnswer = useCallback((questionId, optionLabel) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionLabel }));
  }, []);

  // ── Submit exam ────────────────────────────────────────────────────────────
  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      const answerPayload = Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected }));
      if (isDemoMode || !sessionId || sessionId.startsWith('demo') || sessionId.startsWith('offline')) {
        // Demo mode: compute score locally from FALLBACK_QUESTIONS correct answers
        const CORRECT = { q1: 'B', q2: 'C', q3: 'B', q4: 'B', q5: 'B', q6: 'B', q7: 'C', q8: 'C' };
        let score = 0, totalMarks = 0, correct = 0;
        questions.forEach(q => { totalMarks += (q.marks || 1); });
        answerPayload.forEach(({ questionId, selected }) => {
          const q = questions.find(x => x.id === questionId);
          if (q && selected === CORRECT[questionId]) { score += (q.marks || 1); correct++; }
        });
        setSubmitResult({ score, totalMarks, correct, total: questions.length, passed: score / totalMarks >= 0.4 });
      } else {
        const { data } = await submitExam(sessionId, { answers: answerPayload });
        setSubmitResult(data);
      }
    } catch (err) {
      setSubmitResult({ score: 0, totalMarks: 0, correct: 0, total: questions.length, passed: false });
    } finally {
      setSubmitting(false);
    }
  };

  // After score shown, navigate to results
  const handleGoToResults = () => {
    if (wsRef.current) wsRef.current.close();
    webcamRef.current?.stopCapture();
    if (sessionId) navigate(`/results/${sessionId}`);
    else navigate('/login');
  };

  // ── End exam ──────────────────────────────────────────────────────────────
  const handleEndExam = async () => {
    if (wsRef.current) wsRef.current.close();
    webcamRef.current?.stopCapture();
    if (sessionId) {
      try { await endExam(sessionId, { status: 'COMPLETED' }); } catch (_) {}
      navigate(`/results/${sessionId}`);
    } else {
      navigate('/login');
    }
  };

  // ── Navbar status config ───────────────────────────────────────────────────
  const isDemoSession = isDemoMode ||
    (sessionId != null && (sessionId.startsWith('demo-session') || sessionId.startsWith('offline-session')));
  const statusConfig = {
    connected:    { label: wsAuthReady ? 'Live'    : 'Authorizing', dot: wsAuthReady ? '#10B981' : '#F59E0B' },
    connecting:   { label: 'Connecting',  dot: '#F59E0B' },
    disconnected: { label: isDemoSession ? 'Demo Mode' : 'Offline',  dot: isDemoSession ? '#818CF8' : '#EF4444' },
  };
  const statusCfg = statusConfig[wsStatus];

  // ── Total marks calculation ────────────────────────────────────────────────
  const totalMarks    = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

      {/* ── Tab-Switch Warning ────────────────────────────────────────────── */}
      <Dialog open={tabHiddenWarning} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: 'rgba(15,14,26,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(239,68,68,0.3)' } }}
      >
        <DialogTitle sx={{ color: '#F87171', fontWeight: 700 }}>⚠️ Tab Switch Detected</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            You switched away from the exam tab. This violation has been recorded. Return immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="contained" color="error" onClick={() => setTabHiddenWarning(false)} fullWidth>
            Return to Exam
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Submit Confirmation + Score Dialog ─────────────────────────── */}
      <Dialog open={submitDialogOpen} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: 'rgba(15,14,26,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px' } }}
      >
        {!submitResult ? (
          <>
            <DialogTitle sx={{ color: '#E8E7FF', fontWeight: 700 }}>📝 Submit Exam?</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
                You have answered <strong style={{ color: '#A5B4FC' }}>{answeredCount}</strong> of <strong style={{ color: '#A5B4FC' }}>{questions.length}</strong> questions.
                {answeredCount < questions.length && ' Unanswered questions will be marked incorrect.'}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
              <Button variant="outlined" onClick={() => setSubmitDialogOpen(false)} sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: '10px' }}>Cancel</Button>
              <Button id="btn-confirm-submit" variant="contained" onClick={handleSubmitExam} disabled={submitting}
                sx={{ borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', flex: 1 }}>
                {submitting ? <CircularProgress size={18} color="inherit" /> : 'Submit & Score →'}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ color: '#E8E7FF', fontWeight: 700, textAlign: 'center', pt: 3 }}>
              {submitResult.passed ? '🎉 Passed!' : '❌ Try Again'}
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center' }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '3rem', fontWeight: 900, color: submitResult.passed ? '#10B981' : '#EF4444', lineHeight: 1 }}>
                  {submitResult.score}/{submitResult.totalMarks}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mt: 0.5 }}>
                  {submitResult.correct} of {submitResult.total} correct
                </Typography>
              </Box>
              <Box sx={{ height: 8, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden', mb: 2 }}>
                <Box sx={{ height: '100%', borderRadius: 99, width: `${submitResult.totalMarks > 0 ? (submitResult.score / submitResult.totalMarks) * 100 : 0}%`, background: submitResult.passed ? 'linear-gradient(90deg,#10B981,#34D399)' : 'linear-gradient(90deg,#EF4444,#F87171)', transition: 'width 1s ease' }} />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button id="btn-view-report" variant="contained" onClick={handleGoToResults} fullWidth
                sx={{ borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}>
                View Full Report →
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── APPBAR ────────────────────────────────────────────────────────── */}
      <AppBar position="sticky" sx={{ zIndex: 1200 }}>
        <Toolbar sx={{ gap: 1, minHeight: '60px !important' }}>
          {/* Logo + wordmark */}
          <Box component="img" src="/logo.png" alt="Logo"
            sx={{ width: 32, height: 32, mr: 0.5, filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.6))' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mr: 1.5, fontSize: '1.05rem' }}>
            Nirikshak <Box component="span" sx={{ color: '#A5B4FC' }}>AI</Box>
          </Typography>

          {/* Session chip */}
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: `${statusCfg.dot} !important` }} />}
            label={sessionId ? `${sessionId.slice(0, 8)}…` : 'Starting…'}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontFamily: 'monospace' }}
          />

          {/* Status pill */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusCfg.dot, boxShadow: `0 0 6px ${statusCfg.dot}` }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 600 }}>
              {statusCfg.label}
            </Typography>
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Progress chip */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.4, bgcolor: 'rgba(16,185,129,0.12)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Typography variant="caption" sx={{ color: '#6EE7B7', fontSize: '0.67rem', fontWeight: 700 }}>
                {answeredCount}/{questions.length} ans
              </Typography>
            </Box>

            {/* AI ON badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.4, bgcolor: 'rgba(129,140,248,0.15)', borderRadius: '8px', border: '1px solid rgba(129,140,248,0.25)' }}>
              <SmartToyIcon sx={{ fontSize: 14, color: '#A5B4FC' }} />
              <Typography variant="caption" sx={{ color: '#A5B4FC', fontSize: '0.67rem', fontWeight: 700 }}>AI ON</Typography>
            </Box>

            <ExamTimer durationSeconds={EXAM_DURATION_SEC} onExpire={handleEndExam} />
            <ViolationBadge violationCount={violationCount} />

            <Tooltip title="Toggle dark mode">
              <IconButton color="inherit" onClick={onToggleDark} size="small" id="btn-dark-toggle"
                sx={{ bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
                {darkMode ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            {/* Submit Exam */}
            <Button
              id="btn-submit-exam"
              variant="contained"
              size="small"
              onClick={() => { setSubmitResult(null); setSubmitDialogOpen(true); }}
              sx={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.75rem',
                px: 1.5,
                py: 0.5,
                '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)', transform: 'translateY(-1px)' },
                transition: 'all 0.15s ease',
              }}
            >
              Submit
            </Button>

            <Tooltip title="End exam without submitting">
              <IconButton id="btn-end-exam" onClick={handleEndExam} size="small"
                sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)', '&:hover': { bgcolor: 'rgba(239,68,68,0.28)' } }}>
                <LogoutIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        {wsStatus === 'connecting' && <LinearProgress color="secondary" sx={{ height: 2 }} />}
      </AppBar>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

        {/* LEFT — Monitoring panel */}
        <Box
          sx={{
            width: isMobile ? '100%' : 300,
            flexShrink: 0,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderRight: isMobile ? 'none' : '1px solid',
            borderBottom: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 3, height: 16, bgcolor: 'primary.main', borderRadius: 99 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.67rem' }}>
              Live Monitoring
            </Typography>
          </Box>

          <WebcamCapture
            ref={webcamRef}
            onFrame={handleFrame}
            onAlert={handleAlert}
            hasViolation={currentAlert !== 'CLEAR'}
          />

          <GazeIndicator alertType={currentAlert} />

          {/* Student info card */}
          <Box sx={{ mt: 'auto', p: 1.5, borderRadius: '12px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)' }}>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.67rem', mb: 0.3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Student</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{student.name || 'Unknown'}</Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.67rem', fontFamily: 'monospace' }}>{examId}</Typography>
          </Box>
        </Box>

        {/* RIGHT — Exam content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Warm white + light-yellow OR dark gradient scrollable question area */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2, md: 3 },
              overflowY: 'auto',
              background: isDark
                ? 'linear-gradient(160deg, #0F0E1A 0%, #12103A 55%, #14103A 100%)'
                : 'linear-gradient(160deg, #FFFFFF 0%, #FFFDE7 55%, #FFF9C4 100%)',
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: isDark ? '#E8E7FF' : '#1A1860' }}>
                General Aptitude
              </Typography>
              <Chip label={`${questions.length} Questions`} size="small"
                sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#4338CA', fontWeight: 600, border: '1px solid rgba(99,102,241,0.25)' }}
              />
              <Chip label={`${totalMarks} Marks`} size="small"
                sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#92400E', fontWeight: 600, border: '1px solid rgba(245,158,11,0.3)' }}
              />
              <Chip label={`${answeredCount} Answered`} size="small"
                sx={{ bgcolor: answeredCount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: answeredCount > 0 ? '#065F46' : '#374151', fontWeight: 600, border: '1px solid', borderColor: answeredCount > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.2)' }}
              />
              <Box sx={{ ml: 'auto' }}>
                <Button size="small" onClick={() => setNavOpen(n => !n)}
                  sx={{ fontSize: '0.72rem', color: isDark ? '#A5B4FC' : '#4338CA', border: '1px solid', borderColor: isDark ? 'rgba(129,140,248,0.3)' : 'rgba(99,102,241,0.3)', borderRadius: '8px', px: 1.2 }}>
                  {navOpen ? 'Hide Navigator ▲' : 'Question Navigator ▼'}
                </Button>
              </Box>
            </Box>

            {/* Question Navigator Palette */}
            {navOpen && (
              <Box sx={{ mb: 2.5, p: 2, borderRadius: '14px', background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.15)' }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>Jump to Question</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {questions.map((q, qi) => {
                    const isAnswered = !!answers[q.id];
                    return (
                      <Box
                        key={q.id}
                        id={`nav-q${qi + 1}`}
                        onClick={() => {
                          const el = document.getElementById(`question-card-${qi}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        sx={{
                          width: 34, height: 34, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                          background: isAnswered ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                          border: '1.5px solid', borderColor: isAnswered ? '#10B981' : 'rgba(129,140,248,0.2)',
                          color: isAnswered ? '#10B981' : (isDark ? '#A5B4FC' : '#4338CA'),
                          transition: 'all 0.15s ease',
                          '&:hover': { transform: 'scale(1.1)', borderColor: '#6366F1', color: '#6366F1' },
                        }}
                      >
                        {qi + 1}
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: '#10B981', border: '1px solid #10B981' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Answered ({answeredCount})</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(129,140,248,0.3)' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Unanswered ({questions.length - answeredCount})</Typography>
                  </Box>
                </Box>
              </Box>
            )}


            {/* Questions loading state */}
            {questionsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                <CircularProgress size={28} sx={{ color: '#6366F1' }} />
                <Typography variant="body2" sx={{ color: '#6B7280' }}>Loading questions…</Typography>
              </Box>
            ) : (
              questions.map((q, qi) => {
                const selectedAnswer = answers[q.id];
                const diffColors = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.MEDIUM;

                return (
                  <Paper
                    key={q.id}
                    id={`question-card-${qi}`}
                    sx={{
                      p: 3,
                      mb: 2,
                      borderRadius: '16px',
                      background: isDark
                        ? (selectedAnswer ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)')
                        : (selectedAnswer ? '#FFFFFF' : '#FFFFFF'),
                      border: '1.5px solid',
                      borderColor: selectedAnswer
                        ? 'rgba(99,102,241,0.35)'
                        : (isDark ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.15)'),
                      boxShadow: selectedAnswer
                        ? '0 4px 16px rgba(99,102,241,0.12)'
                        : (isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(99,102,241,0.06)'),
                      position: 'relative',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Q number + difficulty + marks */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ px: 1, py: 0.2, borderRadius: '6px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#6366F1', letterSpacing: '0.08em' }}>
                          Q{qi + 1}
                        </Typography>
                      </Box>
                      <Chip
                        label={q.difficulty}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: diffColors.bg, color: diffColors.color, border: `1px solid ${diffColors.border}` }}
                      />
                      <Chip
                        label={`${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(107,114,128,0.08)', color: '#4B5563', border: '1px solid rgba(107,114,128,0.15)' }}
                      />
                      {selectedAnswer && (
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#10B981' }}>Answered</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Question text */}
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: isDark ? '#E8E7FF' : '#1A1860', lineHeight: 1.65 }}>
                      {q.content}
                    </Typography>

                    {/* Options */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {OPTION_KEYS.map((key, i) => {
                        const label = OPTION_LABELS[i];
                        const isSelected = selectedAnswer === label;
                        return (
                          <Box
                            key={label}
                            id={`q${qi + 1}-opt-${label}`}
                            onClick={() => handleSelectAnswer(q.id, label)}
                            role="button"
                            aria-pressed={isSelected}
                            sx={{
                              px: 2,
                              py: 0.85,
                              borderRadius: '9px',
                              border: '1.5px solid',
                              borderColor: isSelected ? '#6366F1' : 'rgba(99,102,241,0.2)',
                              cursor: 'pointer',
                              fontSize: '0.84rem',
                              fontWeight: isSelected ? 600 : 500,
                              color: isSelected ? '#4338CA' : (isDark ? '#C4B5FD' : '#374151'),
                              background: isSelected
                                ? 'rgba(99,102,241,0.12)'
                                : (isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFE'),
                              transition: 'all 0.15s ease',
                              userSelect: 'none',
                              boxShadow: isSelected ? '0 2px 8px rgba(99,102,241,0.18)' : 'none',
                              '&:hover': {
                                borderColor: '#6366F1',
                                color: '#4338CA',
                                background: 'rgba(99,102,241,0.07)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                              },
                              '&:active': { transform: 'translateY(0)' },
                            }}
                          >
                            <Box component="span" sx={{ color: isSelected ? '#6366F1' : '#9CA3AF', mr: 0.75, fontWeight: 700 }}>
                              {label}.
                            </Box>
                            {q[key]}
                          </Box>
                        );
                      })}
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>

          {/* Alert feed strip */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', height: 190, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 3, height: 14, bgcolor: violationCount > 0 ? 'error.main' : 'success.main', borderRadius: 99, transition: 'background-color 0.3s' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.67rem' }}>
                Live Alert Feed
              </Typography>
              <Chip
                label={`${violationCount} violations`}
                size="small"
                sx={{ ml: 'auto', height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: violationCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)', color: violationCount > 0 ? 'error.main' : 'success.main', border: '1px solid', borderColor: violationCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)' }}
              />
            </Box>
            <AlertFeed alerts={alerts} />
          </Box>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={currentAlert === 'MULTIPLE_FACES' || currentAlert === 'NO_FACE' ? 'error' : 'warning'} onClose={() => setSnackOpen(false)} sx={{ width: '100%', borderRadius: '12px', fontWeight: 500 }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
