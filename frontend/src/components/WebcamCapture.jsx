import React, {
  useRef, useEffect, useCallback, forwardRef, useImperativeHandle
} from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import VideocamIcon    from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import useProctor      from '../hooks/useProctor';

const FRAME_INTERVAL_MS = 1500;

const WebcamCapture = forwardRef(({ onFrame, onAlert, hasViolation }, ref) => {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);

  const { currentAlert, modelReady, modelError } = useProctor(videoRef);

  useEffect(() => {
    if (onAlert) onAlert(currentAlert);
  }, [currentAlert, onAlert]); // eslint-disable-line

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.7);
    if (onFrame) onFrame(base64);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [onFrame]);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      intervalRef.current = setInterval(captureFrame, FRAME_INTERVAL_MS);
    } catch (err) {
      console.error('Webcam access denied:', err);
    }
  }, [captureFrame]);

  const stopCapture = useCallback(() => {
    clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useImperativeHandle(ref, () => ({ startCapture, stopCapture, videoRef }));
  useEffect(() => { startCapture(); return stopCapture; }, [startCapture, stopCapture]);

  const borderColor = hasViolation ? 'rgba(248,113,113,0.7)' : 'rgba(52,211,153,0.5)';
  const glowColor   = hasViolation ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.15)';
  const statusColor = hasViolation ? '#F87171' : '#34D399';

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Outer glow wrapper */}
      <Box sx={{
        position: 'relative',
        width: '100%', paddingTop: '75%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 0 1px ${borderColor}22, 0 0 24px 4px ${glowColor}`,
        transition: 'border-color 0.4s ease, box-shadow 0.5s ease',
        background: '#000',
      }}>
        {/* Video element */}
        <video
          id="exam-webcam-preview"
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />

        {/* Scan line overlay */}
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Moving scan line */}
        <Box sx={{
          position: 'absolute', left: 0, right: 0, height: '18%',
          background: `linear-gradient(180deg, transparent, ${statusColor}08, transparent)`,
          animation: 'scanLine 3s linear infinite',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Corner brackets — surveillance aesthetic */}
        {[
          { top: 8, left: 8,  borderTop: `2px solid ${statusColor}`, borderLeft:  `2px solid ${statusColor}` },
          { top: 8, right: 8, borderTop: `2px solid ${statusColor}`, borderRight: `2px solid ${statusColor}` },
          { bottom: 8, left: 8,  borderBottom: `2px solid ${statusColor}`, borderLeft:  `2px solid ${statusColor}` },
          { bottom: 8, right: 8, borderBottom: `2px solid ${statusColor}`, borderRight: `2px solid ${statusColor}` },
        ].map((sx, i) => (
          <Box key={i} sx={{ position: 'absolute', width: 16, height: 16, ...sx, zIndex: 3 }} />
        ))}

        {/* LIVE / VIOLATION badge */}
        <Box sx={{
          position: 'absolute', top: 10, left: 10, zIndex: 4,
          display: 'flex', alignItems: 'center', gap: 0.5,
          px: 0.9, py: 0.3,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '6px',
          border: `1px solid ${borderColor}44`,
        }}>
          <Box sx={{
            width: 5, height: 5, borderRadius: '50%', bgcolor: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
            animation: 'blink 1.2s ease-in-out infinite',
          }} />
          {hasViolation
            ? <VideocamOffIcon sx={{ fontSize: 11, color: '#F87171' }} />
            : <VideocamIcon    sx={{ fontSize: 11, color: '#34D399' }} />
          }
          <Typography sx={{
            color: statusColor, fontSize: '0.58rem', fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em',
          }}>
            {hasViolation ? 'VIOLATION' : 'LIVE'}
          </Typography>
        </Box>

        {/* AI model badge */}
        <Box sx={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 4,
          px: 0.9, py: 0.3,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {modelError ? (
            <Typography sx={{ fontSize: '0.58rem', color: '#F87171', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>⚠ AI offline</Typography>
          ) : modelReady ? (
            <Typography sx={{ fontSize: '0.58rem', color: '#34D399', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>🧠 AI active</Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={7} sx={{ color: '#818CF8' }} />
              <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)', fontFamily: '"JetBrains Mono", monospace' }}>Loading AI…</Typography>
            </Box>
          )}
        </Box>

        {/* Frame counter top-right */}
        <Box sx={{
          position: 'absolute', top: 10, right: 10, zIndex: 4,
          px: 0.9, py: 0.3,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Typography sx={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.35)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.03em' }}>
            CAM-01
          </Typography>
        </Box>
      </Box>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
});

WebcamCapture.displayName = 'WebcamCapture';
export default WebcamCapture;
