import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress,
  Button, LinearProgress, useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon       from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon       from '@mui/icons-material/ErrorOutline';
import ShieldIcon             from '@mui/icons-material/Shield';
import PersonOffIcon          from '@mui/icons-material/PersonOff';
import GroupsIcon             from '@mui/icons-material/Groups';
import VisibilityOffIcon      from '@mui/icons-material/VisibilityOff';
import HomeIcon               from '@mui/icons-material/Home';

import { getViolationReport } from '../api';
import { formatIST, formatDuration } from '../utils/timeUtils';

// ── Sub-components ────────────────────────────────────────────────────────────

function IntegrityRing({ score }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const color  = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const label  = score >= 80 ? 'Excellent' : score >= 60 ? 'Moderate' : 'Poor';
  const r      = 52;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}
            strokeWidth="10"
          />
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
              filter: `drop-shadow(0 0 6px ${color}88)`,
            }}
          />
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '2rem', color, lineHeight: 1 }}>{score}</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600, mt: 0.3 }}>/100</Typography>
        </Box>
      </Box>
      <Chip
        label={label}
        size="small"
        sx={{ fontWeight: 700, bgcolor: `${color}22`, color, border: `1px solid ${color}44`, fontSize: '0.75rem', px: 0.5 }}
      />
    </Box>
  );
}

