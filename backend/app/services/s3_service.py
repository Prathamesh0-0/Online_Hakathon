import os
import logging
import boto3
from botocore.exceptions import ClientError
from app.config import settings

logger = logging.getLogger("s3_service")

class S3Service:
    def __init__(self):
        self.enabled = False
        self.client = None
        self.bucket_name = settings.AWS_S3_BUCKET
        self._local_fallback_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
            "scratch", 
            "s3_mock"
        )

        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
                )
                self.enabled = True
                logger.info(f"S3 client initialized for bucket: {self.bucket_name}")
            except Exception as e:
                logger.error(f"S3 initialization failed: {e}. Running in Local File Mock mode.")
        else:
            logger.warning("AWS S3 credentials not set. Running in Local File Mock mode.")

        if not self.enabled:
            os.makedirs(self._local_fallback_dir, exist_ok=True)
            logger.info(f"S3 mock storage folder initialized at: {self._local_fallback_dir}")

    def upload_transcript(self, meeting_id: str, content: str) -> str:
        key = f"transcripts/{meeting_id}.txt"
        
        if self.enabled and self.client:
            try:
                self.client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=content,
                    ContentType="text/plain"
                )
                s3_url = f"s3://{self.bucket_name}/{key}"
                logger.info(f"Uploaded transcript to S3: {s3_url}")
                return s3_url
            except ClientError as e:
                logger.error(f"Failed to upload to S3: {e}")
        
        # Local file fallback
        local_path = os.path.join(self._local_fallback_dir, f"{meeting_id}.txt")
        try:
            with open(local_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info(f"Saved transcript to local mock storage: {local_path}")
            return f"local://{local_path}"
        except Exception as ex:
            logger.error(f"Failed to save to local mock storage: {ex}")
            return ""

    def download_transcript(self, meeting_id: str) -> str:
        key = f"transcripts/{meeting_id}.txt"
        
        if self.enabled and self.client:
            try:
                response = self.client.get_object(Bucket=self.bucket_name, Key=key)
                return response["Body"].read().decode("utf-8")
            except Exception as e:
                logger.error(f"S3 download failed for {key}: {e}")
        
        # Local file fallback
        local_path = os.path.join(self._local_fallback_dir, f"{meeting_id}.txt")
        if os.path.exists(local_path):
            try:
                with open(local_path, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as ex:
                logger.error(f"Failed to read local mock storage: {ex}")
        
        return ""

s3_service = S3Service()
