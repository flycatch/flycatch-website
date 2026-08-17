from __future__ import annotations

import json
from datetime import UTC, datetime

import boto3
from botocore.client import Config

from flycatch_api.config import settings


class ObjectStorageService:
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=Config(signature_version="s3v4"),
            use_ssl=settings.s3_use_ssl,
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            self._client.head_bucket(Bucket=settings.s3_bucket)
        except Exception:
            try:
                self._client.create_bucket(Bucket=settings.s3_bucket)
            except Exception:
                pass

    def put_bytes(self, key: str, body: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=body,
            ContentType=content_type,
        )

    def get_bytes(self, key: str) -> tuple[bytes, str] | None:
        try:
            response = self._client.get_object(Bucket=settings.s3_bucket, Key=key)
            body = response["Body"].read()
            content_type = response.get("ContentType") or "application/octet-stream"
            return body, content_type
        except Exception:
            return None

    def put_json(self, key: str, payload: dict) -> None:
        body = json.dumps(payload, default=str).encode("utf-8")
        self._client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=body,
            ContentType="application/json",
        )

    def get_json(self, key: str) -> dict | None:
        try:
            response = self._client.get_object(Bucket=settings.s3_bucket, Key=key)
            return json.loads(response["Body"].read().decode("utf-8"))
        except Exception:
            return None
