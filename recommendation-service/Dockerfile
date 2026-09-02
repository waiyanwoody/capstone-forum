# Recommendation microservice
#
# Self-hosted text embeddings via sentence-transformers (no external AI API).
# Exposes:
#   GET  /health         -> {"status":"ok","model":...,"dims":...}
#   POST /embed          -> body: {"texts": ["...", ...]} -> {"embeddings": [[...]]}
#   GET  /embed/info     -> {"model":..., "dims":...}
#
# The Spring Boot backend calls /embed synchronously on post create/update,
# stores the vector, and computes cosine similarity in-app.
#
# The model (all-MiniLM-L6-v2) runs on CPU only, so we pin CPU-only torch to
# avoid pulling in ~1GB of CUDA/nvidia wheels that would make the image huge.

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu

# System deps for onnxruntime / numpy wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install CPU-only torch first (small, no CUDA), then the rest from PyPI.
RUN pip install --upgrade pip \
    && pip install --index-url ${TORCH_INDEX_URL} torch \
    && pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
