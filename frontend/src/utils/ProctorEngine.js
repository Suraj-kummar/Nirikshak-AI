/**
 * ProctorEngine.js
 * ================
 * Browser-side AI proctoring using @vladmandic/face-api.
 * Runs 100% in-browser — no frames are sent to any server.
 *
 * Detects:
 *   NO_FACE        — student left frame
 *   MULTIPLE_FACES — possible impersonation
 *   GAZE_AWAY      — looking left / right / down (cheat-sheet etc.)
 *   CLEAR          — student looking at screen normally
 *
 * Algorithm (gaze estimation via 68-point landmarks):
 *   - Horizontal yaw: nose-tip X offset from face midline
 *   - Vertical pitch:  nose-tip Y position relative to eye–chin span
 *   - Eye Aspect Ratio (EAR): catches downward gaze / eyes closed
 */

import * as faceapi from '@vladmandic/face-api';

// ── Model loading ────────────────────────────────────────────────────────────
const MODEL_PATH = '/models'; // served from public/models/
let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_PATH),
  ]);
  modelsLoaded = true;
}

// ── Detection options ────────────────────────────────────────────────────────
const TINY_OPTS = new faceapi.TinyFaceDetectorOptions({
  inputSize:       224,
  scoreThreshold:  0.35,
});

// ── Main analysis function ───────────────────────────────────────────────────
/**
 * Analyze a single video frame and return an AlertDTO-shaped object.
 * @param {HTMLVideoElement} videoEl
 * @returns {{ alertType, confidence, severity, description }}
 */
export async function analyzeVideoFrame(videoEl) {
  if (!videoEl || videoEl.readyState < 2 || !modelsLoaded) {
    return { alertType: 'CLEAR', confidence: 0, severity: 'LOW', description: 'Initializing AI...' };
  }

  let detections;
  try {
    detections = await faceapi
      .detectAllFaces(videoEl, TINY_OPTS)
      .withFaceLandmarks(true); // uses 68-tiny model
  } catch {
    return { alertType: 'CLEAR', confidence: 0, severity: 'LOW', description: 'Detection error — retrying.' };
  }

  // ── No face ──────────────────────────────────────────────────────────────
  if (!detections || detections.length === 0) {
    return {
      alertType:   'NO_FACE',
      confidence:  0.95,
      severity:    'HIGH',
      description: 'No face detected. Student may have left the frame.',
    };
  }

  // ── Multiple faces ────────────────────────────────────────────────────────
  if (detections.length > 1) {
    return {
      alertType:   'MULTIPLE_FACES',
      confidence:  0.97,
      severity:    'HIGH',
      description: `${detections.length} faces detected — possible impersonation attempt.`,
    };
  }

  // ── Single face: gaze estimation ──────────────────────────────────────────
  const { landmarks } = detections[0];
  return estimateGaze(landmarks.positions);
}

// ── Gaze estimation (no server needed) ──────────────────────────────────────
/**
 * Use 68-point facial landmarks to estimate gaze direction.
 * Landmark indices (dlib convention):
 *   Jaw line: 0–16 | Eyebrows: 17–26 | Nose: 27–35
 *   Left eye: 36–41 | Right eye: 42–47 | Mouth: 48–67
 */
function estimateGaze(pts) {
  // ── Face width / horizontal midline ───────────────────────────────────────
  const faceLeft  = pts[0].x;
  const faceRight = pts[16].x;
  const faceWidth = faceRight - faceLeft;

  if (faceWidth < 30) {
    // Face too small or partially visible — not enough data
    return { alertType: 'CLEAR', confidence: 0.4, severity: 'LOW', description: 'Face partially visible.' };
  }

  const faceMidX = (faceLeft + faceRight) / 2;

  // ── Horizontal yaw (left–right head rotation) ─────────────────────────────
  // Nose tip (30) offset from face midline, normalised by face width
  const noseTipX      = pts[30].x;
  const horizOffset   = (noseTipX - faceMidX) / faceWidth; // negative = left, positive = right

  // ── Vertical pitch (up–down head tilt) ────────────────────────────────────
  // Average eye Y position vs chin Y
  const eyeCenterY = (pts[36].y + pts[39].y + pts[42].y + pts[45].y) / 4;
  const chinY      = pts[8].y;
  const noseTipY   = pts[30].y;
  const faceHeight = chinY - eyeCenterY;
  // Normalised nose Y below eye line (0 = eye level, 1 = chin level)
  const vertOffset = faceHeight > 10 ? (noseTipY - eyeCenterY) / faceHeight : 0.5;

  // ── Eye Aspect Ratio (EAR) — catches hard downward gaze / closed eyes ─────
  const leftEAR  = eyeAspectRatio(pts, 36, 37, 38, 39, 40, 41);
  const rightEAR = eyeAspectRatio(pts, 42, 43, 44, 45, 46, 47);
  const avgEAR   = (leftEAR + rightEAR) / 2;

  // ── Thresholds (tuned for typical exam camera distance) ───────────────────
  const HORIZ_WARN  = 0.08;  // 8% nose offset → warning
  const HORIZ_HIGH  = 0.15;  // 15% offset     → high alert
  const VERT_DOWN   = 0.65;  // nose well below eyes  → looking down
  const EAR_LOW     = 0.15;  // very low EAR          → eyes nearly closed / hard downward gaze

  const absHoriz = Math.abs(horizOffset);

  // 1. Looking left or right
  if (absHoriz > HORIZ_WARN) {
    const dir        = horizOffset > 0 ? 'right' : 'left';
    const severity   = absHoriz > HORIZ_HIGH ? 'HIGH' : 'MEDIUM';
    const confidence = Math.min(0.55 + absHoriz * 2.5, 0.99);
    return {
      alertType:   'GAZE_AWAY',
      confidence,
      severity,
      description: `Student looking ${dir} — possible reference material detected.`,
    };
  }

  // 2. Looking down (notes on desk)
  if (vertOffset > VERT_DOWN || avgEAR < EAR_LOW) {
    return {
      alertType:   'GAZE_AWAY',
      confidence:  0.78,
      severity:    'MEDIUM',
      description: 'Student looking down — possible use of notes or reference material.',
    };
  }

  // 3. All clear
  return {
    alertType:   'CLEAR',
    confidence:  0.97,
    severity:    'LOW',
    description: 'Student is looking at the screen.',
  };
}

// ── Eye Aspect Ratio helper ──────────────────────────────────────────────────
/**
 * EAR = (‖P2–P6‖ + ‖P3–P5‖) / (2 · ‖P1–P4‖)
 * A fully open eye gives ~0.25–0.35; blinking / downward gaze → drops below 0.15
 */
function eyeAspectRatio(pts, p1, p2, p3, p4, p5, p6) {
  const d = (a, b) => Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
  return (d(p2, p6) + d(p3, p5)) / (2.0 * d(p1, p4));
}
