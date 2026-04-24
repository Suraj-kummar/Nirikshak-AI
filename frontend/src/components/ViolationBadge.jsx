import React, { useEffect, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { keyframes as muiKf } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const pop = muiKf`
  0%   { transform: scale(1); }
  30%  { transform: scale(1.55); }
  65%  { transform: scale(0.9); }
  100% { transform: scale(1); }
`;
const glowPulse = muiKf`
  0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
  40%      { box-shadow: 0 0 16px 6px rgba(248,113,113,0.45); }
`;

export default function ViolationBadge({ violationCount }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (violationCount > 0) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 900);
      return () => clearTimeout(t);
    }
  }, [violationCount]);

  const has = violationCount > 0;

  return (
    <Tooltip title={`${violationCount} violation${violationCount !== 1 ? 's' : ''} recorded`} arrow>
      <Box
        id="violation-badge"
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.7,
          px: 1.3, py: 0.55, borderRadius: '10px',
          background: has ? 'rgba(248,113,113,0.14)' : 'rgba(52,211,153,0.08)',
          border: `1.5px solid ${has ? 'rgba(248,113,113,0.35)' : 'rgba(52,211,153,0.2)'}`,
          cursor: 'default', transition: 'all 0.35s ease',
          animation: animate ? `${pop} 0.9s ease, ${glowPulse} 0.9s ease` : 'none',
        }}
      >
        <WarningAmberIcon sx={{
          fontSize: 16,
          color: has ? '#F87171' : '#34D399',
          transition: 'color 0.3s ease',
          filter: has ? 'drop-shadow(0 0 4px rgba(248,113,113,0.7))' : 'none',
        }} />
        <Typography sx={{
          fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
          fontSize: '0.85rem', color: has ? '#F87171' : '#34D399',
          transition: 'color 0.3s ease', minWidth: 14, textAlign: 'center',
        }}>
          {violationCount > 99 ? '99+' : violationCount}
        </Typography>
      </Box>
    </Tooltip>
  );
}
