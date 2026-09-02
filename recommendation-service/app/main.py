import logging
import os
import threading
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("recommendation")

MODEL_NAME = os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
MODEL_DIM = int(os.getenv("MODEL_DIM", "384"))
MAX_BATCH = int(os.getenv("MAX_BATCH", "64"))

# Guards first-time model load so only one request builds it.
_load_lock = threading.Lock()
_model = None


def get_model():
    global _model
    if _model is not None:
        return _model
    with _load_lock:
        if _model is None:
            logger.info("Loading model %s (first load may download weights)...", MODEL_NAME)
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer(MODEL_NAME)
            _model.eval()
            dim = _model.get_sentence_embedding_dimension()
            if dim != MODEL_DIM:
                logger.warning("Model dim (%s) != MODEL_DIM env (%s)", dim, MODEL_DIM)
            logger.info("Model loaded. dim=%s", dim)
    return _model


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("recommendation-service starting")
    yield
    logger.info("recommendation-service stopped")


app = FastAPI(title="Recommendation Service", version="0.1.0", lifespan=lifespan)


class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=4096)


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "dims": MODEL_DIM}


@app.get("/embed/info")
def embed_info():
    return {"model": MODEL_NAME, "dims": MODEL_DIM}


@app.post("/embed")
def embed(req: EmbedRequest):
    try:
        model = get_model()
    except Exception as e:  # pragma: no cover - model download/inference failures
        logger.exception("Failed to load model")
        raise HTTPException(status_code=500, detail=f"model load error: {e}")

    if not req.texts:
        raise HTTPException(status_code=400, detail="no texts provided")

    embeddings = []
    for i in range(0, len(req.texts), MAX_BATCH):
        batch = req.texts[i : i + MAX_BATCH]
        vecs = model.encode(
            batch,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        embeddings.extend(v.tolist() for v in vecs)

    return {"embeddings": embeddings, "model": MODEL_NAME, "dims": MODEL_DIM}
