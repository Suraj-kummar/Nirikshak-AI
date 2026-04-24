import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const R = 22;
const CIRC = 2 * Math.PI * R;

export default function ExamTimer({ durationSeconds = 3600, onExpire }) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => { setRemaining(durationSeconds); }, [durationSeconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { onExpire?.(); clearInterval(id); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const h   = Math.floor(remaining / 3600);
  const m   = Math.floor((remaining % 3600) / 60);
  const s   = remaining % 60;
  const fmt = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  const pct       = remaining / durationSeconds;
  const isWarning = remaining < 300;
  const isCritical = remaining < 60;
  const offset    = CIRC * (1 - pct);
  const color     = isCritical ? '#F87171' : isWarning ? '#FBBF24' : '#34D399';

  return (
    <Box
      id="exam-timer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.6,
        borderRadius: '10px',
        background: isCritical
          ? 'rgba(248,113,113,0.12)'
          : isWarning
          ? 'rgba(251,191,36,0.1)'
          : 'rgba(52,211,153,0.08)',
        border: `1px solid ${isCritical ? 'rgba(248,113,113,0.3)' : isWarning ? 'rgba(251,191,36,0.25)' : 'rgba(52,211,153,0.2)'}`,
        animation: isCritical ? 'blink 0.9s ease-in-out infinite' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      {/* SVG Arc */}
      <Box sx={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
        <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="26" cy="26" r={R} fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
          {/* Progress */}
          <circle cx="26" cy="26" r={R} fill="none"
            stroke={color} strokeWidth="3.5"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease', filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        {/* Time inside arc */}
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
            fontSize: '0.58rem',
            color,
            letterSpacing: '0.5px',
            lineHeight: 1,
          }}>
            {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
          </Typography>
        </Box>
      </Box>

      {/* Full HH:MM:SS */}
      <Box>
        <Typography sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700,
          fontSize: '1.05rem',
          letterSpacing: '0.08em',
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt}
        </Typography>
        <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', mt: 0.2 }}>
          {isCritical ? '⚠ FINAL MIN' : isWarning ? 'LOW TIME' : 'REMAINING'}
        </Typography>
      </Box>
    </Box>
  );
}
