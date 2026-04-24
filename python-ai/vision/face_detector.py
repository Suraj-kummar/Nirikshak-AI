"""
face_detector.py
================
Uses MediaPipe FaceDetection to count the number of faces in a frame.
Returns (face_count, confidence) for the best detection.

Privacy: No face images are stored. Detection runs in-memory only.
"""

import mediapipe as mp
import numpy as np
from typing import Tuple


class FaceDetector:
    """Lightweight MediaPipe face detection — counts faces only."""

    def __init__(self, min_detection_confidence: float = 0.5):
        self._mp_face_detection = mp.solutions.face_detection
        self._detector = self._mp_face_detection.FaceDetection(
            model_selection=0,  # Short-range model (< 2 m distance, good for webcam)
            min_detection_confidence=min_detection_confidence,
        )

    def detect(self, frame_rgb: np.ndarray) -> Tuple[int, float]:
        """
        Detect faces in an RGB frame.

        Args:
            frame_rgb: HxWx3 uint8 NumPy array in RGB color space.

        Returns:
            (face_count, max_confidence): number of detected faces and the
            highest detection confidence score among them.
        """
        results = self._detector.process(frame_rgb)

        if not results.detections:
            return 0, 0.0

        face_count = len(results.detections)
        max_confidence = max(
            d.score[0] for d in results.detections if d.score
        )
        return face_count, float(max_confidence)

    def close(self):
        """Release MediaPipe resources. Always call this when done."""
        self._detector.close()

    # ── Context manager support ───────────────────────────────────────────────
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Guarantee resource cleanup even if an exception is raised."""
        self.close()
        return False  # don't suppress exceptions
