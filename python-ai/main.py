"""
main.py — Nirikshak AI Python FastAPI Service
=============================================
Exposes two endpoints:
  POST /analyze  — accepts a base64 video frame, returns AlertDTO JSON
  GET  /health   — liveness/readiness probe

Design constraints:
  • NO video storage. Frames are processed in-memory and immediately discarded.
  • All exceptions are caught; the endpoint never returns a 5xx
    (always returns an AlertDTO, using CLEAR + confidence=0.0 on error).
  • analyze_frame is CPU-bound and is dispatched to a thread-pool executor
    via asyncio.run_in_executor so the async event loop is never blocked.
  • Target latency < 300 ms per frame.
"""

import asyncio
import logging
import time
from functools import partial

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.alert_schema import AlertResponse, FrameRequest, HealthResponse
from vision.analyzer import analyze_frame

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("nirikshak.ai")

# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Nirikshak AI Vision Service",
    description=(
        "Real-time computer vision inference for the Nirikshak proctoring platform. "
        "Detects gaze deviation, multiple faces, and absent students. "
        "NO video is stored — frames are processed in-memory only."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Spring Boot calls us; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    """Liveness / readiness probe used by Docker health-check."""
    return HealthResponse(status="ok", model="mediapipe", version="1.0.0")


@app.post("/analyze", response_model=AlertResponse, tags=["Vision"])
async def analyze(payload: FrameRequest) -> AlertResponse:
    """
    Analyze a single video frame and return an alert decision.

    - Input  : base64-encoded JPEG or PNG frame (may include data-URI prefix)
    - Output : AlertDTO (alertType, confidence, severity, description)
    - Privacy: Frame is decoded into a NumPy array, processed, and discarded.
               Nothing is written to disk.
    - Perf   : analyze_frame is CPU-bound; dispatched to thread-pool executor
               to keep the asyncio event loop unblocked.
    """
    if not payload.frameBase64:
        log.warning("Empty frameBase64 received — returning CLEAR")
        return AlertResponse(
            alertType="CLEAR",
            confidence=0.0,
            severity="LOW",
            description="Empty frame received; skipping analysis.",
        )

    t0 = time.monotonic()

    # Push CPU-bound work off the event loop onto a thread-pool executor
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, analyze_frame, payload.frameBase64)

    elapsed_ms = (time.monotonic() - t0) * 1000

    log.info(
        "Frame analyzed in %.1f ms — alertType=%s confidence=%.3f",
        elapsed_ms,
        result["alertType"],
        result["confidence"],
    )

    if elapsed_ms > 500:
        log.warning("Slow frame analysis: %.1f ms (target < 300 ms)", elapsed_ms)

    return AlertResponse(**result)


# ── Dev entry point ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
