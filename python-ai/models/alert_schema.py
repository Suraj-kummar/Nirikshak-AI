"""
Nirikshak AI — Python FastAPI AI Vision Service
================================================
Pydantic models for request/response schemas.
All alert types, severities, and response shapes are defined here.
"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum


class AlertType(str, Enum):
    CLEAR = "CLEAR"
    GAZE_AWAY = "GAZE_AWAY"
    MULTIPLE_FACES = "MULTIPLE_FACES"
    NO_FACE = "NO_FACE"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FrameRequest(BaseModel):
    frameBase64: str


class AlertResponse(BaseModel):
    alertType: AlertType
    confidence: float
    severity: Severity
    description: str


class HealthResponse(BaseModel):
    status: str
    model: str
    version: str
