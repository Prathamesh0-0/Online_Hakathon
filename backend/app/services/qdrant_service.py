import logging
import random
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from google import genai
from app.config import settings

logger = logging.getLogger("qdrant_service")

class QdrantService:
    def __init__(self):
        self.enabled = False
        self.client = None
        self.collection_name = "meeting_transcripts"
        self.vector_size = 768  # Size of text-embedding-004 vectors

        # Initialize Gemini for Embeddings
        self.gemini_client = None
        if settings.GROQ_API_KEY or os.getenv("GEMINI_API_KEY"):
            # Try to initialize Gemini API key
            gemini_key = os.getenv("GEMINI_API_KEY") or settings.GROQ_API_KEY
            try:
                self.gemini_client = genai.Client(api_key=gemini_key)
            except Exception as e:
                logger.warning(f"Could not initialize Gemini Client for embeddings: {e}")

        # Initialize Qdrant Client
        if settings.QDRANT_URL:
            try:
                # We handle local instances or Qdrant Cloud
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY or None,
                    timeout=5.0
                )
                
                # Check / create collection
                self._ensure_collection()
                self.enabled = True
                logger.info(f"Qdrant client connected to {settings.QDRANT_URL}")
            except Exception as e:
                logger.error(f"Failed to connect to Qdrant: {e}. Running in Mock Qdrant Mode.")
        else:
            logger.warning("QDRANT_URL is not set. Running in Mock Qdrant Mode.")

    def _ensure_collection(self):
        try:
            collections = self.client.get_collections()
            exist = any(c.name == self.collection_name for c in collections.collections)
            if not exist:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=self.vector_size,
                        distance=qmodels.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error checking/creating collection: {e}")
            raise e

    def _get_embedding(self, text: str) -> List[float]:
        if self.gemini_client:
            try:
                response = self.gemini_client.models.embed_content(
                    model="text-embedding-004",
                    contents=text
                )
                # The response will contain embedding
                if response.embedding and response.embedding.values:
                    return response.embedding.values
            except Exception as e:
                logger.error(f"Gemini embedding failed: {e}")
        
        # Fallback to random vector for mock or when keys are missing
        return [random.uniform(-1.0, 1.0) for _ in range(self.vector_size)]

    def upsert_transcripts(self, meeting_id: str, transcript_lines: List[str]):
        if not transcript_lines:
            return
        
        if not self.enabled or not self.client:
            logger.info(f"[Mock Qdrant] Indexed {len(transcript_lines)} lines for meeting {meeting_id}")
            return

        try:
            points = []
            for i, line in enumerate(transcript_lines):
                if not line.strip():
                    continue
                
                vector = self._get_embedding(line)
                point_id = str(uuid_from_string(f"{meeting_id}_{i}"))
                
                # Format of payload
                payload = {
                    "meeting_id": meeting_id,
                    "text": line,
                    "index": i
                }
                
                points.append(
                    qmodels.PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload
                    )
                )

            if points:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points
                )
                logger.info(f"Successfully upserted {len(points)} points to Qdrant for meeting {meeting_id}")
        except Exception as e:
            logger.error(f"Failed to upsert to Qdrant: {e}")

    def search_transcripts(self, query: str, meeting_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        if not self.enabled or not self.client:
            logger.info(f"[Mock Qdrant] Searching for query: {query}")
            return [
                {
                    "meeting_id": meeting_id or "mock-meeting-id",
                    "text": f"Mock Match: Alice said we will debug port conflicts tomorrow regarding {query}",
                    "score": 0.89
                }
            ]

        try:
            query_vector = self._get_embedding(query)
            
            # Filter by meeting ID if provided
            query_filter = None
            if meeting_id:
                query_filter = qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="meeting_id",
                            match=qmodels.MatchValue(value=meeting_id)
                        )
                    ]
                )

            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=limit
            )

            matches = []
            for r in results:
                matches.append({
                    "meeting_id": r.payload.get("meeting_id"),
                    "text": r.payload.get("text"),
                    "score": r.score
                })
            return matches
        except Exception as e:
            logger.error(f"Qdrant search failed: {e}")
            return []

import hashlib
import uuid

def uuid_from_string(val: str) -> uuid.UUID:
    hex_string = hashlib.md5(val.encode("utf-8")).hexdigest()
    return uuid.UUID(hex_string)
    
import os
qdrant_service = QdrantService()
