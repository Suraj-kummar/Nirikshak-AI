import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GroupsIcon        from '@mui/icons-material/Groups';
import PersonOffIcon     from '@mui/icons-material/PersonOff';

const ringPulse = keyframes`
  0%   { transform: scale(1);   opacity: 0.8; }
  50%  { transform: scale(1.6); opacity: 0;   }
  100% { transform: scale(1);   opacity: 0;   }
`;
const spinSlow = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const CONFIGS = {
  CLEAR: {
    label: 'Looking at Screen',
    sub: 'Attention confirmed',
    Icon: VisibilityIcon,
    color: '#34D399',
    glow: 'rgba(52,211,153,0.3)',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)',
    border: 'rgba(52,211,153,0.25)',
    pulse: false,
  },
  GAZE_AWAY: {
    label: 'Gaze Deviation',
    sub: 'Looking off-screen',
    Icon: VisibilityOffIcon,
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.35)',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.04) 100%)',
    border: 'rgba(251,191,36,0.35)',
    pulse: true,
  },
  MULTIPLE_FACES: {
    label: 'Multiple Faces',
    sub: 'Impersonation risk',
    Icon: GroupsIcon,
    color: '#F87171',
    glow: 'rgba(248,113,113,0.4)',
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.04) 100%)',
    border: 'rgba(248,113,113,0.35)',
    pulse: true,
  },
  NO_FACE: {
    label: 'No Face Detected',
    sub: 'Student may have left',
    Icon: PersonOffIcon,
    color: '#F87171',
    glow: 'rgba(248,113,113,0.4)',
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.04) 100%)',
    border: 'rgba(248,113,113,0.35)',
    pulse: true,
  },
};

export default function GazeIndicator({ alertType }) {
  const cfg = CONFIGS[alertType] || CONFIGS.CLEAR;
  const { Icon } = cfg;

  return (
    <Box
      id="gaze-indicator-chip"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: '12px 16px',
        borderRadius: '14px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.pulse ? `0 0 20px ${cfg.glow}` : 'none',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle shimmer line on top */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent, ${cfg.color}66, transparent)`,
      }} />

      {/* Animated orb indicator */}
      <Box sx={{ position: 'relative', flexShrink: 0, width: 36, height: 36 }}>
        {cfg.pulse && (
          <>
            <Box sx={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: `1.5px solid ${cfg.color}`,
              animation: `${ringPulse} 1.5s ease-out infinite`,
            }} />
            <Box sx={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: `1.5px solid ${cfg.color}`,
              animation: `${ringPulse} 1.5s ease-out 0.5s infinite`,
            }} />
          </>
        )}
        {/* Icon container */}
        <Box sx={{
          position: 'absolute', inset: 4,
          borderRadius: '50%',
          background: `${cfg.color}22`,
          border: `1.5px solid ${cfg.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...(cfg.pulse && { animation: `${spinSlow} 8s linear infinite` }),
        }}>
          <Icon sx={{ fontSize: 14, color: cfg.color }} />
        </Box>
      </Box>

      {/* Text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          display: 'block', fontWeight: 800, fontSize: '0.77rem',
          color: cfg.color, lineHeight: 1.2,
          fontFamily: '"Outfit", sans-serif',
          letterSpacing: '0.01em',
        }}>
          {cfg.label}
        </Typography>
        <Typography sx={{
          display: 'block', fontSize: '0.64rem',
          color: 'rgba(255,255,255,0.45)', mt: 0.3, fontWeight: 500,
        }}>
          {cfg.sub}
        </Typography>
      </Box>

      {/* Status dot */}
      <Box sx={{
        width: 8, height: 8, borderRadius: '50%',
        bgcolor: cfg.color,
        boxShadow: `0 0 8px ${cfg.color}`,
        flexShrink: 0,
        animation: cfg.pulse ? `${ringPulse} 1.2s ease-out infinite` : 'none',
      }} />
    </Box>
  );
}
