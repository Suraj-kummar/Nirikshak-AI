import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatIST } from '../utils/timeUtils';

const SEV = {
  HIGH:   { color: '#F87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.22)',  dot: '#F87171',  label: 'HIGH'   },
  MEDIUM: { color: '#FBBF24', bg: 'rgba(251,191,36,0.07)',   border: 'rgba(251,191,36,0.22)',   dot: '#FBBF24',  label: 'MED'    },
  LOW:    { color: '#34D399', bg: 'rgba(52,211,153,0.07)',   border: 'rgba(52,211,153,0.2)',    dot: '#34D399',  label: 'LOW'    },
};

const LABELS = {
  GAZE_AWAY:      'Gaze Deviation',
  MULTIPLE_FACES: 'Multiple Faces',
  NO_FACE:        'No Face',
  CLEAR:          'All Clear',
};

const ICONS = {
  GAZE_AWAY:      '👁',
  MULTIPLE_FACES: '👥',
  NO_FACE:        '🚫',
  CLEAR:          '✓',
};

export default function AlertFeed({ alerts }) {
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alerts]);

  return (
    <Box
      id="alert-feed-container"
      sx={{
        height: '100%', overflowY: 'auto', p: 1,
        display: 'flex', flexDirection: 'column', gap: 0.5,
        fontFamily: '"JetBrains Mono", monospace',
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': { borderRadius: 99, bgcolor: 'rgba(129,140,248,0.25)' },
      }}
    >
      {/* Terminal header line */}
      <Box sx={{ px: 1.5, py: 0.5, opacity: 0.3 }}>
        <Typography sx={{ fontFamily: 'inherit', fontSize: '0.6rem', color: '#6EE7B7', letterSpacing: '0.05em' }}>
          $ nirikshak --monitor --session live
        </Typography>
      </Box>

      {alerts.length === 0 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, opacity: 0.35 }}>
          <Typography sx={{ fontSize: '1.2rem' }}>🛡️</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#34D399', fontFamily: 'inherit', letterSpacing: '0.06em' }}>
            [SYSTEM] No violations detected
          </Typography>
        </Box>
      )}

      {alerts.map((alert, idx) => {
        const s = SEV[alert.severity] || SEV.LOW;
        const isLatest = idx === alerts.length - 1;
        const icon = ICONS[alert.alertType] || '•';
        const label = LABELS[alert.alertType] || alert.alertType;
        return (
          <Box
            key={alert.id || idx}
            sx={{
              display: 'flex', alignItems: 'flex-start', gap: 1,
              px: 1.2, py: 0.75, borderRadius: '8px',
              background: s.bg,
              borderLeft: `2.5px solid ${s.color}`,
              border: `1px solid ${s.border}`,
              borderLeftWidth: '2.5px',
              animation: isLatest ? 'slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1)' : 'none',
              transition: 'background 0.2s ease',
              '&:hover': { background: `${s.bg.replace('0.08','0.13').replace('0.07','0.12')}` },
            }}
          >
            {/* Dot */}
            <Box sx={{ pt: 0.35, flexShrink: 0 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Top row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mb: 0.15 }}>
                <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                  {formatIST(alert.timestamp)}
                </Typography>
                <Box sx={{
                  px: 0.7, py: 0.1, borderRadius: '4px',
                  background: `${s.color}22`, border: `1px solid ${s.color}44`,
                }}>
                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: s.color, fontFamily: 'inherit', letterSpacing: '0.06em' }}>
                    {s.label}
                  </Typography>
                </Box>
              </Box>

              {/* Main label */}
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: s.color, fontFamily: 'inherit', letterSpacing: '0.02em', lineHeight: 1.3 }}>
                {icon} {label}
              </Typography>

              {/* Description */}
              {(alert.message || alert.description) && (
                <Typography sx={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.38)', mt: 0.2, fontFamily: 'inherit', display: 'block', letterSpacing: '0.01em' }}>
                  {alert.message || alert.description}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
      <div ref={bottomRef} />
    </Box>
  );
}
