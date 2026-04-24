/**
 * useProctor.js
 * =============
 * React hook that drives the browser-side proctoring loop.
 *
 * Usage:
 *   const { currentAlert, modelReady, modelError } = useProctor(videoRef);
 *
 * - Loads AI models on mount (from /models/ — served statically)
 * - Runs face + gaze detection every DETECTION_INTERVAL_MS
 * - Pauses the detection loop when the tab is hidden (saves CPU + battery)
 * - Returns the latest AlertDTO-shaped result
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadModels, analyzeVideoFrame } from '../utils/ProctorEngine';

const DETECTION_INTERVAL_MS = 1500; // match frame capture rate

export default function useProctor(videoRef) {
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [currentAlert, setCurrentAlert] = useState({
    alertType:   'CLEAR',
    confidence:  0,
    severity:    'LOW',
    description: 'Loading AI proctoring models…',
  });

  const intervalRef = useRef(null);
  const isPausedRef = useRef(false); // true when tab is hidden

  // ── Load models once on mount ────────────────────────────────────────────
  useEffect(() => {
    loadModels()
      .then(() => {
        setModelReady(true);
        setCurrentAlert({
          alertType:   'CLEAR',
          confidence:  1,
          severity:    'LOW',
          description: 'AI models loaded — monitoring active.',
        });
      })
      .catch((err) => {
        console.error('[Proctor] Failed to load models:', err);
        setModelError(true);
        setCurrentAlert({
          alertType:   'CLEAR',
          confidence:  0,
          severity:    'LOW',
          description: 'AI model load failed — proctoring disabled.',
        });
      });
  }, []);

  // ── Detection loop ────────────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    // Skip silently if tab is hidden — saves CPU and battery
    if (isPausedRef.current || document.hidden) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    try {
      const result = await analyzeVideoFrame(videoEl);
      setCurrentAlert(result);
    } catch (err) {
      console.warn('[Proctor] Detection error:', err);
    }
  }, [videoRef]);

  // ── Start/stop interval when models are ready ─────────────────────────────
  useEffect(() => {
    if (!modelReady) return;
    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [modelReady, runDetection]);

  // ── Pause / resume loop on tab visibility ─────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return { currentAlert, modelReady, modelError };
}
