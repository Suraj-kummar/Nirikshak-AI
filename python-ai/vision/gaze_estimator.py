"""
gaze_estimator.py
=================
Estimates gaze direction using MediaPipe FaceMesh iris landmarks.

Method:
  - Locates the left and right iris center landmarks (indices 468–472, 473–477)
  - Computes the horizontal and vertical displacement of the iris relative
    to the eye bounding box
  - Maps displacement ratio → gaze angle (approximate)

Returns (gaze_yaw, gaze_pitch) in degrees.
Privacy: Only 2 floats are returned; no imagery is stored.
"""

import mediapipe as mp
import numpy as np
from typing import Optional, Tuple


# MediaPipe FaceMesh iris landmark indices (requires refine_landmarks=True)
_LEFT_IRIS   = list(range(468, 473))  # 468-472
_RIGHT_IRIS  = list(range(473, 478))  # 473-477

# Eye contour landmarks for bounding box
_LEFT_EYE_CONTOUR  = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
_RIGHT_EYE_CONTOUR = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]


class GazeEstimator:
    """Iris-based gaze estimation using MediaPipe FaceMesh."""

    def __init__(self):
        self._mp_face_mesh = mp.solutions.face_mesh
        self._face_mesh = self._mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,          # Required for iris landmarks
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def _iris_center(self, landmarks, indices, w: int, h: int) -> np.ndarray:
        """Return pixel coordinates of iris center (mean of iris landmarks)."""
        pts = np.array(
            [[landmarks[i].x * w, landmarks[i].y * h] for i in indices],
            dtype=np.float32,
        )
        return pts.mean(axis=0)

    def _eye_bb(self, landmarks, indices, w: int, h: int) -> Tuple[float, float, float, float]:
        """Return (x_min, y_min, x_max, y_max) of eye contour bounding box."""
        pts = np.array(
            [[landmarks[i].x * w, landmarks[i].y * h] for i in indices],
            dtype=np.float32,
        )
        x_min, y_min = pts.min(axis=0)
        x_max, y_max = pts.max(axis=0)
        return x_min, y_min, x_max, y_max

    def estimate(self, frame_rgb: np.ndarray) -> Optional[Tuple[float, float]]:
        """
        Estimate gaze direction.

        Returns:
            (gaze_yaw, gaze_pitch) in degrees or None if no face.
            Positive gaze_yaw  → looking right.
            Positive gaze_pitch → looking down.
        """
        h, w = frame_rgb.shape[:2]
        results = self._face_mesh.process(frame_rgb)

        if not results.multi_face_landmarks:
            return None

        landmarks = results.multi_face_landmarks[0].landmark

        # Left eye
        left_iris = self._iris_center(landmarks, _LEFT_IRIS, w, h)
        lx_min, ly_min, lx_max, ly_max = self._eye_bb(landmarks, _LEFT_EYE_CONTOUR, w, h)
        l_eye_w = max(lx_max - lx_min, 1.0)
        l_eye_h = max(ly_max - ly_min, 1.0)
        l_ratio_x = (left_iris[0] - lx_min) / l_eye_w - 0.5   # -0.5 .. 0.5
        l_ratio_y = (left_iris[1] - ly_min) / l_eye_h - 0.5

        # Right eye
        right_iris = self._iris_center(landmarks, _RIGHT_IRIS, w, h)
        rx_min, ry_min, rx_max, ry_max = self._eye_bb(landmarks, _RIGHT_EYE_CONTOUR, w, h)
        r_eye_w = max(rx_max - rx_min, 1.0)
        r_eye_h = max(ry_max - ry_min, 1.0)
        r_ratio_x = (right_iris[0] - rx_min) / r_eye_w - 0.5
        r_ratio_y = (right_iris[1] - ry_min) / r_eye_h - 0.5

        # Average both eyes; scale to approximate angle (empirical factor)
        avg_x = (l_ratio_x + r_ratio_x) / 2.0
        avg_y = (l_ratio_y + r_ratio_y) / 2.0

        gaze_yaw   =  avg_x * 60.0   # ±30° range roughly
        gaze_pitch =  avg_y * 40.0   # ±20° range roughly

        return float(gaze_yaw), float(gaze_pitch)

    def close(self):
        self._face_mesh.close()
