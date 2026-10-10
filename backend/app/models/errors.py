"""Consistent error model and exception classes."""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from fastapi import HTTPException
from pydantic import BaseModel


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE"
    INVALID_IMAGE_TYPE = "INVALID_IMAGE_TYPE"
    UPSTREAM_API_FAILURE = "UPSTREAM_API_FAILURE"
    NOT_FOUND = "NOT_FOUND"


class ApiError(BaseModel):
    code: ErrorCode
    message: str
    details: Optional[dict[str, Any]] = None


class AppException(HTTPException):
    """Base application exception that renders as the standard error shape."""

    def __init__(
        self,
        status_code: int,
        code: ErrorCode,
        message: str,
        details: Optional[dict[str, Any]] = None,
    ):
        self.error = ApiError(code=code, message=message, details=details)
        super().__init__(status_code=status_code, detail=self.error.model_dump())


class ValidationError(AppException):
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(400, ErrorCode.VALIDATION_ERROR, message, details)


class ImageTooLargeError(AppException):
    def __init__(self, max_mb: int = 5):
        super().__init__(
            413,
            ErrorCode.IMAGE_TOO_LARGE,
            f"Image exceeds the maximum size of {max_mb} MB.",
            {"max_size_mb": max_mb},
        )


class InvalidImageTypeError(AppException):
    def __init__(self):
        super().__init__(
            400,
            ErrorCode.INVALID_IMAGE_TYPE,
            "Only JPEG and PNG images are accepted. The uploaded file is not a valid image.",
        )


class ServiceUnavailableError(AppException):
    def __init__(self, service: str, message: Optional[str] = None):
        super().__init__(
            503,
            ErrorCode.SERVICE_UNAVAILABLE,
            message or f"{service} is temporarily unavailable. Please try again later.",
            {"service": service},
        )


class UpstreamApiError(AppException):
    def __init__(self, service: str, message: Optional[str] = None):
        super().__init__(
            502,
            ErrorCode.UPSTREAM_API_FAILURE,
            message or f"Failed to fetch data from {service}.",
            {"service": service},
        )
