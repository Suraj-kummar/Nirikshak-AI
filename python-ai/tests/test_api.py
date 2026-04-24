"""
test_api.py
===========
Integration tests for the Nirikshak AI FastAPI service.
Uses httpx TestClient — no real MediaPipe inference needed for API layer tests.

Run: pytest tests/ -v
"""

import base64
import io

import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_blank_frame_b64(width: int = 320, height: int = 240, color=(128, 128, 128)) -> str:
    """Create a solid-color JPEG frame encoded as base64."""
    frame = np.full((height, width, 3), color, dtype=np.uint8)
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return base64.b64encode(buffer).decode("utf-8")


def make_noise_frame_b64() -> str:
    """Create a random-noise frame — unlikely to contain a real face."""
    frame = np.random.randint(0, 255, (240, 320, 3), dtype=np.uint8)
    _, buffer = cv2.imencode(".jpg", frame)
    return base64.b64encode(buffer).decode("utf-8")


# ── /health ───────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_status_ok(self):
        data = client.get("/health").json()
        assert data["status"] == "ok"

    def test_health_model_mediapipe(self):
        data = client.get("/health").json()
        assert data["model"] == "mediapipe"

    def test_health_has_version(self):
        data = client.get("/health").json()
        assert "version" in data


# ── /analyze ──────────────────────────────────────────────────────────────────

class TestAnalyze:

    def test_analyze_returns_200(self):
        """Endpoint must always return 200 — never crash."""
        payload = {"frameBase64": make_blank_frame_b64()}
        response = client.post("/analyze", json=payload)
        assert response.status_code == 200

    def test_analyze_response_has_required_fields(self):
        payload = {"frameBase64": make_blank_frame_b64()}
        data = client.post("/analyze", json=payload).json()
        assert "alertType"   in data
        assert "confidence"  in data
        assert "severity"    in data
        assert "description" in data

    def test_analyze_alerttype_is_valid(self):
        payload = {"frameBase64": make_noise_frame_b64()}
        data = client.post("/analyze", json=payload).json()
        assert data["alertType"] in {"CLEAR", "GAZE_AWAY", "MULTIPLE_FACES", "NO_FACE"}

    def test_analyze_severity_is_valid(self):
        payload = {"frameBase64": make_noise_frame_b64()}
        data = client.post("/analyze", json=payload).json()
        assert data["severity"] in {"LOW", "MEDIUM", "HIGH"}

    def test_analyze_confidence_between_0_and_1(self):
        payload = {"frameBase64": make_noise_frame_b64()}
        data = client.post("/analyze", json=payload).json()
        assert 0.0 <= data["confidence"] <= 1.0

    def test_analyze_empty_frame_does_not_crash(self):
        """Empty frameBase64 must return 200 with CLEAR."""
        payload = {"frameBase64": ""}
        response = client.post("/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["alertType"] == "CLEAR"

    def test_analyze_garbage_base64_does_not_crash(self):
        """Corrupt base64 must return 200 (CLEAR, confidence=0)."""
        payload = {"frameBase64": "THIS_IS_NOT_VALID_BASE64!!!"}
        response = client.post("/analyze", json=payload)
        assert response.status_code == 200

    def test_analyze_data_uri_prefix_stripped(self):
        """Frame with data:image/jpeg;base64, prefix should still work."""
        b64 = make_blank_frame_b64()
        payload = {"frameBase64": f"data:image/jpeg;base64,{b64}"}
        response = client.post("/analyze", json=payload)
        assert response.status_code == 200

    def test_analyze_missing_body_field_returns_422(self):
        """Missing required field returns validation error."""
        response = client.post("/analyze", json={})
        assert response.status_code == 422

    def test_analyze_noise_frame_returns_no_face_or_clear(self):
        """Random noise frame should produce NO_FACE (no detectable face) or CLEAR."""
        payload = {"frameBase64": make_noise_frame_b64()}
        data = client.post("/analyze", json=payload).json()
        # Noise frames should never trigger GAZE_AWAY without a detected face
        assert data["alertType"] in {"NO_FACE", "CLEAR"}