function StatCard({ icon, label, value, color, sublabel }) {
  return (
    <Box sx={{
      p: 2.5, borderRadius: '16px',
      background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
      border: `1px solid ${color}2a`,
      display: 'flex', flexDirection: 'column', gap: 0.5,
      transition: 'transform 0.2s ease',
      '&:hover': { transform: 'translateY(-2px)' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
        <Typography sx={{ fontWeight: 800, fontSize: '2rem', color, lineHeight: 1 }}>{value}</Typography>
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary' }}>{label}</Typography>
      {sublabel && <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{sublabel}</Typography>}
    </Box>
  );
}

const SEV_STYLES = {
  HIGH:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  color: '#F87171' },
  MEDIUM: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#FBBF24' },
  LOW:    { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#34D399' },
};

const ALERT_META = {
  GAZE_AWAY:      { label: 'Gaze Away',     icon: <VisibilityOffIcon      sx={{ fontSize: 14 }} />, color: '#F59E0B' },
  MULTIPLE_FACES: { label: 'Multiple Faces', icon: <GroupsIcon             sx={{ fontSize: 14 }} />, color: '#EF4444' },
  NO_FACE:        { label: 'No Face',        icon: <PersonOffIcon          sx={{ fontSize: 14 }} />, color: '#EF4444' },
  CLEAR:          { label: 'Clear',          icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />, color: '#10B981' },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id: sessionId } = useParams();
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isDark    = theme.palette.mode === 'dark';
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getViolationReport(sessionId);
        setReport(data);
      } catch (e) {
        setError('Failed to load violation report. The session may not exist.');
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3,
      background: isDark
        ? 'radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #07060F 60%)'
        : 'radial-gradient(ellipse at 20% 50%, #EEF2FF 0%, #F8F7FF 60%)',
    }}>
      <Box sx={{ position: 'relative', width: 80, height: 80 }}>
        <CircularProgress size={80} thickness={2} sx={{ color: '#6366F1', position: 'absolute' }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldIcon sx={{ fontSize: 28, color: '#818CF8' }} />
        </Box>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: isDark ? '#F1F0FF' : '#1A1860' }}>
          Generating Report
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
          Analysing session integrity data…
        </Typography>
      </Box>
    </Box>
  );

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2,
      background: isDark ? 'radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #07060F 60%)' : '#F8F7FF',
    }}>
      <Box sx={{ p: 3, borderRadius: '20px', bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', textAlign: 'center', maxWidth: 400 }}>
        <ErrorOutlineIcon sx={{ fontSize: 52, color: '#F87171', mb: 1.5 }} />
        <Typography sx={{ fontWeight: 700, color: '#F87171', mb: 1 }}>Report Unavailable</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>{error}</Typography>
        <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </Box>
    </Box>
  );

  const integrityScore = Math.max(0, Math.round(100 - (report.totalViolations * 5)));

  return (
    <Box sx={{
      minHeight: '100vh',
      background: isDark
        ? 'radial-gradient(ellipse at 10% 0%, #1e1b4b 0%, #07060F 55%), radial-gradient(ellipse at 90% 100%, #14103a 0%, transparent 50%)'
        : 'radial-gradient(ellipse at 10% 0%, #EEF2FF 0%, #F8F7FF 60%)',
      p: { xs: 2, md: 4 },
    }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{
          p: 1.5, borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(124,58,237,0.15) 100%)',
          border: '1px solid rgba(129,140,248,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldIcon sx={{ fontSize: 28, color: '#818CF8' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: isDark ? '#F1F0FF' : '#1A1860' }}>
            Exam Report
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            {report.studentName} · {report.examId} · Duration: {formatDuration(report.durationSeconds)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', opacity: 0.6 }}>
            Session: {sessionId}
          </Typography>
        </Box>
        <Button
          id="btn-back-login"
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/login')}
          sx={{ borderRadius: '12px', fontWeight: 600, mt: { xs: 1, md: 0 } }}
        >
          New Exam
        </Button>
      </Box>

      {/* ── MAIN GRID — integrity ring + stat cards ──────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' }, gap: 3, mb: 3 }}>

        {/* Integrity score card */}
        <Box sx={{
          borderRadius: '22px', p: 3,
          background: isDark ? 'rgba(15,14,26,0.8)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(129,140,248,0.15)' : '1px solid rgba(99,102,241,0.15)',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(99,102,241,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          minHeight: 300,
        }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem' }}>
            Integrity Score
          </Typography>
          <IntegrityRing score={integrityScore} />
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={integrityScore}
              sx={{
                height: 8, borderRadius: 99,
                bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 99,
                  background: integrityScore >= 80
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : integrityScore >= 60
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                    : 'linear-gradient(90deg, #EF4444, #F87171)',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', mt: 0.8, display: 'block', textAlign: 'center' }}>
              −5 pts per violation · max 100
            </Typography>
          </Box>
        </Box>

        {/* Stat cards 2x2 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <StatCard
            icon={<WarningAmberIcon />}
            label="Total Violations"
            value={report.totalViolations}
            color={report.totalViolations > 0 ? '#EF4444' : '#10B981'}
            sublabel={report.totalViolations === 0 ? 'Clean session' : 'Recorded events'}
          />
          <StatCard icon={<VisibilityOffIcon />} label="Gaze Away"      value={report.gazeAwayCount}      color="#F59E0B" sublabel="Off-screen detections" />
          <StatCard icon={<GroupsIcon />}        label="Multiple Faces" value={report.multipleFacesCount} color="#EF4444" sublabel="Impersonation risk"    />
          <StatCard icon={<PersonOffIcon />}     label="No Face"        value={report.noFaceCount}        color="#EF4444" sublabel="Student absent"        />
        </Box>
      </Box>

      {/* ── VIOLATION TIMELINE ───────────────────────────────────────────────── */}
      <Box sx={{
        borderRadius: '22px',
        background: isDark ? 'rgba(15,14,26,0.8)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(129,140,248,0.12)' : '1px solid rgba(99,102,241,0.12)',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(99,102,241,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header row */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 3, height: 18, bgcolor: 'primary.main', borderRadius: 99 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Violation Timeline</Typography>
          <Chip
            label={`${report.violations.length} events`}
            size="small"
            sx={{
              ml: 'auto', fontWeight: 700, fontSize: '0.7rem',
              bgcolor: report.violations.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)',
              color:   report.violations.length > 0 ? '#F87171' : '#34D399',
              border: '1px solid',
              borderColor: report.violations.length > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)',
            }}
          />
        </Box>

        {report.violations.length === 0 ? (
          /* Empty state */
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
            <Box sx={{ p: 2.5, borderRadius: '50%', bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 40, color: '#10B981' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#10B981' }}>Perfect Session</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>No violations recorded. Excellent integrity!</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            {/* Column headers */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '48px 140px 160px 90px 110px 1fr',
              px: 3, py: 1.2,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)',
              borderBottom: '1px solid', borderColor: 'divider',
              minWidth: 700,
            }}>
              {['#', 'Time (IST)', 'Alert Type', 'Severity', 'Confidence', 'Description'].map(h => (
                <Typography key={h} sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Rows */}
            <Box sx={{
              maxHeight: 380, overflowY: 'auto', minWidth: 700,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { borderRadius: 99, bgcolor: 'rgba(129,140,248,0.3)' },
            }}>
              {report.violations.map((v, idx) => {
                const sev    = SEV_STYLES[v.severity] || SEV_STYLES.LOW;
                const meta   = ALERT_META[v.alertType] || ALERT_META.CLEAR;
                const isEven = idx % 2 === 0;
                return (
                  <Box
                    key={v.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '48px 140px 160px 90px 110px 1fr',
                      px: 3, py: 1.5,
                      alignItems: 'center',
                      bgcolor: isEven
                        ? (isDark ? 'transparent' : 'rgba(99,102,241,0.02)')
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.04)'),
                      borderBottom: '1px solid', borderColor: 'divider',
                      transition: 'background 0.15s ease',
                      '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.06)' : 'rgba(99,102,241,0.08)' },
                      animation: `rowIn 0.3s ease ${idx * 0.04}s both`,
                      '@keyframes rowIn': {
                        from: { opacity: 0, transform: 'translateX(-6px)' },
                        to:   { opacity: 1, transform: 'translateX(0)' },
                      },
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{idx + 1}</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary' }}>{formatIST(v.timestamp)}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ color: meta.color, display: 'flex' }}>{meta.icon}</Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: meta.color }}>{meta.label}</Typography>
                    </Box>
                    <Chip label={v.severity} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ flex: 1, height: 4, borderRadius: 99, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', borderRadius: 99, width: `${(v.confidence * 100).toFixed(0)}%`, bgcolor: sev.color, transition: 'width 0.8s ease' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: sev.color, minWidth: 28 }}>{(v.confidence * 100).toFixed(0)}%</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1 }}>
                      {v.description}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
        <ShieldIcon sx={{ fontSize: 12, color: 'text.secondary', opacity: 0.4 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.5, fontSize: '0.68rem' }}>
          Nirikshak AI · All timestamps in IST (UTC+5:30)
        </Typography>
      </Box>
    </Box>
  );
}
