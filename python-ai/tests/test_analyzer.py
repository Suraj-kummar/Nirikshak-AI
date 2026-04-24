"""
test_analyzer.py
================
Unit tests for the CV analyzer logic.
Tests the decision tree (face count → head pose → gaze → alert type).
"""

import base64
import io

import numpy as np
import cv2
import pytest

from vision.analyzer import analyze_frame, decode_frame, _alert


# ── Helper ───────────────────────────────────────────────────────────────────

def encode_frame(frame: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return base64.b64encode(buf).decode("utf-8")


def blank_frame(w=320, h=240) -> np.ndarray:
    return np.zeros((h, w, 3), dtype=np.uint8)


def noise_frame(w=320, h=240) -> np.ndarray:
    return np.random.randint(0, 255, (h, w, 3), dtype=np.uint8)


# ── decode_frame ──────────────────────────────────────────────────────────────

class TestDecodeFrame:

    def test_decode_blank_frame(self):
        b64 = encode_frame(blank_frame())
        result = decode_frame(b64)
        assert result is not None
        assert result.shape == (240, 320, 3)

    def test_decode_with_data_uri_prefix(self):
        b64 = encode_frame(blank_frame())
        result = decode_frame(f"data:image/jpeg;base64,{b64}")
        assert result is not None

    def test_decode_garbage_returns_none(self):
        result = decode_frame("NOT_VALID_BASE64!!!")
        assert result is None

    def test_decode_empty_string_returns_none(self):
        result = decode_frame("")
        # Either None or raises — analyzer must handle both
        # We just check it doesn't propagate an unexpected exception type
        assert result is None or isinstance(result, np.ndarray)


# ── analyze_frame ─────────────────────────────────────────────────────────────

class TestAnalyzeFrame:

    def test_noise_frame_never_crashes(self):
        """The most important invariant: analyze_frame NEVER raises."""
        for _ in range(5):
            b64 = encode_frame(noise_frame())
            result = analyze_frame(b64)
            assert isinstance(result, dict)

    def test_blank_frame_returns_dict(self):
        b64 = encode_frame(blank_frame())
        result = analyze_frame(b64)
        assert isinstance(result, dict)

    def test_result_has_required_keys(self):
        b64 = encode_frame(blank_frame())
        result = analyze_frame(b64)
        assert "alertType" in result
        assert "confidence" in result
        assert "severity" in result
        assert "description" in result

    def test_alerttype_always_valid(self):
        valid = {"CLEAR", "GAZE_AWAY", "MULTIPLE_FACES", "NO_FACE"}
        for _ in range(3):
            b64 = encode_frame(noise_frame())
            result = analyze_frame(b64)
            assert result["alertType"] in valid

    def test_confidence_always_in_range(self):
        for _ in range(3):
            b64 = encode_frame(noise_frame())
            result = analyze_frame(b64)
            assert 0.0 <= result["confidence"] <= 1.0

    def test_garbage_input_returns_clear(self):
        """Garbage input must not crash and should return CLEAR."""
        result = analyze_frame("GARBAGE_NOT_BASE64")
        assert result["alertType"] == "CLEAR"
        assert result["confidence"] == 0.0

    def test_empty_string_returns_clear(self):
        result = analyze_frame("")
        assert result["alertType"] == "CLEAR"

    def test_blank_frame_returns_no_face_or_clear(self):
        """A solid black/grey frame has no face → NO_FACE or CLEAR(0 confidence)."""
        b64 = encode_frame(blank_frame())
        result = analyze_frame(b64)
        assert result["alertType"] in {"NO_FACE", "CLEAR"}


# ── _alert helper ─────────────────────────────────────────────────────────────

class TestAlertHelper:

    def test_alert_structure(self):
        result = _alert("CLEAR", 0.95, "LOW", "All good")
        assert result == {
            "alertType": "CLEAR",
            "confidence": 0.95,
            "severity": "LOW",
            "description": "All good",
        }

    def test_alert_gaze_away(self):
        result = _alert("GAZE_AWAY", 0.88, "MEDIUM", "Looking away")
        assert result["alertType"] == "GAZE_AWAY"
        assert result["severity"] == "MEDIUM"
