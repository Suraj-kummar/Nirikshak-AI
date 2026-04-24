"""
analyzer.py
===========
Combines face detection, head pose, and gaze estimation into a single
AlertDTO response.

Decision tree:
  face_count == 0  → NO_FACE   (HIGH)
  face_count >  1  → MULTIPLE_FACES (HIGH)
  deviation > thr  → GAZE_AWAY (MEDIUM)
  else             → CLEAR

Thresholds (configurable via env vars):
  YAW_THRESHOLD   = 25°   (head pose yaw)
  PITCH_THRESHOLD = 20°   (head pose pitch)
  GAZE_YAW_THR    = 20°   (iris gaze yaw)
  GAZE_PITCH_THR  = 15°   (iris gaze pitch)
  GAZE_WEIGHT     = 0.4   (contribution of gaze vs head pose in combined score)

Privacy: Frames are decoded to NumPy arrays, processed, and the array is
immediately dereferenced. No data is written to disk at any point.
"""

import base64
import os
import time
from typing import Dict, Any

import cv2
import numpy as np

from vision.face_detector import FaceDetector
from vision.head_pose import HeadPoseEstimator
from vision.gaze_estimator import GazeEstimator

# ── Thresholds ──────────────────────────────────────────────────────────────
YAW_THRESHOLD   = float(os.getenv("YAW_THRESHOLD",   "25"))
PITCH_THRESHOLD = float(os.getenv("PITCH_THRESHOLD", "20"))
GAZE_YAW_THR    = float(os.getenv("GAZE_YAW_THR",   "20"))
GAZE_PITCH_THR  = float(os.getenv("GAZE_PITCH_THR", "15"))
GAZE_WEIGHT     = float(os.getenv("GAZE_WEIGHT",     "0.4"))

# ── Module-level singleton instances (avoid re-loading models per request) ──
_face_detector   = FaceDetector(min_detection_confidence=0.5)
_head_pose_est   = HeadPoseEstimator()
_gaze_est        = GazeEstimator()


def decode_frame(frame_base64: str) -> np.ndarray:
    """Decode a base64 JPEG/PNG string into an OpenCV BGR frame."""
    # Strip data-URI prefix if present (e.g. "data:image/jpeg;base64,...")
    if "," in frame_base64:
        frame_base64 = frame_base64.split(",", 1)[1]

    img_bytes = base64.b64decode(frame_base64)
    np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
    frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return frame_bgr


def analyze_frame(frame_base64: str) -> Dict[str, Any]:
    """
    Main entry point: decode frame → run CV pipeline → return AlertDTO dict.

    Never raises an exception. On any error, returns CLEAR with confidence=0.0.
    """
    start_ms = time.monotonic() * 1000

    try:
        # ── Step 1: Decode ────────────────────────────────────────────────
        frame_bgr = decode_frame(frame_base64)
        if frame_bgr is None:
            return _alert("CLEAR", 0.0, "LOW", "Cannot decode frame; treating as CLEAR")

        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        # ── Step 2: Face detection ────────────────────────────────────────
        face_count, face_conf = _face_detector.detect(frame_rgb)

        if face_count == 0:
            return _alert(
                "NO_FACE", 0.95, "HIGH",
                "No face detected in frame. Student may have stepped away from camera."
            )

        if face_count > 1:
            return _alert(
                "MULTIPLE_FACES", face_conf, "HIGH",
                f"{face_count} faces detected in frame. Possible impersonation or proxy candidate."
            )

        # ── Step 3: Head pose ──────────────────────────────────────────────
        head_pose = _head_pose_est.estimate(frame_rgb)
        head_yaw, head_pitch, head_roll = head_pose if head_pose else (0.0, 0.0, 0.0)

        # ── Step 4: Gaze estimation ────────────────────────────────────────
        gaze = _gaze_est.estimate(frame_rgb)
        gaze_yaw, gaze_pitch = gaze if gaze else (0.0, 0.0)

        # ── Step 5: Combined deviation ────────────────────────────────────
        # Weighted average of head pose + gaze deviations
        head_dev_yaw   = abs(head_yaw)   / YAW_THRESHOLD
        head_dev_pitch = abs(head_pitch) / PITCH_THRESHOLD
        gaze_dev_yaw   = abs(gaze_yaw)   / GAZE_YAW_THR
        gaze_dev_pitch = abs(gaze_pitch) / GAZE_PITCH_THR

        head_dev = max(head_dev_yaw, head_dev_pitch)
        gaze_dev = max(gaze_dev_yaw, gaze_dev_pitch)

        combined = (1 - GAZE_WEIGHT) * head_dev + GAZE_WEIGHT * gaze_dev
        confidence = min(combined, 1.0)

        elapsed_ms = time.monotonic() * 1000 - start_ms

        if combined >= 1.0:
            return _alert(
                "GAZE_AWAY",
                round(confidence, 3),
                "MEDIUM",
                (
                    f"Student gaze deviated: head yaw={head_yaw:.1f}°, "
                    f"pitch={head_pitch:.1f}°, iris yaw≈{gaze_yaw:.1f}°. "
                    f"Analysis took {elapsed_ms:.0f}ms."
                )
            )

        # ── Step 6: CLEAR ─────────────────────────────────────────────────
        return _alert(
            "CLEAR",
            round(1.0 - confidence, 3),
            "LOW",
            (
                f"Student attention OK. head yaw={head_yaw:.1f}°, "
                f"pitch={head_pitch:.1f}°. Analysis took {elapsed_ms:.0f}ms."
            )
        )

    except Exception as exc:  # noqa: BLE001
        # Never crash the session — return CLEAR with 0 confidence
        return _alert("CLEAR", 0.0, "LOW", f"Analysis error (frame skipped): {str(exc)[:120]}")


def _alert(alert_type: str, confidence: float, severity: str, description: str) -> Dict[str, Any]:
    return {
        "alertType":   alert_type,
        "confidence":  confidence,
        "severity":    severity,
        "description": description,
    }
