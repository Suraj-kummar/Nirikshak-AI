"""
head_pose.py
============
Uses MediaPipe FaceMesh to compute 3D head pose: yaw, pitch, roll.

Method:
  - Selects 6 key facial landmarks (nose tip, chin, eye corners, mouth corners)
  - Uses solvePnP with a generic 3D face model to compute rotation
  - Decomposes rotation matrix into Euler angles (yaw, pitch, roll) in degrees

Privacy: Only pose angles (3 floats) are returned. No image data persisted.
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, Tuple


# 3D reference face model coordinates (same as dlib's canonical face)
_FACE_3D_MODEL = np.array([
    [0.0,       0.0,      0.0   ],  # Nose tip
    [0.0,      -63.6,    -12.5  ],  # Chin
    [-43.3,     32.7,    -26.0  ],  # Left eye left corner
    [43.3,      32.7,    -26.0  ],  # Right eye right corner
    [-28.9,    -28.9,    -24.1  ],  # Left mouth corner
    [28.9,     -28.9,    -24.1  ],  # Right mouth corner
], dtype=np.float64)

# Corresponding MediaPipe FaceMesh landmark indices
_LANDMARK_INDICES = [1, 152, 263, 33, 287, 57]


class HeadPoseEstimator:
    """Computes yaw/pitch/roll from MediaPipe FaceMesh landmarks."""

    def __init__(self):
        self._mp_face_mesh = mp.solutions.face_mesh
        self._face_mesh = self._mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def estimate(
        self, frame_rgb: np.ndarray
    ) -> Optional[Tuple[float, float, float]]:
        """
        Estimate head pose from an RGB frame.

        Returns:
            (yaw, pitch, roll) in degrees, or None if no face found.
            Positive yaw  → face turning right.
            Positive pitch → face tilting up.
        """
        h, w = frame_rgb.shape[:2]
        results = self._face_mesh.process(frame_rgb)

        if not results.multi_face_landmarks:
            return None

        landmarks = results.multi_face_landmarks[0].landmark

        # Extract 2D image points for the 6 selected landmarks
        image_points = np.array([
            [landmarks[idx].x * w, landmarks[idx].y * h]
            for idx in _LANDMARK_INDICES
        ], dtype=np.float64)

        # Camera intrinsics (approximate for a typical webcam)
        focal_length = w
        cam_matrix = np.array([
            [focal_length, 0,            w / 2],
            [0,            focal_length, h / 2],
            [0,            0,            1    ],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        success, rot_vec, _ = cv2.solvePnP(
            _FACE_3D_MODEL,
            image_points,
            cam_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not success:
            return None

        rot_mat, _ = cv2.Rodrigues(rot_vec)
        pose_mat = cv2.hconcat([rot_mat, np.zeros((3, 1))])
        _, _, _, _, _, _, euler = cv2.decomposeProjectionMatrix(pose_mat)

        pitch = float(euler[0])
        yaw   = float(euler[1])
        roll  = float(euler[2])
        return yaw, pitch, roll

    def close(self):
        self._face_mesh.close()
